import { useState } from "react";
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

// 1. Definimos los tipos
interface SessionFormValues {
  patientId: string;
  summary: string;
  audioFile?: File;
  therapistRating?: number;
  patientRating?: number;
}

interface NewSessionProps {
  user: {
    email: string;
    full_name: string;
    role: string;
  };
}

// Mock de pacientes para el selector
const mockPatients = [
  { id: "1", name: "Juan Pérez" },
  { id: "2", name: "María García" },
  { id: "3", name: "Carlos López" },
  { id: "4", name: "Ana Rodríguez" },
];

const NewSession = ({ user }: NewSessionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const form = useForm<SessionFormValues>({
    defaultValues: {
      patientId: "",
      summary: "",
      therapistRating: undefined,
      patientRating: undefined,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
    }
  };

  const onSubmit = (data: SessionFormValues) => {
    setIsSubmitting(true);

    // Añadir el archivo de audio a los datos si existe
    if (audioFile) {
      data.audioFile = audioFile;
    }

    // Registrar qué terapeuta creó la sesión
    console.log("Sesión creada por:", user.email);

    // Simulando envío de datos
    setTimeout(() => {
      console.log("Session data:", data);
      toast.success("Sesión guardada exitosamente");
      form.reset();
      setAudioFile(null);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <PageContainer 
      title="Nueva Sesión" 
      subtitle={`Terapeuta: ${user.full_name} (${user.role})`}  // 2. Mostramos info del usuario
    >
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Todo el formulario se mantiene igual */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seleccionar Paciente*</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    required
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockPatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resto del formulario permanece igual */}
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen de la sesión*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Escribe un resumen detallado de la sesión" 
                      className="min-h-[150px]" 
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Audio de la sesión (opcional)</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("audioFile")?.click()}
                  className="gap-2"
                >
                  <FileAudio className="h-4 w-4" />
                  {audioFile ? "Cambiar archivo" : "Cargar audio"}
                </Button>
                {audioFile && (
                  <span className="text-sm text-slate-600">
                    {audioFile.name}
                  </span>
                )}
                <input
                  id="audioFile"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <FormField
                control={form.control}
                name="therapistRating"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EmotionalRating 
                        label="Evaluación nivel de éxito de la sesión para el terapeuta" 
                        value={field.value} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patientRating"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EmotionalRating 
                        label="Estado emocional del paciente" 
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
                disabled={isSubmitting}
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