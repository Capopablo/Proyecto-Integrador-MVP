# backend/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, date
import sys
from pathlib import Path

# --- CONFIGURACIÓN DE PATH ---
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# --- IMPORTANTE: Importar Base y models desde backend.models ---
from backend.models import Base # <--- Importa Base desde models.py
from backend import models # Para usar models.Therapist, models.Patient en init_demo_data
# --- FIN IMPORTACIONES ---

# Configuración de la base de datos (elige una opción)
DATABASE_URL = "postgresql://neondb_owner:npg_5YMu3DVOERrZ@ep-crimson-meadow-a5et8y5w-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

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

# Ya no se define Base aquí, se importa de models.py
# Base = declarative_base() # ¡ELIMINAR ESTA LÍNEA si estaba presente!

def get_db():
    """
    Proveedor de sesiones para FastAPI.
    Esta función es un generador que proporciona y cierra la sesión de DB.
    Uso en endpoints: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_demo_data():
    """Versión completa para inicializar todos los modelos con datos demo."""
    # IMPORTANTE: Usaremos los modelos directamente desde el módulo 'models'
    Therapist = models.Therapist
    Patient = models.Patient
    ClinicalRecord = models.ClinicalRecord
    TherapySession = models.TherapySession
    EmotionalEvaluation = models.EmotionalEvaluation
    Attachment = models.Attachment
    
    db = SessionLocal()
    try:
        # 1. Crear terapeuta
        therapist = Therapist(
            full_name="Dra. Ana Pérez",
            email="ana@demo.com",
            license_number="PSI-12345",
            password_hash="hashed_ana_password_demo",
            created_at=datetime.now(),
            is_active=True
        )
        db.add(therapist)
        db.commit()
        db.refresh(therapist)

        # 2. Crear paciente
        patient = Patient(
            therapist_id=therapist.id,
            full_name="Carlos Gómez",
            birth_date=date(1990, 8, 20),
            gender="Masculino",
            diagnosis="Ansiedad generalizada",
            medication="N/A",
            additional_notes="Paciente con historial de ansiedad. Busca técnicas de manejo de estrés.",
            created_at=datetime.now(),
            is_active=True
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

        # 3. Crear historial clínico
        record = ClinicalRecord(
            patient_id=patient.id,
            start_date=date(2023, 1, 15),
            last_update=datetime.now(),
            summary="Primera evaluación y establecimiento de línea base de síntomas.",
            pdf_export_url=None,
            is_active=True
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        # 4. Crear sesión
        session = TherapySession(
            patient_id=patient.id,
            therapist_id=therapist.id,
            clinical_record_id=record.id,
            session_date=datetime.now(),
            session_notes="El paciente mostró disposición a explorar sus ansiedades.",
            emotional_score=3,
            session_type="evaluación",
            duration_minutes=45,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # 5. Evaluación emocional
        evaluation = EmotionalEvaluation(
            session_id=session.id,
            patient_emotion_level=3,
            strategy_effectiveness=4,
            color_palette="#FFFFFF",
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
        print(f"❌ Error al crear datos demo: {str(e)}")
        raise # Re-lanzar para que el error sea visible en el startup de FastAPI
    finally:
        db.close()

# Para exportar todos los elementos importantes
__all__ = ['Base', 'engine', 'SessionLocal', 'get_db', 'init_demo_data']