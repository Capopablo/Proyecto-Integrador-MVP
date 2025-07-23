import { useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, FilePlus, FileText, Search, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";

// 1. Definimos el tipo de props para el componente
type Props = {
  user: {
    email: string;
    full_name: string;
    role: string;
  };
};

const Index = ({ user }: Props) => {  // 2. Añadimos las props
  // Verificación silenciosa del backend (solo para desarrollo)
  useEffect(() => {
    const apiUrl = 'http://127.0.0.1:5000';
    
    fetch(`${apiUrl}/api/test`)
      .then(res => res.json())
      .then(data => console.log('✅ Backend conectado:', data))
      .catch(err => console.error('❌ Error de conexión:', err));
  }, []);

  const actions = [
    {
      title: "Nuevo Paciente",
      description: "Registrar un nuevo paciente en el sistema",
      icon: UserPlus,
      color: "text-blue-500",
      path: "/new-patient",
    },
    // ... (resto de tus acciones permanecen igual)
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="container mx-auto max-w-4xl pt-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 text-transparent bg-clip-text mb-4">
            aPSIstance
          </h1>
          {/* 3. Mostramos el nombre del usuario simulado */}
          <p className="text-slate-600 text-lg md:text-xl">
            Bienvenido, {user.full_name} ({user.role})
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Gestión eficiente para un acompañamiento de calidad.
          </p>
        </div>

        {/* Grid de acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action) => (
            <Link to={action.path} key={action.title} className="group">
              <Card className="p-6 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 cursor-pointer bg-white/80 backdrop-blur-sm border border-slate-200 h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`${action.color} group-hover:scale-110 transition-transform`}>
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
      </div>
    </div>
  );
};

export default Index;