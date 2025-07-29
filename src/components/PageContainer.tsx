import { useNavigate, Link } from "react-router-dom";
import { ArrowUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface PageContainerProps {
  title?: string; // Ahora 'title' es OPCIONAL
  subtitle?: string; // 'subtitle' ya era opcional, se mantiene así
  children: React.ReactNode;
}

const PageContainer = ({ title, subtitle, children }: PageContainerProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="text-slate-600 hover:text-slate-800">
            <Button variant="ghost" className="gap-2">
              <ArrowUp className="h-4 w-4 rotate-[-90deg]" />
              Volver
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="gap-2 text-slate-600"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
        
        {/* Solo renderizamos el título y subtítulo si existen */}
        {title && (
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 text-transparent bg-clip-text mb-2">
              {title}
            </h1>
            {subtitle && <p className="text-slate-600 text-base md:text-lg">{subtitle}</p>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default PageContainer;