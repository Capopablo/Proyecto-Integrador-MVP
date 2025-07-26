import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, Loader2 } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Tipos para los datos reales del backend
interface Patient {
  id: number;
  full_name: string;
  birth_date: string;
  gender: string;
  diagnosis?: string;
  therapist_id: number;
}

interface SearchPatientsProps {
  user: {
    email: string;
    full_name: string;
    role: string;
    id: number;
  };
}

interface SearchFilters {
  name: string;
  ageRange: string;
  diagnosis: string;
}

const SearchPatients = ({ user }: SearchPatientsProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    name: "",
    ageRange: "",
    diagnosis: "",
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener pacientes del backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/patients?therapist_id=${user.id}`);
        if (!response.ok) throw new Error("Error al cargar pacientes");
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        toast.error("No se pudieron cargar los pacientes");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user.id]);

  // Calcular edad a partir de la fecha de nacimiento
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  // Filtrar pacientes
  const filteredPatients = patients.filter(patient => {
    const nameMatch = patient.full_name.toLowerCase().includes(filters.name.toLowerCase());
    
    let ageMatch = true;
    if (filters.ageRange) {
      const age = calculateAge(patient.birth_date);
      if (filters.ageRange === "0-18") {
        ageMatch = age <= 18;
      } else if (filters.ageRange === "19-30") {
        ageMatch = age >= 19 && age <= 30;
      } else if (filters.ageRange === "31-50") {
        ageMatch = age >= 31 && age <= 50;
      } else if (filters.ageRange === "50+") {
        ageMatch = age > 50;
      }
    }
    
    const diagnosisMatch = filters.diagnosis 
      ? (patient.diagnosis || "").toLowerCase().includes(filters.diagnosis.toLowerCase()) 
      : true;
    
    return nameMatch && ageMatch && diagnosisMatch;
  });

  return (
    <PageContainer 
      title="Buscar Pacientes"
      subtitle={`Terapeuta: ${user.full_name} (${user.role})`}
    >
      {/* Panel de filtros */}
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campo de búsqueda por nombre */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por nombre"
                className="pl-9"
                value={filters.name}
                onChange={(e) => setFilters({...filters, name: e.target.value})}
              />
            </div>
            
            {/* Selector de rango de edad */}
            <Select 
              onValueChange={(value) => setFilters({...filters, ageRange: value})}
              value={filters.ageRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por edad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las edades</SelectItem>
                <SelectItem value="0-18">0-18 años</SelectItem>
                <SelectItem value="19-30">19-30 años</SelectItem>
                <SelectItem value="31-50">31-50 años</SelectItem>
                <SelectItem value="50+">Mayores de 50</SelectItem>
              </SelectContent>
            </Select>

            {/* Campo de búsqueda por diagnóstico */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por diagnóstico"
                className="pl-9"
                value={filters.diagnosis}
                onChange={(e) => setFilters({...filters, diagnosis: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => {
            const age = calculateAge(patient.birth_date);
            return (
              <Card key={patient.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">Edad:</span> {age} años</p>
                    <p><span className="text-slate-500">Género:</span> {patient.gender}</p>
                    {patient.diagnosis && (
                      <p><span className="text-slate-500">Diagnóstico:</span> {patient.diagnosis}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Link 
                    to={`/patient-history/${patient.id}`} 
                    className="w-full"
                  >
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                    >
                      <FileText className="h-4 w-4" /> 
                      Ver Historial
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 bg-white/50 rounded-lg border border-slate-200">
          <p className="text-slate-500">
            {patients.length === 0 
              ? "No hay pacientes registrados" 
              : "No se encontraron pacientes con los filtros seleccionados"}
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default SearchPatients;