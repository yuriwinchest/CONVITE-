import { Button } from "@/components/ui/button";
import { MapPin, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const DashboardHeader = () => {
  const { logout } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          <span className="font-semibold text-lg">Encontre Meu Lugar</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button 
            variant="outline" 
            onClick={logout}
            className="bg-accent text-accent-foreground border-accent hover:bg-accent/90"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
