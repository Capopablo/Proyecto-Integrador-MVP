# backend/main.py

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import ValidationError
import sys
from pathlib import Path
import os
import io # Todavía útil para manejar bytes en memoria si es necesario
import numpy as np
import ffmpeg # Para procesamiento de audio
import tempfile # Para manejar archivos temporales de forma segura

# --- IMPORTACIONES PARA WHISPER LOCAL ---
from transformers import pipeline
import torch
# --- FIN IMPORTACIONES ---

# --- CONFIGURACIÓN DE RUTA DE FFMPEG ---
ffmpeg_bin_path = r"C:\ffmpeg\bin" 

if ffmpeg_bin_path not in os.environ["PATH"]:
    os.environ["PATH"] += os.pathsep + ffmpeg_bin_path
    print(f"Añadida la ruta de FFmpeg al PATH de la aplicación: {ffmpeg_bin_path}")
else:
    print(f"La ruta de FFmpeg ya está en el PATH de la aplicación: {ffmpeg_bin_path}")
# --- FIN CONFIGURACIÓN DE RUTA DE FFMPEG ---

# --- CONFIGURACIÓN PARA IMPORTACIONES ABSOLUTAS ---
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend import models, schemas
from backend.database import engine, get_db
# --- FIN CONFIGURACIÓN EN IMPORTACIONES ---

from sqlalchemy.orm import Session
from fastapi import Depends

# Crear todas las tablas definidas en models.Base
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Tu frontend Vite/React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CARGAR EL MODELO WHISPER GLOBALMENTE AL INICIAR LA APP ---
whisper_pipeline = None
try:
    print("Cargando modelo Whisper 'base'...")
    
    whisper_pipeline = pipeline(
        "automatic-speech-recognition", 
        model="openai/whisper-base",
        chunk_length_s=30,
        device=-1 # Usar CPU. Si tienes GPU NVIDIA con CUDA configurado, puedes intentar device=0.
    )
    print("Modelo Whisper cargado exitosamente.")
except Exception as e:
    print(f"Error al cargar el modelo Whisper: {e}")


# --- Endpoint para la raíz (existente) ---
@app.get("/")
def read_root():
    return {"message": "Welcome to Mindful Therapy Compass API"}

# --- Endpoints de Pacientes ---
@app.get("/api/patients", response_model=List[schemas.PatientBase])
async def get_patients(therapist_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Patient)
    if therapist_id:
        query = query.filter(models.Patient.therapist_id == therapist_id)
    patients = query.all()
    if not patients:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "No patients found for this therapist."})
    return patients

@app.get("/api/patients/{patient_id}", response_model=schemas.PatientOut)
async def get_patient_history(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient

@app.post("/api/patients", response_model=schemas.PatientOut, status_code=status.HTTP_201_CREATED)
async def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.post("/api/patients/{patient_id}/sessions", response_model=schemas.SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session_for_patient(
    patient_id: int,
    session: schemas.SessionCreate,
    db: Session = Depends(get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={"detail": "Paciente no encontrado."})

    db_session = models.Session(
        **session.dict(),
        patient_id=patient_id,
        therapist_id=patient.therapist_id
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

# --- ENDPOINT PARA TRANSCRIPCION DE AUDIO USANDO WHISPER LOCAL (con ffmpeg-python y archivo temporal) ---
@app.post("/api/transcribe-audio")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language: str = Form(None)
):
    """
    Recibe un archivo de audio, lo guarda temporalmente, lo preprocesa con ffmpeg-python
    y lo transcribe usando el modelo OpenAI Whisper (local), devolviendo el texto.
    """
    if not whisper_pipeline:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"detail": "El modelo de transcripción de voz no está cargado o disponible. Revisa los logs del servidor."}
        )

    if not audio_file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "El archivo subido no es un archivo de audio válido."}
        )

    # Crear un archivo temporal para guardar el audio subido
    tmp_file_path = None
    try:
        # Usamos NamedTemporaryFile para una gestión segura de archivos temporales.
        # El sufijo se basa en el content_type para ayudar a FFmpeg, aunque no es estrictamente necesario.
        suffix = "." + audio_file.content_type.split('/')[-1] if '/' in audio_file.content_type else ".tmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            await audio_file.seek(0) # Asegúrate de que el puntero de lectura esté al inicio
            tmp_file.write(await audio_file.read())
            tmp_file_path = tmp_file.name # Guarda la ruta del archivo temporal

        # Usar ffmpeg-python para procesar el audio desde el archivo temporal
        # -i tmp_file_path: archivo de entrada temporal
        # -f s16le: formato de salida PCM de 16 bits little-endian (sin comprimir)
        # -acodec pcm_s16le: códec PCM de 16 bits
        # -ac 1: audio mono
        # -ar 16000: sample rate de 16 kHz (lo que Whisper espera)
        # pipe:1: enviar la salida a stdout
        # -loglevel quiet: para suprimir la salida verbosa de ffmpeg
        
        process = (
            ffmpeg
            .input(tmp_file_path) # ¡Ahora leemos desde el archivo temporal!
            .output('pipe:1', format='s16le', acodec='pcm_s16le', ac=1, ar=16000, loglevel='quiet')
            .run_async(pipe_stdout=True, pipe_stderr=True)
        )
        
        # Capturar la salida de ffmpeg
        out, err = process.communicate()

        if process.returncode != 0:
            error_message = err.decode().strip() if err else "Error desconocido de FFmpeg."
            print(f"Error de FFmpeg (código {process.returncode}): {error_message}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al procesar el audio con FFmpeg: {error_message}"
            )

        # Convertir los bytes de salida a un array de NumPy (float32, normalizado)
        audio_np = np.frombuffer(out, dtype=np.int16).astype(np.float32) / 32768.0

        # El pipeline de transformers puede recibir un array de NumPy directamente
        transcription_result = whisper_pipeline(
            audio_np, # Pasar el array de NumPy directamente
            generate_kwargs={"language": "spanish", "task": "transcribe"}
        )
        
        transcribed_text = transcription_result["text"]

        return {"transcribed_text": transcribed_text}

    except ffmpeg.Error as e:
        error_message = e.stderr.decode().strip() if e.stderr else "Error desconocido de FFmpeg."
        print(f"Error de FFmpeg al procesar el audio: {error_message}")
        raise HTTPException(status_code=500, detail=f"Error de FFmpeg: {error_message}")
    except Exception as e:
        print(f"Error inesperado durante la transcripción: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": f"Error interno del servidor durante la transcripción: {e}"}
        )
    finally:
        # Asegurarse de eliminar el archivo temporal
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)