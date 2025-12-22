import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWAButton = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else {
      // For iOS or when prompt not available, navigate to install page
      navigate("/install");
    }
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Always show button - either for direct install or to go to instructions page
  return (
    <Button
      variant="headerOutline"
      size="sm"
      onClick={handleInstallClick}
      className="gap-2"
    >
      {isIOS ? (
        <Smartphone className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{t('pwa.installApp')}</span>
      <span className="sm:hidden">{t('pwa.install')}</span>
    </Button>
  );
};

export default InstallPWAButton;
