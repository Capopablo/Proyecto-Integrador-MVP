import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileAudio } from "lucide-react";
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

  const form = useForm<SessionFormValues>({
    defaultValues: {
      patient_id: undefined,
      session_notes: "",
      emotional_score: 3,
      session_type: "regular",
      duration_minutes: 50,
    },
  });

  // --- EFECTO PARA CARGAR PACIENTES AL MONTAR EL COMPONENTE ---
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
  }, [user.id, form]); // Añadir 'form' a las dependencias si se usa en el efecto para evitar warnings, aunque react-hook-form gestiona sus estados internamente.

  // --- FUNCIÓN PARA ENVIAR EL FORMULARIO ---
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
                return `${err.loc.join('.')} - ${err.msg}`;
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido al guardar la sesión");
      console.error("Error saving session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

              {/* Notas de la Sesión */}
              <FormField
                control={form.control}
                name="session_notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notas de la Sesión*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalles importantes de la sesión..."
                        {...field}
                        rows={6}
                        required
                        minLength={10}
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

            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full md:w-auto" 
                disabled={isSubmitting || isLoadingPatients || patients.length === 0}
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