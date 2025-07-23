"""
ARCHIVO COMENTADO - AUTH.PY
Este archivo contiene la lógica original de autenticación que ha sido desactivada
para el modo sin login. Se conserva como referencia para futuras implementaciones.
"""

# from datetime import datetime, timedelta
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# from fastapi import APIRouter, HTTPException, status, Depends
# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from sqlalchemy.orm import Session
# from models import Therapist
# from database import get_db
# from typing import Optional

# # ==============================================
# # CONFIGURACIÓN DE SEGURIDAD (COMENTADA)
# # ==============================================
# # SECRET_KEY = "tu_clave_secreta_superlarga_y_compleja"  # Cambia esto en producción!
# # ALGORITHM = "HS256"
# # ACCESS_TOKEN_EXPIRE_MINUTES = 30

# # ==============================================
# # CONFIGURACIÓN DEL ROUTER (COMENTADA)
# # ==============================================
# # router = APIRouter(prefix="/auth", tags=["Authentication"])

# # ==============================================
# # CONFIGURACIÓN OAUTH2 (COMENTADA)
# # ==============================================
# # oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
# # pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # ==============================================
# # FUNCIONES DE SEGURIDAD (COMENTADAS)
# # ==============================================
# # def get_password_hash(password: str) -> str:
# #     return pwd_context.hash(password)

# # def verify_password(plain_password: str, hashed_password: str) -> bool:
# #     return pwd_context.verify(plain_password, hashed_password)

# # ==============================================
# # FUNCIONES JWT (COMENTADAS)
# # ==============================================
# # def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
# #     to_encode = data.copy()
# #     expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
# #     to_encode.update({"exp": expire})
# #     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# # def decode_token(token: str):
# #     try:
# #         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
# #         return payload
# #     except JWTError:
# #         raise HTTPException(
# #             status_code=status.HTTP_401_UNAUTHORIZED,
# #             detail="Token inválido o expirado",
# #             headers={"WWW-Authenticate": "Bearer"},
# #         )

# # ==============================================
# # AUTENTICACIÓN (COMENTADA)
# # ==============================================
# # def authenticate_user(db: Session, email: str, password: str):
# #     user = db.query(Therapist).filter(Therapist.email == email).first()
# #     if not user or not verify_password(password, user.password_hash):
# #         return None
# #     return user

# # ==============================================
# # ENDPOINT DE LOGIN (COMENTADO)
# # ==============================================
# # @router.post("/login")
# # async def login(
# #     form_data: OAuth2PasswordRequestForm = Depends(),
# #     db: Session = Depends(get_db)
# # ):
# #     # Debugging: Verificar datos recibidos
# #     print(f"\n=== DEBUG LOGIN ===")
# #     print(f"Email recibido: '{form_data.username}'")
# #     print(f"Contraseña recibida: '{form_data.password}'")
    
# #     user = db.query(Therapist).filter(Therapist.email == form_data.username).first()
    
# #     if user:
# #         print(f"\nUsuario encontrado en DB:")
# #         print(f"Email en DB: '{user.email}'")
# #         print(f"Hash en DB: '{user.password_hash}'")
# #         print(f"Resultado verificación: {verify_password(form_data.password, user.password_hash)}")
# #     else:
# #         print("\nUsuario NO encontrado en DB")
    
# #     # Autenticación normal
# #     user = authenticate_user(db, form_data.username, form_data.password)
# #     if not user:
# #         print("\n=== AUTENTICACIÓN FALLIDA ===")
# #         raise HTTPException(
# #             status_code=status.HTTP_401_UNAUTHORIZED,
# #             detail="Credenciales incorrectas",
# #             headers={"WWW-Authenticate": "Bearer"},
# #         )
    
# #     print("\n=== AUTENTICACIÓN EXITOSA ===")
# #     access_token = create_access_token(data={"sub": user.email})
    
# #     return {
# #         "access_token": access_token,
# #         "token_type": "bearer",
# #         "user": {
# #             "email": user.email,
# #             "full_name": user.full_name,
# #             "license_number": user.license_number
# #         }
# #     }

# # ==============================================
# # ADMINISTRACIÓN DE USUARIOS (COMENTADA)
# # ==============================================
# # def create_admin_user(db: Session):
# #     admin_email = "admin@mindful.com"
# #     admin = db.query(Therapist).filter(Therapist.email == admin_email).first()
    
# #     if admin:
# #         return admin
        
# #     new_admin = Therapist(
# #         email=admin_email,
# #         password_hash=get_password_hash("Admin123"),
# #         full_name="Admin Principal",
# #         license_number="ADMIN-001",
# #         is_active=True
# #     )
    
# #     db.add(new_admin)
# #     db.commit()
# #     return new_admin

# # ==============================================
# # DEPENDENCIAS FASTAPI (COMENTADAS)
# # ==============================================
# # def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
# #     credentials_exception = HTTPException(
# #         status_code=status.HTTP_401_UNAUTHORIZED,
# #         detail="No se pudieron validar las credenciales",
# #         headers={"WWW-Authenticate": "Bearer"},
# #     )
# #     try:
# #         payload = decode_token(token)
# #         email: str = payload.get("sub")
# #         if email is None:
# #             raise credentials_exception
# #     except JWTError:
# #         raise credentials_exception
        
# #     user = db.query(Therapist).filter(Therapist.email == email).first()
# #     if user is None:
# #         raise credentials_exception
# #     return user

# ==============================================
# NOTA: Este archivo se conserva como referencia
# para futuras implementaciones de autenticación
# ==============================================