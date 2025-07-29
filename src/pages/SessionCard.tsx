// src/components/SessionCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Clock, CalendarDays, ClipboardList } from "lucide-react";
// Asegúrate de que Badge esté importado si lo usas en el componente
import { Badge } from "@/components/ui/badge"; 

// --- INTERFAZ DE PROPS DE SESSIONCARD RESTAURADA ---
interface SessionCardProps {
  sessionId: number; // Volvemos a esperar el ID numérico
  date: Date;
  summary: string;
  therapistRating: number;
  // Si habías añadido sessionType o durationMinutes como props individuales antes,
  // asegúrate de incluirlas aquí y en la desestructuración,
  // y luego en PatientHistory al pasarlas.
  sessionType?: string; // Si lo necesitas
  durationMinutes?: number; // Si lo necesitas
}
// --- FIN INTERFAZ ---

export default function SessionCard({
  sessionId,
  date,
  summary,
  therapistRating,
  sessionType, // Desestructurar si lo incluiste en las props
  durationMinutes, // Desestructurar si lo incluiste en las props
}: SessionCardProps) {
  // Función auxiliar para determinar el color del rating
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600"; // Bueno/Muy bueno
    if (rating === 3) return "text-yellow-600"; // Neutral
    return "text-red-600"; // Bajo/Muy bajo
  };

  return (
    <Card className="shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-md font-semibold text-gray-800">
          <span className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            Sesión #{sessionId} {/* Mostrar el ID de la sesión */}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <CalendarDays className="h-3 w-3" />
            {format(date, "dd MMMM yyyy, HH:mm", { locale: es })} {/* Formato de fecha y hora */}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <BarChart className="h-4 w-4 text-purple-600" />
          <span className="font-medium">Nivel Emocional (Terapeuta):</span>
          <span className={`font-bold ${getRatingColor(therapistRating)}`}>
            {therapistRating}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-medium">Notas:</span> {summary}
        </p>
        {sessionType && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <ClipboardList className="h-3 w-3" /> Tipo: {sessionType}
          </p>
        )}
        {durationMinutes && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Duración: {durationMinutes} min
          </p>
        )}
      </CardContent>
    </Card>
  );
}