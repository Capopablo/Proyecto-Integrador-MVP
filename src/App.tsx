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
import PatientHistory from "./pages/PatientHistory";
import SearchPatients from "./pages/SearchPatients";
import Statistics from "./pages/Statistics";

const queryClient = new QueryClient();

const App = () => {
  // Usuario simulado (coincide con tu backend)
  const [user] = useState({
    email: "admin@mindful.com",
    full_name: "Admin Demo",
    role: "admin",
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
            <Route path="/patient-history" element={<PatientHistory user={user} />} />
            <Route path="/search-patients" element={<SearchPatients user={user} />} />
            <Route path="/statistics" element={<Statistics user={user} />} /> {/* Con prop user */}
            
            {/* Ruta por defecto */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;