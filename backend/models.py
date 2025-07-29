# backend/models.py

from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base # <--- ¡IMPORTANTE! Base se define aquí.
import enum

# Define Base aquí. Esta es la ÚNICA instancia de declarative_base()
Base = declarative_base()

# Definiciones de Enum (sin cambios, están bien aquí)
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

class EmotionalLevelEnum(enum.Enum):
    VERY_LOW = 1
    LOW = 2
    NEUTRAL = 3
    HIGH = 4
    VERY_HIGH = 5

# Tus clases de modelo siguen siendo las mismas, heredando de la `Base` definida arriba.
class Therapist(Base):
    __tablename__ = "therapists"
    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    license_number = Column(String(50), unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    patients = relationship("Patient", back_populates="therapist", cascade="all, delete-orphan")

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
    therapist = relationship("Therapist", back_populates="patients")
    clinical_records = relationship("ClinicalRecord", back_populates="patient", cascade="all, delete-orphan")
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
    patient = relationship("Patient", back_populates="clinical_records")

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
    patient = relationship("Patient", back_populates="therapy_sessions") 
    emotional_evaluations = relationship("EmotionalEvaluation", back_populates="session", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="session", cascade="all, delete-orphan")


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