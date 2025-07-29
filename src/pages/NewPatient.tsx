import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User } from '../App'; // Asegúrate de importar User desde App.tsx

interface PatientFormValues {
  full_name: string;
  birth_date: string;
  gender: "Masculino" | "Femenino" | "Otro";
  diagnosis?: string;
  medication?: string;
  additional_notes?: string;
}

interface NewPatientProps {
  user: User; // Usa la interfaz User importada
}

const NewPatient = ({ user }: NewPatientProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Omit<PatientFormValues, 'therapist_id'>>({
    defaultValues: {
      full_name: "",
      birth_date: "",
      gender: "Masculino",
      diagnosis: "",
      medication: "",
      additional_notes: "",
    },
  });

  const onSubmit = async (data: Omit<PatientFormValues, 'therapist_id'>) => {
    setIsSubmitting(true);
    
    try {
      console.log("Datos del formulario (data) recibidos por onSubmit:", data); 
      console.log("ID del usuario logueado (user.id):", user.id);
      
      const bodyToSend = {
          ...data, 
          therapist_id: user.id 
      };
      console.log("Cuerpo JSON a enviar (bodyToSend):", bodyToSend); 

      const response = await fetch("http://localhost:8000/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // --- AÑADIDO: Log del error completo del backend ---
        console.error("Respuesta de error completa del backend:", errorData);
        // --- Fin de añadido ---

        let errorMessage = "Error desconocido al guardar el paciente.";

        if (errorData && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
        } else if (errorData && Array.isArray(errorData.detail)) {
            const validationErrors = errorData.detail.map((err: any) => {
                if (err.loc && err.loc.includes('body') && err.loc.includes('therapist_id') && err.msg.includes('Field required')) {
                    return "El ID del terapeuta no pudo ser asignado automáticamente. Por favor, intente de nuevo.";
                }
                return `${err.loc.join('.')} - ${err.msg}`;
            });
            errorMessage = `Errores de validación: ${validationErrors.join("; ")}`;
        } else if (errorData && typeof errorData.detail === 'object') {
            // Si el 'detail' es un objeto (como en HTTPException(detail={"code":..., "detail":...}) )
            errorMessage = errorData.detail.detail || errorData.detail.message || JSON.stringify(errorData.detail);
        } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Respuesta del backend al crear paciente (EXITO):", result);
      toast.success(`Paciente ${result.full_name} registrado con éxito`);
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido al guardar el paciente.");
      console.error("Error al guardar paciente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer 
      title="Nuevo Paciente" 
      // ELIMINAMOS COMPLETAMENTE la prop 'subtitle' de aquí
      // subtitle={`Terapeuta: ${user.full_name} (${user.role})`} <-- Esta línea es la que quitamos
    >
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre Completo */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre completo" 
                        {...field} 
                        required 
                        minLength={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha de Nacimiento */}
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento*</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        required 
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Género */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar género" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Diagnóstico */}
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Diagnóstico principal"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medicación */}
              <FormField
                control={form.control}
                name="medication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicación</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Medicación actual"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notas Adicionales */}
              <FormField
                control={form.control}
                name="additional_notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notas Adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Otras observaciones"
                        {...field}
                        rows={4}
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
                {isSubmitting ? "Guardando..." : "Guardar Paciente"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
};

export default NewPatient;