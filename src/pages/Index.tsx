import { Link } from "react-router-dom";
import { UserPlus, FilePlus, FileText, Search, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import PageContainer from '@/components/PageContainer'; // Importa PageContainer si lo usas
import { User } from '../App'; // Importa la interfaz User desde App.tsx

// 1. Define las props esperadas para el componente Index
interface IndexProps {
  user: User; // Declara que Index espera una prop 'user' de tipo User
}

// 2. Asegúrate de que tu componente Index reciba las props
const Index = ({ user }: IndexProps) => {
  const actions = [
    {
      title: "Nuevo Paciente",
      description: "Registrar un nuevo paciente en el sistema",
      icon: UserPlus,
      color: "text-blue-500",
      path: "/new-patient",
    },
    {
      title: "Nueva Sesión",
      description: "Iniciar una nueva sesión terapéutica",
      icon: FilePlus,
      color: "text-green-500",
      path: "/new-session",
    },
    {
      title: "Historial del Paciente",
      description: "Ver historial completo de sesiones",
      icon: FileText,
      color: "text-violet-500",
      path: "/patient-history",
    },
    {
      title: "Buscar Pacientes",
      description: "Buscar y gestionar pacientes existentes",
      icon: Search,
      color: "text-orange-500",
      path: "/search-patients",
    },
    {
      title: "Ver Estadísticas",
      description: "Analizar datos y tendencias",
      icon: BarChart2,
      color: "text-cyan-500",
      path: "/statistics",
    },
  ];

  return (
    <PageContainer 
      title={`Bienvenido, ${user.full_name}`} // Título personalizado
      subtitle={`Tu rol es: ${user.role}. ¡Tu ID de terapeuta es: ${user.id}!`} // Subtítulo personalizado
    >
      <div className="text-center mb-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 text-transparent bg-clip-text mb-4">
          aPSIstance
        </h1>
        <p className="text-slate-600 text-lg md:text-xl">
          Gestión eficiente para un acompañamiento de calidad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <Link to={action.path} key={action.title} className="block">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/50 backdrop-blur-sm border border-slate-200 h-full">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`${action.color}`}>
                  <action.icon size={32} />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {action.title}
                </h2>
                <p className="text-sm text-slate-600">{action.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
};

export default Index;