import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button"; // Importamos el componente Button de shadcn/ui

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800">
          Página no encontrada
        </h2>
        <p className="text-slate-600 mb-8">
          La ruta <code className="bg-slate-200 px-2 py-1 rounded">{location.pathname}</code> no existe
          o no está disponible.
        </p>
        
        <div className="space-y-4">
          <Button asChild variant="default">
            <a href="/" className="text-white no-underline">
              Volver al inicio
            </a>
          </Button>
          
          <p className="text-sm text-slate-500">
            Si crees que esto es un error, contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;