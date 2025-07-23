from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models import Therapist
from passlib.context import CryptContext
import logging

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def debug_verify(plain: str, hashed: str) -> bool:
    """Función de verificación con logs detallados"""
    try:
        result = pwd_context.verify(plain, hashed)
        logger.info(f"Verificación: {'ÉXITO' if result else 'FALLO'}")
        logger.info(f"Hash almacenado: {hashed}")
        return result
    except Exception as e:
        logger.error(f"Error en verificación: {str(e)}")
        return False

@router.post("/login")
async def super_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Debug 1: Verifica datos recibidos
    logger.info(f"\n🔍 Intento de login - Email: {form_data.username}")

    # Busca usuario con coincidencia exacta (case-sensitive)
    user = db.query(Therapist).filter(Therapist.email == form_data.username).first()
    
    if not user:
        logger.error("❌ Usuario no existe en BD")
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    # Debug 2: Muestra hash almacenado
    logger.info(f"🔑 Hash en BD: {user.password_hash[:30]}...")

    # Verificación ultra-detallada
    if not debug_verify(form_data.password, user.password_hash):
        logger.error("🔒 Contraseña no coincide")
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    # Éxito
    logger.info("✅ Login exitoso!")
    return {"status": "success", "user": user.email}