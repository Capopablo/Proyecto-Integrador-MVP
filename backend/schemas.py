from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

# --- Therapist Schemas ---
class TherapistBase(BaseModel):
    full_name: str
    email: EmailStr
    license_number: str

class TherapistCreate(TherapistBase):
    password: str # Password en claro para creación (luego se hashea)

class TherapistOut(TherapistBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- ClinicalRecord Schemas ---
class ClinicalRecordBase(BaseModel):
    summary: str
    is_active: bool = True # Por defecto activo

class ClinicalRecordCreate(ClinicalRecordBase):
    # No necesitamos patient_id aquí si se pasa por la URL o se infiere
    pass

class ClinicalRecordOut(ClinicalRecordBase):
    id: int
    patient_id: int
    start_date: date
    last_update: datetime

    class Config:
        from_attributes = True

# --- TherapySession Schemas ---
class SessionBase(BaseModel):
    session_notes: str
    emotional_score: int
    session_type: str
    duration_minutes: int
    session_date: Optional[datetime] = None # Permitir que sea opcional para que el backend ponga datetime.now()

class SessionCreate(SessionBase):
    patient_id: int # <--- ¡ESTA ES LA MODIFICACIÓN CLAVE! Añadimos patient_id aquí.
    # clinical_record_id: Optional[int] = None # No lo necesitamos aquí si el backend lo asigna
    pass

class SessionOut(SessionBase):
    id: int
    patient_id: int # Necesitamos que patient_id esté en la salida también
    therapist_id: int
    clinical_record_id: Optional[int] = None # Ahora sí puede ser nulo, pero lo incluimos
    created_at: datetime # Asumiendo que también tienes un campo created_at en tu modelo SQLAlchemy

    class Config:
        from_attributes = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
    full_name: str
    birth_date: date # Usamos date para solo fecha
    gender: str
    diagnosis: Optional[str] = None
    medication: Optional[str] = None
    additional_notes: Optional[str] = None

class PatientCreate(PatientBase):
    therapist_id: int

# --- PacientOut con relaciones de sesiones y registros clínicos ---
class PatientOut(PatientBase):
    id: int
    therapist_id: int
    created_at: datetime
    is_active: bool
    
    # Listas para las relaciones: Pydantic las usará para serializar los objetos relacionados
    therapy_sessions: List[SessionOut] = [] 
    clinical_records: List[ClinicalRecordOut] = []

    class Config:
        from_attributes = True

# --- Standard Response ---
class StandardResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: dict