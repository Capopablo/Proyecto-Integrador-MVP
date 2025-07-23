import PageContainer from "@/components/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Definimos el tipo para las props
type Props = {
  user: {
    email: string;
    full_name: string;
    role: string;
    isAuthenticated: boolean;
  };
};

// Mock de datos para presentismo
const attendanceData = [
  { name: "Lunes", sesiones: 4 },
  { name: "Martes", sesiones: 6 },
  { name: "Miércoles", sesiones: 8 },
  { name: "Jueves", sesiones: 5 },
  { name: "Viernes", sesiones: 3 },
];

// Mock de datos para evolución emocional
const emotionalData = [
  { name: "Semana 1", paciente: 2, terapeuta: 2.5 },
  { name: "Semana 2", paciente: 2.7, terapeuta: 3 },
  { name: "Semana 3", paciente: 3, terapeuta: 3.2 },
  { name: "Semana 4", paciente: 3.5, terapeuta: 3.8 },
  { name: "Semana 5", paciente: 3.2, terapeuta: 3.5 },
  { name: "Semana 6", paciente: 4, terapeuta: 4.2 },
];

// Configuración de colores para los gráficos
const chartConfig = {
  sesiones: {
    label: "Sesiones",
    theme: {
      light: "#4f46e5",
      dark: "#818cf8",
    },
  },
  paciente: {
    label: "Estado emocional paciente",
    theme: {
      light: "#10b981",
      dark: "#34d399",
    },
  },
  terapeuta: {
    label: "Evaluación terapeuta",
    theme: {
      light: "#f59e0b",
      dark: "#fbbf24",
    },
  },
};

const Statistics = ({ user }: Props) => {
  const hasAttendanceData = attendanceData.length > 0;
  const hasEmotionalData = emotionalData.length > 0;

  return (
    <PageContainer 
      title="Estadísticas"
      subtitle={`Bienvenido ${user.full_name}`} // Aquí usamos el user
    >
      <div className="space-y-10">
        {/* Gráfico de Presentismo */}
        <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Presentismo de Pacientes</h2>
          {hasAttendanceData ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipContent 
                            nameKey="dataKey"
                            labelClassName="font-medium text-sm" 
                            className="p-2" 
                            payload={payload}
                          />
                        );
                      }
                      return null;
                    }} 
                  />
                  <Bar dataKey="sesiones" fill="var(--color-sesiones)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] bg-slate-50/50 rounded">
              <p className="text-slate-500">No hay datos suficientes para mostrar</p>
            </div>
          )}
        </div>

        {/* Gráfico de Evolución Emocional */}
        <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Evolución Emocional</h2>
          {hasEmotionalData ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emotionalData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis domain={[1, 5]} tickLine={false} axisLine={false} />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipContent 
                            nameKey="name"
                            labelKey="name"
                            labelClassName="font-medium text-sm" 
                            className="p-2" 
                            payload={payload}
                          />
                        );
                      }
                      return null;
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="paciente" 
                    stroke="var(--color-paciente)" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="terapeuta" 
                    stroke="var(--color-terapeuta)" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] bg-slate-50/50 rounded">
              <p className="text-slate-500">No hay datos suficientes para mostrar</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default Statistics;