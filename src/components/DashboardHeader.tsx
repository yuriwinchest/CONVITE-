import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import logo from "@/assets/logo-encontre-meu-lugar.jpg";
import { CartButton } from "./CartButton";

const DashboardHeader = () => {
  const { logout } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <header className="bg-primary text-primary-foreground py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Encontre Meu Lugar" className="h-12 w-auto" />
        </div>
        
        <div className="flex items-center gap-3">
          <CartButton />
          {isAdmin && (
            <Link to="/admin">
              <Button 
                variant="outline"
                className="bg-accent text-accent-foreground border-accent hover:bg-accent/90"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
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
