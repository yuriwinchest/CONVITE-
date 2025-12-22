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
import InstallPWAButton from "@/components/InstallPWAButton";

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
          <InstallPWAButton />
          <Button
            variant="headerGhost"
            onClick={() => navigate("/about")}
          >
            {t('header.aboutUs')}
          </Button>
          <Button
            variant="headerOutline"
            onClick={() => navigate("/confirm")}
          >
            {t('header.iAmGuest')}
          </Button>
          <Button
            variant="headerOutline"
            onClick={() => navigate("/auth")}
          >
            {t('header.login')}
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <InstallPWAButton />
          <LanguageSelector />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="headerGhost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-primary border-primary-foreground/20">
              <SheetHeader>
                <SheetTitle className="text-primary-foreground text-left">{t('header.menu')}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Button
                  variant="headerGhost"
                  className="justify-start"
                  onClick={() => handleNavigate("/about")}
                >
                  {t('header.aboutUs')}
                </Button>
                <Button
                  variant="headerGhost"
                  className="justify-start"
                  onClick={() => handleNavigate("/confirm")}
                >
                  {t('header.iAmGuest')}
                </Button>
                <Button
                  variant="headerOutline"
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
