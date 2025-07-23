from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from routers.therapists import router as therapists_router
from models import Therapist, Patient, TherapySession
from schemas import TherapistCreate
from datetime import datetime

# Configuración inicial
app = FastAPI(title="API de Psicólogos Online (Modo Sin Login)",
              description="MVP operativo sin sistema de autenticación",
              version="1.0.0")

# Crea las tablas en la base de datos (solo para desarrollo)
Base.metadata.create_all(bind=engine)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ampliado para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluye routers principales
app.include_router(
    therapists_router,
    prefix="/api",  # Mejor organización de endpoints
    tags=["Terapeutas"]
)

# --- Endpoints principales ---
@app.get("/", tags=["Estado"])
def home():
    return {
        "message": "API de Psicólogos Online - Modo Demo",
        "user": {  # Usuario demo pre-autenticado
            "email": "admin@mindful.com",
            "full_name": "Administrador Demo",
            "role": "admin",
            "license_number": "DEMO-001"
        },
        "documentación": "/docs"
    }

@app.get("/api/healthcheck", tags=["Estado"])
def healthcheck():
    """Endpoint para verificar estado del servidor"""
    return {"status": "active", "timestamp": datetime.now().isoformat()}

# --- Endpoints de sesiones ---
@app.post("/api/patients/{patient_id}/sessions",
          tags=["Sesiones"],
          response_model=dict)
def create_session(
    patient_id: int,
    session_notes: str,
    session_date: datetime = None,
    db: Session = Depends(get_db)
):
    """
    Registra una nueva sesión terapéutica.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    new_session = TherapySession(
        patient_id=patient_id,
        session_notes=session_notes,
        session_date=session_date or datetime.now(),
    )

    db.add(new_session)
    db.commit()
    
    return {
        "message": "Sesión registrada exitosamente",
        "session_id": new_session.id
    }

# --- Endpoints legacy (actualizados) ---
@app.post("/api/therapists",
          tags=["Terapeutas"],
          response_model=dict)
def create_therapist(therapist: TherapistCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo terapeuta (sin autenticación).
    """
    # Verifica si el email ya está registrado
    existing_therapist = db.query(Therapist).filter(Therapist.email == therapist.email).first()
    if existing_therapist:
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado"
        )
    
    db_therapist = Therapist(
        full_name=therapist.full_name,
        email=therapist.email,
        license_number=therapist.license_number,
        password_hash="disabled"  # Campo requerido pero no usado
    )
    
    db.add(db_therapist)
    db.commit()
    return {
        "message": "Terapeuta registrado exitosamente",
        "therapist_id": db_therapist.id
    }

@app.get("/api/therapists",
         tags=["Terapeutas"],
         response_model=list[TherapistCreate])
def list_therapists(db: Session = Depends(get_db)):
    """
    Obtiene la lista completa de terapeutas registrados.
    """
    return db.query(Therapist).all()