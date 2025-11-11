import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-encontre-meu-lugar.jpg";

const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="bg-primary text-primary-foreground py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="Encontre Meu Lugar" className="h-12 w-auto" />
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/confirm")}
          >
            Sou Convidado
          </Button>
          <Button 
            variant="outline" 
            className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            onClick={() => navigate("/auth")}
          >
            Entrar
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
