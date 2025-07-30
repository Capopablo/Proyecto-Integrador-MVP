import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Search, Loader2, FileDown } from "lucide-react"; 
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

// --- IMPORTACIÓN QUE FALTABA ---
import { Button } from "@/components/ui/button"; // ¡ESTA ES LA LÍNEA QUE FALTABA!
// --- FIN IMPORTACIÓN QUE FALTABA ---

// --- IMPORTACIONES PARA PDF ---
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; 
// --- FIN IMPORTACIONES PARA PDF ---

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
  therapy_sessions: Session[]; 
  clinical_records: ClinicalRecord[];
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

  const clinicalRecordRef = useRef<HTMLDivElement>(null); 

  const fetchPatientWithHistory = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/patients/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.detail || "Error al cargar el historial del paciente");
      }
      const data: Patient = await response.json();
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

  const handleDownloadPDF = async () => {
    if (!clinicalRecordRef.current) {
      toast.error("El contenido del historial clínico no está disponible para descargar.");
      return;
    }

    if (!selectedPatient || selectedPatient.therapy_sessions.length === 0) {
        toast.warning("No hay sesiones para el paciente seleccionado para generar el PDF.");
        return;
    }

    toast.info("Generando PDF... por favor espera.");

    try {
        const input = clinicalRecordRef.current;
        const canvas = await html2canvas(input, {
            scale: 2, 
            useCORS: true, 
            logging: true, 
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); 

        const imgWidth = 210; 
        const pageHeight = 297; 
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const patientNameForFile = selectedPatient.full_name.replace(/ /g, '_');
        pdf.save(`Historial_${patientNameForFile}.pdf`);
        toast.success("PDF generado y descargado con éxito.");
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        toast.error(`Error al generar el PDF: ${error instanceof Error ? error.message : "Desconocido"}`);
    }
  };

  return (
    <PageContainer
      title="Historial del Paciente"
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
          <Card ref={clinicalRecordRef} className="p-6 bg-white shadow-lg rounded-lg border border-slate-200">
            {/* Cabecera de la hoja clínica con botón de descarga */}
            <div className="mb-6 pb-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-slate-800">
                Historial de {selectedPatient.full_name}
              </h3>
              {/* Botón de Descargar PDF - Visible solo si hay sesiones cargadas */}
              {selectedPatient.therapy_sessions.length > 0 && (
                <Button onClick={handleDownloadPDF} disabled={loading}>
                  <FileDown className="h-4 w-4 mr-2" /> Descargar PDF
                </Button>
              )}
            </div>

            {/* Detalles del paciente seleccionado (Parte Superior de la Hoja) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-slate-700 text-base mb-6">
              <p><span className="font-semibold">ID Paciente:</span> {selectedPatient.id}</p>
              <p><span className="font-semibold">Fecha de Nacimiento:</span> {format(new Date(selectedPatient.birth_date), "dd MMMM yyyy", { locale: es })}</p>
              <p><span className="font-semibold">Género:</span> {selectedPatient.gender}</p>
              {selectedPatient.diagnosis && <p><span className="font-semibold">Diagnóstico:</span> {selectedPatient.diagnosis}</p>}
              {selectedPatient.medication && <p><span className="font-semibold">Medicación:</span> {selectedPatient.medication}</p>}
              <p className="col-span-2"><span className="font-semibold">Notas Adicionales:</span> {selectedPatient.additional_notes || 'N/A'}</p>
              <p className="col-span-2 text-sm text-slate-500 mt-2">
                  <span className="font-semibold">Fecha de Admisión:</span> {format(new Date(selectedPatient.created_at), "dd MMMM yyyy", { locale: es })}
              </p>
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
                    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()) 
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