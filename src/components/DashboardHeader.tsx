import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-encontre-meu-lugar.jpg";

const DashboardHeader = () => {
  const { logout } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Encontre Meu Lugar" className="h-12 w-auto" />
        </div>
        
        <div className="flex items-center gap-3">
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
