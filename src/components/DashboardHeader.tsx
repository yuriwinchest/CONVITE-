import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/logo-encontre-meu-lugar.jpg";
import { CartButton } from "./CartButton";

const DashboardHeader = () => {
  const { logout } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <header className="bg-primary text-primary-foreground py-3 px-4 md:py-4 md:px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Encontre Meu Lugar" className="h-10 md:h-12 w-auto" />
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <CartButton />
          <Link to="/subscription">
            <Button 
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Minha Assinatura
            </Button>
          </Link>
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

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <CartButton />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-primary border-primary-foreground/20">
              <SheetHeader>
                <SheetTitle className="text-primary-foreground text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Button
                  variant="ghost"
                  className="justify-start text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => handleNavigate("/subscription")}
                >
                  Minha Assinatura
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    className="justify-start text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => handleNavigate("/admin")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="bg-accent text-accent-foreground border-accent hover:bg-accent/90"
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
