from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional
from enum import Enum

# --- Enums para opciones predefinidas ---
class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    NON_BINARY = "non_binary"  # Añadido para mayor inclusividad

class FileType(str, Enum):
    PDF = "pdf"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"  # Nuevo tipo añadido

# --- Esquemas de Terapeutas (Actualizados) ---
class TherapistBase(BaseModel):
    full_name: str = Field(..., max_length=100, example="Ana Pérez López")
    email: EmailStr = Field(..., example="terapeuta@ejemplo.com")
    license_number: str = Field(..., max_length=50, example="COP-12345")

class TherapistCreate(TherapistBase):
    """
    Schema para creación de terapeutas (sin campo de password).
    """
    pass  # Todos los campos heredados de TherapistBase

class TherapistOut(TherapistBase):
    """
    Schema para respuesta de terapeutas (incluye campos adicionales).
    """
    id: int
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Permite ORM mode

# --- Esquemas de Pacientes ---
class PatientBase(BaseModel):
    full_name: str = Field(..., max_length=100, example="Carlos Gómez")
    therapist_id: int = Field(..., example=1)
    birth_date: Optional[date] = Field(None, example="1990-05-15")
    gender: Optional[Gender] = Field(None, example=Gender.OTHER)
    diagnosis: Optional[str] = Field(None, max_length=500)
    medication: Optional[str] = Field(None, max_length=500)

class PatientCreate(PatientBase):
    """
    Schema para creación de pacientes.
    """
    pass  # Todos los campos heredados de PatientBase

class PatientOut(PatientBase):
    """
    Schema para respuesta de pacientes (incluye campos adicionales).
    """
    id: int
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Esquemas de Sesiones ---
class SessionBase(BaseModel):
    patient_id: int = Field(..., example=1)
    session_date: datetime = Field(..., example="2023-11-20T10:30:00")
    session_notes: Optional[str] = Field(None, example="Sesión productiva...")
    duration_minutes: Optional[int] = Field(None, ge=5, le=240, example=50)

class SessionCreate(SessionBase):
    """
    Schema para creación de sesiones.
    """
    pass

class SessionOut(SessionBase):
    """
    Schema para respuesta de sesiones.
    """
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Esquema para respuestas genéricas ---
class Message(BaseModel):
    """
    Schema para mensajes de respuesta estándar.
    """
    detail: str = Field(..., example="Operación exitosa")