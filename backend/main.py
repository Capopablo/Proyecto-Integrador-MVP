# backend/main.py

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import List, Optional

# Importaciones locales
from database import engine, Base, get_db, init_demo_data
from models import Therapist, Patient, TherapySession, ClinicalRecord
from schemas import (
    TherapistCreate, TherapistOut,
    PatientCreate, PatientOut,
    SessionCreate, SessionOut,
    ClinicalRecordOut,
    StandardResponse, ErrorResponse
)

# --------------------------
# CONFIGURACIÓN INICIAL
# --------------------------
app = FastAPI(
    title="Mindful Therapy Compass API",
    description="Sistema de gestión clínica para psicólogos",
    version="2.2.0",
    docs_url="/api/docs",
    redoc_url=None,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Tu frontend React con Vite
        "http://127.00.0.1:5173",    # A veces localhost se resuelve como 127.0.0.1
        "http://localhost:3000",    # Por si usas Create React App en el futuro
        "http://127.0.0.1:3000"     # Lo mismo para 127.0.0.1
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Crear tablas al inicio (solo desarrollo)
@app.on_event("startup")
def startup():
    print(f"INFO [{datetime.now()}]: Intentando eliminar todas las tablas existentes...")
    # Base.metadata.drop_all(bind=engine) # <--- Esta línea DEBE ESTAR COMENTADA para uso normal
    print(f"INFO [{datetime.now()}]: Tablas existentes eliminadas (si existían).")

    print(f"INFO [{datetime.now()}]: Creando todas las tablas nuevas...")
    Base.metadata.create_all(bind=engine) # Esto crea las tablas con los nuevos nombres/estructuras
    print(f"INFO [{datetime.now()}]: Tablas creadas exitosamente.")

    db = next(get_db())
    try:
        if db.query(Therapist).first() is None:
            print(f"INFO [{datetime.now()}]: No hay terapeutas en la base de datos, creando datos demo...")
            init_demo_data()
            print(f"INFO [{datetime.now()}]: Datos demo creados exitosamente.")
        else:
            print(f"INFO [{datetime.now()}]: Ya existen terapeutas en la base de datos, no se crearon datos demo adicionales.")
    except Exception as e:
        print(f"ERROR [{datetime.now()}]: al intentar crear datos demo en el startup: {e}")
    finally:
        db.close()

# --------------------------
# ENDPOINTS DE TERAPEUTAS
# --------------------------
@app.post(
    "/api/therapists",
    response_model=TherapistOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Terapeutas"],
    summary="Crear nuevo terapeuta"
)
def create_therapist(
    therapist: TherapistCreate,
    db: Session = Depends(get_db)
):
    """Registra un nuevo terapeuta en el sistema"""
    existing = db.query(Therapist).filter(Therapist.email == therapist.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail={"code": "THERAPIST_EXISTS", "detail": "Email ya registrado"}
        )
    
    try:
        db_therapist = Therapist(
            full_name=therapist.full_name,
            email=therapist.email,
            license_number=therapist.license_number,
            password_hash="hashed_" + therapist.password # Esto es un placeholder, deberías usar un hashing real
        )
        db.add(db_therapist)
        db.commit()
        db.refresh(db_therapist)
        return db_therapist
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"code": "DB_ERROR", "detail": str(e)}
        )

@app.get(
    "/api/therapists",
    response_model=List[TherapistOut],
    tags=["Terapeutas"],
    summary="Listar todos los terapeutas"
)
def list_therapists(db: Session = Depends(get_db)):
    return db.query(Therapist).all()

# --------------------------
# ENDPOINTS DE PACIENTES
# --------------------------
@app.post(
    "/api/patients",
    response_model=PatientOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Pacientes"],
    summary="Crear nuevo paciente"
)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    """
    Registra un nuevo paciente asociado a un terapeuta
    y crea un registro clínico inicial para él.
    """
    therapist = db.query(Therapist).get(patient.therapist_id)
    if not therapist:
        raise HTTPException(
            status_code=404,
            detail={"code": "THERAPIST_NOT_FOUND", "detail": "Terapeuta no existe"}
        )
    
    try:
        db_patient = Patient(
            full_name=patient.full_name,
            birth_date=patient.birth_date,
            gender=patient.gender,
            therapist_id=patient.therapist_id,
            diagnosis=patient.diagnosis,
            medication=patient.medication,
            additional_notes=patient.additional_notes
        )
        db.add(db_patient)
        db.flush() # Importante: db.flush() para que db_patient.id esté disponible antes del commit
        db.refresh(db_patient)

        # --- MODIFICACIÓN CLAVE: CREAR UN REGISTRO CLÍNICO INICIAL ---
        initial_clinical_record = ClinicalRecord(
            patient_id=db_patient.id,
            start_date=datetime.now().date(), # Solo la fecha
            last_update=datetime.now(),     # Fecha y hora completa
            summary="Registro inicial creado automáticamente al dar de alta al paciente.",
            is_active=True
        )
        db.add(initial_clinical_record)
        # --- FIN MODIFICACIÓN CLAVE ---

        db.commit() # Ahora se guarda el paciente Y el registro clínico
        db.refresh(db_patient) # Refrescar db_patient para incluir el nuevo clinical_record si necesario (joinedload)
        return db_patient
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail={"code": "PATIENT_CREATION_FAILED", "detail": str(e)}
        )

