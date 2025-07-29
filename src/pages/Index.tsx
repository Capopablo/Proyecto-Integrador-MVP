// src/pages/Index.tsx
import { Link } from "react-router-dom";
import { UserPlus, FilePlus, FileText, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import PageContainer from '@/components/PageContainer';
import { User } from '../App';

interface IndexProps {
  user: User;
}

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
      title: "Estadísticas",
      description: "Datos y tendencias", // Modificado: Eliminada la palabra "Analizar"
      icon: BarChart2,
      color: "text-cyan-500",
      path: "/statistics",
      isSmall: true,
      isCentered: true,
    },
  ];

  return (
    <PageContainer
      // Eliminamos por completo las props 'title' y 'subtitle'
      // El PageContainer no generará ningún encabezado en esta página.
    >
      <div className="text-center mb-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 text-transparent bg-clip-text mb-4">
          aPSIstance
        </h1>
        <p className="text-slate-600 text-lg md:text-xl">
          Gestión eficiente para un acompañamiento de calidad.
        </p>
      </div>

      {/* Ajustamos el contenedor de las acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr items-end">
        {actions.map((action, index) => (
          <Link
            to={action.path}
            key={action.title}
            className={`block ${
              // Si es la última acción y queremos centrarla
              action.isCentered
                ? 'col-span-1 md:col-span-2 lg:col-span-3 flex justify-center' // Ocupa todas las columnas disponibles para centrar
                : ''
            }`}
          >
            <Card
              className={`p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/50 backdrop-blur-sm border border-slate-200 h-full flex flex-col justify-center items-center text-center space-y-4 ${
                action.isSmall ? 'p-4' : ''
              } ${
                action.isCentered ? 'w-full max-w-sm' : '' // Define un ancho máximo para la tarjeta centrada
              }`}
            >
              <div className={`${action.color}`}>
                <action.icon size={action.isSmall ? 24 : 32} />
              </div>
              <h2 className={`font-semibold text-slate-800 ${action.isSmall ? 'text-lg' : 'text-xl'}`}>
                {action.title}
              </h2>
              <p className={`text-slate-600 ${action.isSmall ? 'text-xs' : 'text-sm'}`}>{action.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
};

export default Index;