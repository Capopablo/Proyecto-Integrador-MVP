import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileAudio, Mic, StopCircle, RefreshCcw, Loader2 } from "lucide-react";
import PageContainer from "@/components/PageContainer"; // <--- CORRECTO: SIN LLAVES
import EmotionalRating from "@/components/EmotionalRating";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // CORRECTO: CON ALIAS @/

// --- Importar useReactMediaRecorder ---
import { useReactMediaRecorder } from "react-media-recorder";

interface Patient {
  id: number;
  full_name: string;
  // Otros campos del paciente si son necesarios, ej: birth_date, gender
}

interface SessionFormValues {
  patient_id: number;
  session_notes: string;
  emotional_score: number;
  session_type: "regular" | "evaluación" | "emergencia" | "seguimiento";
  duration_minutes: number;
  // Si añadieras un DatePicker para la sesión, sería:
  // session_date?: string; // Formato YYYY-MM-DD o ISO string
}

interface NewSessionProps {
  user: {
    email: string;
    full_name: string;
    role: string;
    id: number; // Añadido para el therapist_id
  };
}

const NewSession = ({ user }: NewSessionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  // --- NUEVOS ESTADOS PARA GRABACIÓN Y TRANSCRIPCIÓN ---
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // --- CONFIGURACIÓN DE useReactMediaRecorder ---
  const {
    status, // 'idle', 'recording', 'stopped', 'acquiring_media'
    startRecording,
    stopRecording,
    clearBlobUrl, // Para limpiar el audio grabado
    mediaBlobUrl, // URL del Blob de audio cuando la grabación se detiene
  } = useReactMediaRecorder({
    audio: true
  });

  const form = useForm<SessionFormValues>({
    defaultValues: {
      patient_id: undefined,
      session_notes: "",
      emotional_score: 3,
      session_type: "regular",
      duration_minutes: 50,
    },
  });

  // --- EFECTO PARA CARGAR PACIENTES ---
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoadingPatients(true);
        // CAMBIO CLAVE AQUÍ: Puerto 5000 a 8000
        const response = await fetch(`http://localhost:8000/api/patients?therapist_id=${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Error al cargar pacientes");
        }

        const data: Patient[] = await response.json();
        setPatients(data);
        if (data.length > 0) {
            form.setValue("patient_id", data[0].id); // Selecciona el primer paciente por defecto
        }
      } catch (error) {
        toast.error(`Error al cargar pacientes: ${error instanceof Error ? error.message : "Desconocido"}`);
        console.error("Error fetching patients:", error);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [user.id, form]);

  // --- FUNCIÓN PARA ENVIAR EL FORMULARIO (EXISTENTE) ---
  const onSubmit = async (data: SessionFormValues) => {
    setIsSubmitting(true);
    
    // Asegurar que patient_id sea un número, ya que el select lo devuelve como string
    const patientIdAsNumber = typeof data.patient_id === 'string' ? parseInt(data.patient_id, 10) : data.patient_id;

    if (!patientIdAsNumber) {
        toast.error("Por favor, selecciona un paciente.");
        setIsSubmitting(false);
        return;
    }

    try {
      console.log("Datos del formulario (data) recibidos por onSubmit:", data);
      console.log("ID del paciente para el endpoint:", patientIdAsNumber);

      const bodyToSend = {
        patient_id: patientIdAsNumber,
        session_notes: data.session_notes,
        emotional_score: data.emotional_score,
        session_type: data.session_type,
        duration_minutes: data.duration_minutes,
        // session_date: data.session_date, // Si se implementa un DatePicker
      };
      console.log("Cuerpo JSON a enviar (bodyToSend):", bodyToSend);

      const response = await fetch(`http://localhost:8000/api/patients/${patientIdAsNumber}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Respuesta de error completa del backend:", errorData); // Para debug

        let errorMessage = "Error desconocido al guardar la sesión.";

        if (errorData && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
        } else if (errorData && Array.isArray(errorData.detail)) {
            // Errores de validación de Pydantic
            const validationErrors = errorData.detail.map((err: any) => {
                return `${err.loc.join('.')}: ${err.msg}`;
            });
            errorMessage = `Errores de validación: ${validationErrors.join("; ")}`;
        } else if (errorData && typeof errorData.detail === 'object' && errorData.detail.detail) {
            // Si el 'detail' es un objeto con un campo 'detail' dentro (como en tus HTTPException con diccionarios)
            errorMessage = errorData.detail.detail;
        } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(`Sesión guardada con éxito para ${patients.find(p => p.id === result.patient_id)?.full_name || 'paciente desconocido'}`);
      form.reset({
        patient_id: patientIdAsNumber, // Mantener el paciente seleccionado después de guardar
        session_notes: "",
        emotional_score: 3,
        session_type: "regular",
        duration_minutes: 50,
      });
      clearBlobUrl(); // Limpiar el audio grabado después de guardar la sesión
      setTranscriptionError(null); // Limpiar cualquier error de transcripción
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido al guardar la sesión");
      console.error("Error saving session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NUEVA FUNCIÓN PARA TRANSCRIPCION DE AUDIO ---
  const handleTranscribeAudio = useCallback(async () => {
    if (!mediaBlobUrl) {
      toast.error("No hay audio grabado para transcribir.");
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError(null); // Limpiar errores anteriores

    try {
      // Convertir Blob URL a Blob de archivo
      const audioBlob = await fetch(mediaBlobUrl).then(res => res.blob());
      // Ajusta el nombre del archivo y el tipo si es necesario
      const audioFile = new File([audioBlob], `session_audio_${Date.now()}.webm`, { type: mediaBlobUrl.includes('webm') ? 'audio/webm' : 'audio/wav' });

      const formData = new FormData();
      formData.append("audio_file", audioFile);
      formData.append("language", "es"); // Hardcoded for Spanish for now

      // Enviar el audio al nuevo endpoint del backend
      const response = await fetch("http://localhost:8000/api/transcribe-audio", {
        method: "POST",
        body: formData, // FormData no necesita 'Content-Type' en los headers, el navegador lo añade
      });

      if (!response.ok) {
        const errorData = await response.json();
        const msg = errorData.detail?.detail || errorData.detail || "Error desconocido al transcribir el audio.";
        throw new Error(msg);
      }

      const result = await response.json();
      if (result.transcribed_text) {
        form.setValue("session_notes", result.transcribed_text);
        toast.success("Audio transcrito con éxito.");
      } else {
        toast.warning("La transcripción no devolvió texto.");
      }
    } catch (error) {
      console.error("Error during audio transcription:", error);
      const msg = error instanceof Error ? error.message : String(error);
      setTranscriptionError(msg);
      toast.error(`Error al transcribir audio: ${msg}`);
    } finally {
      setIsTranscribing(false);
    }
  }, [mediaBlobUrl, form]);

  // --- EFECTO PARA DISPARAR LA TRANSCRIPCIÓN CUANDO mediaBlobUrl CAMBIA A UN VALOR ---
  useEffect(() => {
    if (status === 'stopped' && mediaBlobUrl) {
      handleTranscribeAudio();
    }
  }, [status, mediaBlobUrl, handleTranscribeAudio]);


  return (
    <PageContainer
      title="Nueva Sesión"
      subtitle={`Terapeuta: ${user.full_name} (${user.role})`}
    >
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selector de Paciente */}
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger disabled={isLoadingPatients || patients.length === 0}>
                          <SelectValue placeholder={isLoadingPatients ? "Cargando pacientes..." : (patients.length === 0 ? "No hay pacientes disponibles" : "Seleccionar paciente")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={String(patient.id)}>
                            {patient.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Sesión */}
              <FormField
                control={form.control}
                name="session_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Sesión*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="evaluación">Evaluación</SelectItem>
                        <SelectItem value="emergencia">Emergencia</SelectItem>
                        <SelectItem value="seguimiento">Seguimiento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duración de la Sesión */}
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (minutos)*</FormLabel>
                    <FormControl>
                      <input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        min={10} 
                        max={240} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Puntuación emocional del paciente (ej. EmotionalRating) */}
              <FormField
                control={form.control}
                name="emotional_score"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EmotionalRating 
                        label="Estado emocional del paciente (1-5)" 
                        value={field.value} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div> {/* Fin grid de 2 columnas */}

            {/* --- CONTROLES DE GRABACIÓN DE AUDIO --- */}
            <div className="space-y-4 border-t pt-6 mt-6 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <FileAudio className="h-5 w-5" /> Transcribir Sesión con Audio
              </h3>
              <div className="flex items-center space-x-4">
                {/* Botón Iniciar Grabación */}
                <Button
                  type="button"
                  onClick={startRecording}
                  disabled={status === 'recording' || status === 'acquiring_media' || isTranscribing}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {status === 'acquiring_media' ? 'Iniciando...' : 'Grabar Audio'}
                </Button>

                {/* Botón Detener Grabación */}
                <Button
                  type="button"
                  onClick={stopRecording}
                  disabled={status !== 'recording' || isTranscribing}
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Detener Grabación
                </Button>

                {/* Botón Limpiar Audio */}
                {mediaBlobUrl && (
                  <Button
                    type="button"
                    onClick={() => {
                      clearBlobUrl();
                      form.setValue("session_notes", ""); // Limpiar también las notas
                      setTranscriptionError(null);
                    }}
                    variant="outline"
                    disabled={isTranscribing}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Borrar Audio
                  </Button>
                )}
              </div>

              {/* Mensajes de estado de grabación */}
              {status === 'recording' && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <Mic className="h-4 w-4 animate-pulse" /> Grabando...
                </p>
              )}
              {status === 'stopped' && !isTranscribing && !transcriptionError && mediaBlobUrl && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <FileAudio className="h-4 w-4" /> Audio listo para transcripción.
                </p>
              )}
              {isTranscribing && (
                <p className="text-sm text-blue-600 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Transcribiendo audio... Esto puede tardar un momento.
                </p>
              )}
              {transcriptionError && (
                <p className="text-sm text-red-600">
                  Error de transcripción: {transcriptionError}
                </p>
              )}
            </div>
            {/* --- FIN CONTROLES DE GRABACIÓN DE AUDIO --- */}

            {/* Notas de la Sesión (ahora puede ser rellenado por la transcripción) */}
            <FormField
              control={form.control}
              name="session_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas de la Sesión*</FormLabel>
                  <FormControl>
                    {/* Aumentado las filas para mejor visualización */}
                    <Textarea
                      placeholder="Detalles importantes de la sesión..."
                      {...field}
                      rows={8} 
                      required
                      minLength={10}
                      disabled={isTranscribing} // Desactivar mientras se transcribe
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full md:w-auto" 
                disabled={isSubmitting || isLoadingPatients || patients.length === 0 || isTranscribing}
              >
                {isSubmitting ? "Guardando..." : "Guardar Sesión"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
};

export default NewSession;