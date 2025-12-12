import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Logo from "@/components/Logo";
import LanguageSelector from "@/components/LanguageSelector";

const Header = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('common');

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <header className="bg-primary text-primary-foreground py-3 px-4 md:py-4 md:px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <Logo size="md" variant="header" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSelector />
          <Button
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/about")}
          >
            {t('header.aboutUs')}
          </Button>
          <Button
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/confirm")}
          >
            {t('header.iAmGuest')}
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            onClick={() => navigate("/auth")}
          >
            {t('header.login')}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSelector />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-primary border-primary-foreground/20">
              <SheetHeader>
                <SheetTitle className="text-primary-foreground text-left">{t('header.menu')}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Button
                  variant="ghost"
                  className="justify-start text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => handleNavigate("/about")}
                >
                  {t('header.aboutUs')}
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => handleNavigate("/confirm")}
                >
                  {t('header.iAmGuest')}
                </Button>
                <Button
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  onClick={() => handleNavigate("/auth")}
                >
                  {t('header.login')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
