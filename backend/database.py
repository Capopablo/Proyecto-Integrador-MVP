from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, date

# Configuración de la base de datos (elige una opción)

# Opción 1: PostgreSQL (Neon.tech)
DATABASE_URL = "postgresql://neondb_owner:npg_5YMu3DVOERrZ@ep-crimson-meadow-a5et8y5w-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Opción 2: SQLite (para desarrollo local)
# DATABASE_URL = "sqlite:///./test.db"

# Configuración del motor de base de datos
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600
    )

# Configuración de la sesión
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

Base = declarative_base()

def get_db():
    """
    Proveedor de sesiones para FastAPI.
    Uso en endpoints: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_demo_data():
    """Versión completa para inicializar todos los modelos"""
    from models import Therapist, Patient, ClinicalRecord, TherapySession, EmotionalEvaluation, Attachment
    
    db = SessionLocal()
    try:
        # 1. Crear terapeuta
        therapist = Therapist(
            full_name="Dra. Ana Pérez",
            email="ana@demo.com",
            license_number="PSI-12345",
            password_hash="hashed_ana_password_demo", # <-- CAMBIO CLAVE AQUÍ: Añadir password_hash
            created_at=datetime.now(),
            is_active=True
        )
        db.add(therapist)
        db.commit()
        db.refresh(therapist) # Refresh para obtener el ID generado

        # 2. Crear paciente
        patient = Patient(
            therapist_id=therapist.id,
            full_name="Carlos Gómez",
            birth_date=date(1990, 8, 20),
            gender="Masculino", # Asegúrate de que esto coincida con el Enum en models.py
            diagnosis="Ansiedad generalizada",
            medication="N/A", # Añadido campo medication
            additional_notes="Paciente con historial de ansiedad. Busca técnicas de manejo de estrés.", # Ajustado para PatientCreate
            created_at=datetime.now(),
            is_active=True
        )
        db.add(patient)
        db.commit()
        db.refresh(patient) # Refresh para obtener el ID generado

        # 3. Crear historial clínico
        record = ClinicalRecord(
            patient_id=patient.id,
            start_date=date(2023, 1, 15),
            last_update=datetime.now(),
            summary="Primera evaluación y establecimiento de línea base de síntomas.", # Summary es nullable=False en models
            pdf_export_url=None, # Puede ser None
            is_active=True
        )
        db.add(record)
        db.commit()
        db.refresh(record) # Refresh para obtener el ID generado

        # 4. Crear sesión
        session = TherapySession(
            patient_id=patient.id,
            therapist_id=therapist.id, # <-- MUY IMPORTANTE: therapist_id es requerido
            clinical_record_id=record.id,
            session_date=datetime.now(),
            session_notes="El paciente mostró disposición a explorar sus ansiedades.",
            emotional_score=3, # <-- Añadido emotional_score (nullable=False en models)
            session_type="evaluación", # <-- Añadido session_type (nullable=False en models)
            duration_minutes=45,
            # is_online=False # Este campo lo comentaste en models.py, así que lo removemos o comentamos aquí
        )
        db.add(session)
        db.commit()
        db.refresh(session) # Refresh para obtener el ID generado

        # 5. Evaluación emocional
        evaluation = EmotionalEvaluation(
            session_id=session.id,
            patient_emotion_level=3, # <-- nullable=False en models
            strategy_effectiveness=4, # <-- nullable=False en models
            color_palette="#FFFFFF", # O un valor adecuado
            created_at=datetime.now()
        )
        db.add(evaluation)
        db.commit()

        # 6. Adjunto (Opcional, si quieres crear uno)
        attachment = Attachment(
            session_id=session.id,
            file_url="https://ejemplo.com/documento_demo.pdf",
            file_type="pdf",
            uploaded_at=datetime.now()
        )
        db.add(attachment)
        db.commit()

        print("✅ Todos los datos demo creados exitosamente!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear datos demo: {str(e)}") # Mensaje más descriptivo
        raise # Re-lanzar para que el error sea visible en el startup de FastAPI
    finally:
        db.close()

# Para exportar todos los elementos importantes
__all__ = ['Base', 'engine', 'SessionLocal', 'get_db', 'init_demo_data']