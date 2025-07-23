import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText } from "lucide-react";
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

// 1. Definimos el tipo para las props
interface SearchPatientsProps {
  user: {
    email: string;
    full_name: string;
    role: string;
  };
}

// Mock de datos (podrías mover esto a un archivo aparte)
const mockPatients = [
  { 
    id: "1", 
    name: "Juan Pérez", 
    age: 32, 
    gender: "Masculino",
    reason: "Ansiedad y estrés laboral",
    lastSession: new Date(2025, 3, 25),
    therapistId: "admin@mindful.com" // Añadimos referencia al terapeuta
  },
  // ... (otros pacientes)
];

interface SearchFilters {
  name: string;
  ageRange: string;
  reason: string;
}

const SearchPatients = ({ user }: SearchPatientsProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    name: "",
    ageRange: "",
    reason: "",
  });

  // Filtrar pacientes (añadiendo filtro por terapeuta si es necesario)
  const filteredPatients = mockPatients
    .filter(patient => patient.therapistId === user.email) // Solo pacientes del terapeuta actual
    .filter(patient => {
      const nameMatch = patient.name.toLowerCase().includes(filters.name.toLowerCase());
      
      let ageMatch = true;
      if (filters.ageRange) {
        if (filters.ageRange === "0-18") {
          ageMatch = patient.age <= 18;
        } else if (filters.ageRange === "19-30") {
          ageMatch = patient.age >= 19 && patient.age <= 30;
        } else if (filters.ageRange === "31-50") {
          ageMatch = patient.age >= 31 && patient.age <= 50;
        } else if (filters.ageRange === "50+") {
          ageMatch = patient.age > 50;
        }
      }
      
      const reasonMatch = filters.reason 
        ? patient.reason.toLowerCase().includes(filters.reason.toLowerCase()) 
        : true;
      
      return nameMatch && ageMatch && reasonMatch;
    });

  return (
    <PageContainer 
      title="Buscar Pacientes"
      subtitle={`Terapeuta: ${user.full_name} (${user.role})`}  // 2. Mostramos info del usuario
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
                <SelectItem value="all">Todas las edades</SelectItem>
                <SelectItem value="0-18">0-18 años</SelectItem>
                <SelectItem value="19-30">19-30 años</SelectItem>
                <SelectItem value="31-50">31-50 años</SelectItem>
                <SelectItem value="50+">Mayores de 50</SelectItem>
              </SelectContent>
            </Select>

            {/* Campo de búsqueda por motivo */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por motivo de consulta"
                className="pl-9"
                value={filters.reason}
                onChange={(e) => setFilters({...filters, reason: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <Card key={patient.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{patient.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-1 text-sm">
                  <p><span className="text-slate-500">Edad:</span> {patient.age} años</p>
                  <p><span className="text-slate-500">Género:</span> {patient.gender}</p>
                  <p><span className="text-slate-500">Motivo:</span> {patient.reason}</p>
                  {patient.lastSession && (
                    <p><span className="text-slate-500">Última sesión:</span> {patient.lastSession.toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link 
                  to={`/patient-history?patient=${patient.id}`} 
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
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-white/50 rounded-lg border border-slate-200">
          <p className="text-slate-500">No se encontraron pacientes con los filtros seleccionados</p>
        </div>
      )}
    </PageContainer>
  );
};

export default SearchPatients;