@app.get(
    "/api/patients",
    response_model=List[PatientOut],
    tags=["Pacientes"],
    summary="Listar pacientes filtrados por terapeuta"
)
def list_patients(
    therapist_id: Optional[int] = Query(None, description="Filtrar por ID de terapeuta"),
    db: Session = Depends(get_db)
):
    """Obtiene todos los pacientes, con filtro opcional por terapeuta"""
    query = db.query(Patient)
    
    if therapist_id is not None:
        query = query.filter(Patient.therapist_id == therapist_id)
    
    patients = query.order_by(Patient.full_name.asc()).all()
    
    return patients

@app.get(
    "/api/patients/{patient_id}",
    response_model=PatientOut,
    tags=["Pacientes"],
    summary="Obtener detalles de un paciente, incluyendo historial de sesiones y registros clínicos"
)
def get_patient_history(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene un paciente por ID, cargando sus sesiones y registros clínicos asociados.
    """
    patient = (
        db.query(Patient)
        .options(
            joinedload(Patient.therapy_sessions),
            joinedload(Patient.clinical_records)
        )
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail={"code": "PATIENT_NOT_FOUND", "detail": "Paciente no existe"}
        )
    return patient

# --------------------------
# ENDPOINTS DE SESIONES
# --------------------------
@app.post(
    "/api/patients/{patient_id}/sessions",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Sesiones"],
    summary="Crear nueva sesión"
)
def create_session(
    patient_id: int,
    session_data: SessionCreate,
    db: Session = Depends(get_db)
):
    """Crea una nueva sesión terapéutica y la asocia al último registro clínico activo del paciente."""
    patient = db.query(Patient).get(patient_id)
    if not patient:
        raise HTTPException(
            status_code=404,
            detail={"code": "PATIENT_NOT_FOUND", "detail": "Paciente no existe"}
        )
    
    # --- Asignar clinical_record_id (la lógica ya estaba, pero ahora debería encontrar uno) ---
    clinical_record_id_to_associate: Optional[int] = None
    last_clinical_record = db.query(ClinicalRecord)\
                             .filter(ClinicalRecord.patient_id == patient_id, ClinicalRecord.is_active == True)\
                             .order_by(ClinicalRecord.last_update.desc())\
                             .first()
    
    if last_clinical_record:
        clinical_record_id_to_associate = last_clinical_record.id
    # --- FIN Asignación ---

    try:
        new_session = TherapySession(
            patient_id=patient_id,
            therapist_id=patient.therapist_id,
            session_notes=session_data.session_notes,
            emotional_score=session_data.emotional_score,
            session_type=session_data.session_type,
            duration_minutes=session_data.duration_minutes,
            session_date=session_data.session_date or datetime.now(),
            clinical_record_id=clinical_record_id_to_associate
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session
    except Exception as e:
        db.rollback()
        print(f"ERROR al guardar la sesión en la DB: {e}") 
        raise HTTPException(
            status_code=500,
            detail={"code": "SESSION_CREATION_FAILED", "detail": f"Error al guardar la sesión: {str(e)}"}
        )

@app.get(
    "/api/patients/{patient_id}/sessions",
    response_model=List[SessionOut],
    tags=["Sesiones"],
    summary="Obtener sesiones de paciente"
)
def get_sessions(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene todas las sesiones de un paciente específico"""
    sessions = db.query(TherapySession).filter(
        TherapySession.patient_id == patient_id
    ).order_by(
        TherapySession.session_date.desc()
    ).all()
    
    if not sessions:
        return []
    return sessions

# --------------------------
# ENDPOINTS ADICIONALES
# --------------------------
@app.get("/", tags=["Root"], include_in_schema=False)
def root():
    return {"message": "API Mindful Therapy Compass"}

@app.get("/api/healthcheck", tags=["Estado"])
def healthcheck():
    return StandardResponse(
        message="Servicio operativo",
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)