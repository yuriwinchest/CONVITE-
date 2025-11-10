import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          <span className="font-semibold text-lg">Encontre Meu Lugar</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
            Sou Convidado
          </Button>
          <Button variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
            Entrar
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
