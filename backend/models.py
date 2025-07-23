from sqlalchemy import Column, Integer, String, Text, Boolean, Date, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    license_number = Column(String(50), unique=True)
    # CAMPO ELIMINADO: password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP)
    is_active = Column(Boolean, default=True)

    patients = relationship("Patient", back_populates="therapist", cascade="all, delete-orphan")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id", ondelete="CASCADE"))
    full_name = Column(String(100), nullable=False)
    birth_date = Column(Date)
    gender = Column(String(20))
    diagnosis = Column(Text)
    medication = Column(Text)
    additional_notes = Column(Text)
    created_at = Column(TIMESTAMP)
    is_active = Column(Boolean, default=True)

    therapist = relationship("Therapist", back_populates="patients")
    clinical_records = relationship("ClinicalRecord", back_populates="patient", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="patient", cascade="all, delete-orphan")

class ClinicalRecord(Base):
    __tablename__ = "clinical_records"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    start_date = Column(Date, nullable=False)
    last_update = Column(TIMESTAMP)
    summary = Column(Text)
    pdf_export_url = Column(Text)
    is_active = Column(Boolean, default=True)

    patient = relationship("Patient", back_populates="clinical_records")
    sessions = relationship("Session", back_populates="clinical_record")

class TherapySession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    clinical_record_id = Column(Integer, ForeignKey("clinical_records.id"))
    session_date = Column(TIMESTAMP, nullable=False)
    session_notes = Column(Text)
    transcript = Column(Text)
    summary = Column(Text)
    tags = Column(JSON)
    duration_minutes = Column(Integer)
    is_online = Column(Boolean)
    created_at = Column(TIMESTAMP)

    patient = relationship("Patient", back_populates="sessions")
    clinical_record = relationship("ClinicalRecord", back_populates="sessions")
    emotional_evaluations = relationship("EmotionalEvaluation", back_populates="session", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="session", cascade="all, delete-orphan")

class EmotionalEvaluation(Base):
    __tablename__ = "emotional_evaluations"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"))
    patient_emotion_level = Column(Integer)
    strategy_effectiveness = Column(Integer)
    color_palette = Column(String(7))
    created_at = Column(TIMESTAMP)

    session = relationship("Session", back_populates="emotional_evaluations")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"))
    file_url = Column(Text, nullable=False)
    file_type = Column(String(50))
    uploaded_at = Column(TIMESTAMP)

    session = relationship("Session", back_populates="attachments")