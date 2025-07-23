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

// 1. Definimos la interfaz para los valores del formulario
interface PatientFormValues {
  name: string;
  age: string;
  gender: string;
  reason: string;
  diagnosis: string;
  medication: string;
  other: string;
}

// 2. Definimos las props del componente
interface NewPatientProps {
  user: {
    email: string;
    full_name: string;
    role: string;
  };
}

const NewPatient = ({ user }: NewPatientProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Usamos useForm correctamente tipado
  const form = useForm<PatientFormValues>({
    defaultValues: {
      name: "",
      age: "",
      gender: "",
      reason: "",
      diagnosis: "",
      medication: "",
      other: "",
    },
  });

  const onSubmit = (data: PatientFormValues) => {
    setIsSubmitting(true);
    
    console.log("Paciente creado por:", user.email);
    
    setTimeout(() => {
      console.log("Patient data:", data);
      toast.success("Paciente guardado exitosamente");
      form.reset();
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <PageContainer 
      title="Nuevo Paciente" 
      subtitle={`Terapeuta: ${user.full_name} (${user.role})`}
    >
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
        {/* 4. Usamos el componente Form de shadcn/ui */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Datos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Edad" 
                        min="0" 
                        max="120" 
                        {...field} 
                        required 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resto del formulario... */}
            {/* ... */}

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