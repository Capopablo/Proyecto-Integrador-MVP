# backend/models.py

from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column # Importar Mapped y mapped_column para tipado moderno si lo vas a usar, aunque con Column y relationship también funciona. Los dejo por si acaso te planteas la migración.
from database import Base
import enum # Importar el módulo enum para usarlo

# Definiciones de Enum (importante para tipado y validación)
class GenderEnum(enum.Enum):
    Masculino = "Masculino"
    Femenino = "Femenino"
    Otro = "Otro"
    No_binario = "No binario"

class SessionTypeEnum(enum.Enum):
    regular = "regular"
    evaluación = "evaluación"
    emergencia = "emergencia"
    seguimiento = "seguimiento"

class EmotionalLevelEnum(enum.Enum): # Este Enum se mapea a un Integer en la DB
    VERY_LOW = 1
    LOW = 2
    NEUTRAL = 3
    HIGH = 4
    VERY_HIGH = 5

class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    license_number = Column(String(50), unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Relación a Pacientes
    patients = relationship("Patient", back_populates="therapist", cascade="all, delete-orphan")
    # Opcional: Relación a Sesiones (si un terapeuta puede tener sesiones directamente, no solo a través de pacientes)
    # therapy_sessions = relationship("TherapySession", back_populates="therapist", cascade="all, delete-orphan")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(100), nullable=False)
    birth_date = Column(Date, nullable=False)
    gender = Column(Enum(GenderEnum), nullable=False)
    diagnosis = Column(Text)
    medication = Column(Text)
    additional_notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Relaciones
    therapist = relationship("Therapist", back_populates="patients")
    clinical_records = relationship("ClinicalRecord", back_populates="patient", cascade="all, delete-orphan")
    # Renombrando 'sessions' a 'therapy_sessions' para mayor claridad y consistencia con el nombre de la tabla
    # Esto debe coincidir con el atributo usado en joinedload(Patient.therapy_sessions)
    therapy_sessions = relationship("TherapySession", back_populates="patient", cascade="all, delete-orphan") 

class ClinicalRecord(Base):
    __tablename__ = "clinical_records"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    last_update = Column(DateTime, server_default=func.now(), onupdate=func.now())
    summary = Column(Text, nullable=False)
    pdf_export_url = Column(Text)
    is_active = Column(Boolean, default=True)

    # Relación
    patient = relationship("Patient", back_populates="clinical_records")
    # NO Añadir relationship a TherapySession aquí si la relación es 1-N (record-sessions)
    # y ya está manejada vía patient.therapy_sessions, para evitar ambigüedades.
    # Si fuera 1-1 y quisieras acceder directamente, sí.

class TherapySession(Base):
    __tablename__ = "therapy_sessions" 

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    clinical_record_id = Column(Integer, ForeignKey("clinical_records.id"), nullable=True) 
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False) 

    session_date = Column(DateTime, server_default=func.now(), nullable=False)
    session_notes = Column(Text, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    emotional_score = Column(Integer, nullable=False)
    session_type = Column(Enum(SessionTypeEnum), nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    # Relaciones
    # back_populates debe coincidir con el nombre del atributo relationship en Patient
    patient = relationship("Patient", back_populates="therapy_sessions") 
    
    # Relación inversa a ClinicalRecord (opcional, si realmente la necesitas aquí)
    # clinical_record = relationship("ClinicalRecord", back_populates="sessions_from_clinical_record") # Ejemplo de un nombre distinto

    # Relación con EmotionalEvaluation y Attachment
    emotional_evaluations = relationship("EmotionalEvaluation", back_populates="session", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="session", cascade="all, delete-orphan")

    # Opcional: Relación inversa con Therapist
    # therapist = relationship("Therapist", back_populates="therapy_sessions")


class EmotionalEvaluation(Base):
    __tablename__ = "emotional_evaluations"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("therapy_sessions.id", ondelete="CASCADE"), nullable=False) 
    patient_emotion_level = Column(Integer, nullable=False)
    strategy_effectiveness = Column(Integer, nullable=False)
    color_palette = Column(String(7))
    created_at = Column(DateTime, server_default=func.now())

    session = relationship("TherapySession", back_populates="emotional_evaluations")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("therapy_sessions.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=False)
    file_type = Column(String(50))
    uploaded_at = Column(DateTime, server_default=func.now())

    session = relationship("TherapySession", back_populates="attachments")