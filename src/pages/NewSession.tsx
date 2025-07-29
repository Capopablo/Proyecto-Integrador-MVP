import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileAudio, Mic, StopCircle, RefreshCcw, Loader2 } from "lucide-react";
import PageContainer from "@/components/PageContainer";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { useReactMediaRecorder } from "react-media-recorder";

interface Patient {
  id: number;
  full_name: string;
}

interface SessionFormValues {
  patient_name: string; 
  session_notes: string;
  emotional_score: number;
  session_type: "regular" | "evaluación" | "emergencia" | "seguimiento";
  duration_minutes: number;
}

interface NewSessionProps {
  user: {
    email: string;
    full_name: string;
    role: string;
    id: number;
  };
}

const NewSession = ({ user }: NewSessionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]); 
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const {
    status,
    startRecording,
    stopRecording,
    clearBlobUrl,
    mediaBlobUrl,
  } = useReactMediaRecorder({
    audio: true
  });

  const form = useForm<SessionFormValues>({
    defaultValues: {
      patient_name: "",
      session_notes: "",
      emotional_score: 3,
      session_type: "regular",
      duration_minutes: 50,
    },
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoadingPatients(true);
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
      } catch (error) {
        toast.error(`Error al cargar pacientes: ${error instanceof Error ? error.message : "Desconocido"}`);
        console.error("Error fetching patients:", error);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [user.id]); 

  const onSubmit = async (data: SessionFormValues) => {
    setIsSubmitting(true);
    
    const selectedPatient = patients.find(
        (p) => p.full_name.toLowerCase() === data.patient_name.toLowerCase().trim()
    );

    if (!selectedPatient) {
        toast.error("Paciente no encontrado. Por favor, selecciona un paciente de la lista de sugerencias o escribe el nombre completo correctamente.");
        setIsSubmitting(false);
        return;
    }

    // --- AÑADE ESTOS CONSOLE.LOGS PARA DEPURAR ---
    console.log("--- Depuración de patient_id ---");
    console.log("selectedPatient:", selectedPatient);
    console.log("selectedPatient.id (valor original):", selectedPatient.id);
    console.log("typeof selectedPatient.id (tipo original):", typeof selectedPatient.id);
    console.log("Number(selectedPatient.id) (valor convertido):", Number(selectedPatient.id));
    console.log("typeof Number(selectedPatient.id) (tipo convertido):", typeof Number(selectedPatient.id));
    // --- FIN CONSOLE.LOGS DE DEPURACIÓN ---

    try {
      const bodyToSend = {
        patient_id: Number(selectedPatient.id), 
        session_notes: data.session_notes,
        emotional_score: data.emotional_score,
        session_type: data.session_type,
        duration_minutes: data.duration_minutes,
      };
      
      console.log("Cuerpo JSON a enviar (bodyToSend):", bodyToSend); // Reconfirma el objeto completo
      console.log("Tipo de patient_id en el objeto final:", typeof bodyToSend.patient_id); // Reconfirma el tipo final

      const response = await fetch(`http://localhost:8000/api/sessions`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Respuesta de error completa del backend:", errorData);

        let errorMessage = "Error desconocido al guardar la sesión.";

        if (errorData && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
        } else if (errorData && Array.isArray(errorData.detail)) {
            const validationErrors = errorData.detail.map((err: any) => {
                const loc = err.loc.join('.');
                return `${loc || 'campo'}: ${err.msg}`;
            });
            errorMessage = `Errores de validación: ${validationErrors.join("; ")}`;
        } else if (errorData && typeof errorData.detail === 'object' && errorData.detail.detail) {
            errorMessage = errorData.detail.detail;
        } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(`Sesión guardada con éxito para ${selectedPatient.full_name}`);
      form.reset({
        patient_name: "",
        session_notes: "",
        emotional_score: 3,
        session_type: "regular",
        duration_minutes: 50,
      });
      clearBlobUrl();
      setTranscriptionError(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido al guardar la sesión");
      console.error("Error saving session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTranscribeAudio = useCallback(async () => {
    if (!mediaBlobUrl) {
      toast.error("No hay audio grabado para transcribir.");
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      const audioBlob = await fetch(mediaBlobUrl).then(res => res.blob());
      const audioFile = new File([audioBlob], `session_audio_${Date.now()}.webm`, { type: mediaBlobUrl.includes('webm') ? 'audio/webm' : 'audio/wav' });

      const formData = new FormData();
      formData.append("audio_file", audioFile);
      formData.append("language", "es");

      const response = await fetch("http://localhost:8000/api/transcribe-audio", {
        method: "POST",
        body: formData,
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

  useEffect(() => {
    if (status === 'stopped' && mediaBlobUrl) {
      handleTranscribeAudio();
    }
  }, [status, mediaBlobUrl, handleTranscribeAudio]);


  return (
    <PageContainer
      title="Nueva Sesión"
      // ELIMINAMOS COMPLETAMENTE la prop 'subtitle' de aquí
      // subtitle={`Terapeuta: ${user.full_name} (${user.role})`} <-- Esta línea es la que quitamos
    >
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="patient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Escribe el nombre del paciente y selecciona"
                        {...field}
                        list="patients-list" 
                        disabled={isLoadingPatients} 
                        required
                      />
                    </FormControl>
                    <datalist id="patients-list">
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.full_name} />
                      ))}
                    </datalist>
                    <FormMessage />
                    {isLoadingPatients && <p className="text-sm text-muted-foreground mt-1">Cargando pacientes...</p>}
                    {!isLoadingPatients && patients.length === 0 && <p className="text-sm text-red-500 mt-1">No hay pacientes registrados para este terapeuta.</p>}
                  </FormItem>
                )}
              />

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
                      <FormMessage />
                    </Select>
                  </FormItem>
                )}
              />

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

            </div>

            <div className="space-y-4 border-t pt-6 mt-6 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <FileAudio className="h-5 w-5" /> Transcribir Sesión con Audio
              </h3>
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  onClick={startRecording}
                  disabled={status === 'recording' || status === 'acquiring_media' || isTranscribing}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {status === 'acquiring_media' ? 'Iniciando...' : 'Grabar Audio'}
                </Button>

                <Button
                  type="button"
                  onClick={stopRecording}
                  disabled={status !== 'recording' || isTranscribing}
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Detener Grabación
                </Button>

                {mediaBlobUrl && (
                  <Button
                    type="button"
                    onClick={() => {
                      clearBlobUrl();
                      form.setValue("session_notes", "");
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

            <FormField
              control={form.control}
              name="session_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas de la Sesión*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles importantes de la sesión..."
                      {...field}
                      rows={8}
                      required
                      minLength={10}
                      disabled={isTranscribing}
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