from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de la base de datos (Modo sin autenticación)
DATABASE_URL = "postgresql://neondb_owner:npg_5YMu3DVOERrZ@ep-crimson-meadow-a5et8y5w-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Engine con configuración optimizada
engine = create_engine(
    DATABASE_URL,
    pool_size=20,            # Número máximo de conexiones
    max_overflow=10,         # Conexiones adicionales permitidas
    pool_pre_ping=True,      # Verifica conexiones activas
    pool_recycle=3600        # Recicla conexiones cada 1h
)

# Configuración de la sesión
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,        # Se añade para mayor control
    bind=engine,
    expire_on_commit=False  # Mejor manejo de objetos
)

Base = declarative_base()

def get_db():
    """
    Proveedor de sesiones de base de datos para FastAPI.
    Uso típico en endpoints:
    db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función opcional para inicialización de datos demo
def init_demo_data():
    """
    Crea datos demo iniciales (opcional para desarrollo).
    """
    from models import Therapist, Patient
    from datetime import datetime, date
    
    db = SessionLocal()
    try:
        # Datos demo de terapeuta (sin password_hash)
        demo_therapist = Therapist(
            full_name="Terapeuta Demo",
            email="demo@mindful.com",
            license_number="DEMO-001",
            created_at=datetime.now(),
            is_active=True
        )
        
        db.add(demo_therapist)
        db.commit()
        
        # Datos demo de paciente
        demo_patient = Patient(
            therapist_id=demo_therapist.id,
            full_name="Paciente Demo",
            birth_date=date(1990, 5, 15),
            gender="Otro",
            created_at=datetime.now(),
            is_active=True
        )
        
        db.add(demo_patient)
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"Error inicializando datos demo: {e}")
    finally:
        db.close()