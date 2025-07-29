// src/pages/PatientHistory.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/PageContainer";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- INTERFACES ACTUALIZADAS PARA COINCIDIR CON EL BACKEND ---
interface User {
  email: string;
  full_name: string;
  role: string;
  id: number;
}

interface ClinicalRecord {
  id: number;
  patient_id: number;
  start_date: string;
  last_update: string;
  summary: string;
  is_active: boolean;
}

interface Session {
  id: number;
  patient_id: number;
  clinical_record_id: number | null;
  therapist_id: number;
  session_date: string;
  session_notes: string;
  emotional_score: number;
  session_type: string;
  duration_minutes: number;
  created_at: string;
}

interface Patient {
  id: number;
  therapist_id: number;
  full_name: string;
  birth_date: string;
  gender: string;
  diagnosis: string | null;
  medication: string | null;
  additional_notes: string | null;
  created_at: string;
  is_active: boolean;
  therapy_sessions: Session[]; // Asegúrate de que esto siempre es un array
  clinical_records: ClinicalRecord[]; // Asegúrate de que esto siempre es un array
}
// --- FIN INTERFACES ACTUALIZADAS ---

interface PatientHistoryProps {
  user: User;
}

const PatientHistory = ({ user }: PatientHistoryProps) => {
  const { patientId: urlPatientId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Función para cargar un paciente por ID, incluyendo sus relaciones
  const fetchPatientWithHistory = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/patients/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.detail || "Error al cargar el historial del paciente");
      }
      const data: Patient = await response.json();
      // Asegúrate de que 'therapy_sessions' y 'clinical_records' sean siempre arrays
      data.therapy_sessions = data.therapy_sessions || [];
      data.clinical_records = data.clinical_records || [];
      setSelectedPatient(data);
    } catch (error) {
      console.error("Error fetching patient history:", error);
      toast.error(`Error al cargar el historial del paciente: ${error instanceof Error ? error.message : String(error)}`);
      setSelectedPatient(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar todos los pacientes disponibles para el terapeuta al inicio
  useEffect(() => {
    const fetchAvailablePatients = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/patients?therapist_id=${user.id}`
        );
        if (!response.ok) throw new Error("Error al cargar la lista de pacientes.");
        const data: Patient[] = await response.json();
        setAvailablePatients(data);

        if (urlPatientId) {
          const patientInList = data.find((p) => p.id.toString() === urlPatientId);
          if (patientInList) {
            fetchPatientWithHistory(patientInList.id);
          } else {
            toast.warning("Paciente de la URL no encontrado o no asignado a este terapeuta.");
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching available patients:", error);
        toast.error(`No se pudieron cargar los pacientes: ${error instanceof Error ? error.message : String(error)}`);
        setLoading(false);
      }
    };

    fetchAvailablePatients();
  }, [user.id, urlPatientId, fetchPatientWithHistory]);

  const handlePatientSelect = (patientIdStr: string) => {
    const patient = availablePatients.find((p) => p.id.toString() === patientIdStr);
    if (patient) {
      fetchPatientWithHistory(patient.id);
      setSearchTerm("");
    } else {
      setSelectedPatient(null);
    }
  };

  const filteredPatients = availablePatients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="Historial del Paciente"
      // ELIMINAMOS COMPLETAMENTE la prop 'subtitle' de aquí
      // subtitle={`Terapeuta: ${user.full_name} (${user.role})`} <-- Esta línea es la que quitamos
    >
      <div className="space-y-6">
        {/* Selector de pacientes */}
        <Select
          onValueChange={handlePatientSelect}
          value={selectedPatient?.id.toString() || ""}
          disabled={loading && !selectedPatient && !searchTerm}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              loading && !selectedPatient && !searchTerm ? "Cargando pacientes..." : "Seleccionar paciente"
            } />
          </SelectTrigger>
          <SelectContent>
            {availablePatients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id.toString()}>
                {patient.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar paciente por nombre"
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value && selectedPatient) setSelectedPatient(null);
            }}
          />
        </div>

        {/* Resultados de búsqueda */}
        {searchTerm && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500">Resultados de búsqueda</h3>
            {filteredPatients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredPatients.map((patient) => (
                  <Card
                    key={patient.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedPatient?.id === patient.id
                        ? "border-blue-500 bg-blue-50/50"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => handlePatientSelect(patient.id.toString())}
                  >
                    <p className="font-medium">{patient.full_name}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center p-6 text-slate-500">No se encontraron pacientes</p>
            )}
          </div>
        )}

        {/* --- INICIO DE LA "HOJA CLÍNICA" --- */}
        {selectedPatient && (
          <Card className="p-6 bg-white shadow-lg rounded-lg border border-slate-200">
            {/* Detalles del paciente seleccionado (Parte Superior de la Hoja) */}
            <div className="mb-6 pb-4 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Historial de {selectedPatient.full_name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-slate-700 text-base">
                <p><span className="font-semibold">ID Paciente:</span> {selectedPatient.id}</p>
                <p><span className="font-semibold">Fecha de Nacimiento:</span> {format(new Date(selectedPatient.birth_date), "dd MMMM yyyy", { locale: es })}</p>
                <p><span className="font-semibold">Género:</span> {selectedPatient.gender}</p>
                {selectedPatient.diagnosis && <p><span className="font-semibold">Diagnóstico:</span> {selectedPatient.diagnosis}</p>}
                {selectedPatient.medication && <p><span className="font-semibold">Medicación:</span> {selectedPatient.medication}</p>}
                <p className="col-span-2"><span className="font-semibold">Notas Adicionales:</span> {selectedPatient.additional_notes || 'N/A'}</p>
                {/* --- CAMBIO AQUÍ: Fecha de Admisión --- */}
                <p className="col-span-2 text-sm text-slate-500 mt-2">
                    <span className="font-semibold">Fecha de Admisión:</span> {format(new Date(selectedPatient.created_at), "dd MMMM yyyy", { locale: es })}
                </p>
                {/* --- FIN CAMBIO --- */}
              </div>
            </div>

            {/* Historial de Sesiones (Parte Inferior de la Hoja) */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-slate-700">
                Resumen de Sesiones
              </h3>
              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : selectedPatient.therapy_sessions.length > 0 ? (
                <div className="space-y-4">
                  {selectedPatient.therapy_sessions
                    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()) // Ordenar por fecha descendente
                    .map((session) => (
                      <div key={session.id} className="border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50/20 rounded-sm">
                        <p className="text-sm font-bold text-emerald-700 mb-1">
                          Sesión del {format(new Date(session.session_date), "dd MMMM yyyy - HH:mm", { locale: es })}
                        </p>
                        <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
                          {session.session_notes}
                        </p>
                        <div className="mt-2 text-sm text-slate-600 grid grid-cols-2 gap-y-1">
                          <p><span className="font-medium">Tipo:</span> {session.session_type}</p>
                          <p><span className="font-medium">Duración:</span> {session.duration_minutes} min</p>
                          <p><span className="font-medium">Nivel Emocional:</span> {session.emotional_score}</p>
                          <p><span className="font-medium">ID Sesión:</span> {session.id}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-white/50 rounded-lg border border-slate-200">
                  <p className="text-slate-500">No hay sesiones registradas para este paciente.</p>
                </div>
              )}
            </div>

            {/* Antiguos Registros Clínicos - Eliminados o minimizados.
                La "Fecha de Admisión" ahora toma su lugar.
                Si quieres mantener los registros clínicos más complejos en otro lugar, avísame.
            */}
            {/* Si aún quieres mostrar registros clínicos, pero de forma más resumida o en un acordeón */}
            {/* selectedPatient.clinical_records.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h3 className="text-xl font-semibold text-slate-700">Otros Registros Clínicos</h3>
                    <p className="text-sm text-slate-500">Consulta los registros completos en otra sección si es necesario.</p>
                </div>
            )*/}
            
          </Card>
        )}
        {/* --- FIN DE LA "HOJA CLÍNICA" --- */}

        {/* Estado inicial / Sin selección */}
        {!selectedPatient && !loading && (
          <div className="text-center p-12 bg-white/50 rounded-lg border border-slate-200">
            <p className="text-slate-500">
              {availablePatients.length === 0
                ? "No hay pacientes registrados para este terapeuta."
                : "Selecciona un paciente o usa la búsqueda para ver su historial."}
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default PatientHistory;