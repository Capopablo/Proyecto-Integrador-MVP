// src/App.tsx

import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewPatient from "./pages/NewPatient";
import NewSession from "./pages/NewSession";
import PatientHistory from "./pages/PatientHistory"; // Importación correcta
import SearchPatients from "./pages/SearchPatients";
import Statistics from "./pages/Statistics";

const queryClient = new QueryClient();

// Definimos la interfaz User AQUI para poder exportarla y usarla en otros componentes
export interface User {
  email: string;
  full_name: string;
  role: string;
  id: number;
  isAuthenticated: boolean;
}

const App = () => {
  const [user] = useState<User>({ // Usamos la interfaz User aquí
    email: "admin@mindful.com",
    full_name: "Admin Demo",
    role: "admin",
    id: 1,
    isAuthenticated: true
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Ruta principal */}
            <Route path="/" element={<Index user={user} />} />

            {/* Otras rutas */}
            <Route path="/new-patient" element={<NewPatient user={user} />} />
            <Route path="/new-session" element={<NewSession user={user} />} />

            {/* --- ¡SOLUCIÓN AQUÍ: AÑADIDA LA RUTA BASE PARA patient-history! --- */}
            <Route path="/patient-history" element={<PatientHistory user={user} />} />
            {/* La ruta con :patientId sigue siendo útil para acceso directo */}
            <Route path="/patient-history/:patientId" element={<PatientHistory user={user} />} />

            <Route path="/search-patients" element={<SearchPatients user={user} />} />
            <Route path="/statistics" element={<Statistics user={user} />} />

            {/* Ruta por defecto para 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;