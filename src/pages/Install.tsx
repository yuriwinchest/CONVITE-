import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Smartphone, Monitor, Share2, Plus, MoreVertical, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const { t } = useTranslation('common');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    setIsInstalled(isInStandaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t('pwa.alreadyInstalled')}</CardTitle>
              <CardDescription>{t('pwa.alreadyInstalledDesc')}</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('pwa.installTitle')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('pwa.installSubtitle')}
            </p>
          </div>

          {/* Direct install button for supported browsers */}
          {isInstallable && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <Button 
                  size="lg" 
                  onClick={handleInstall}
                  className="gap-2"
                >
                  <Download className="h-5 w-5" />
                  {t('pwa.installNow')}
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  {t('pwa.clickToInstall')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Installation instructions by platform */}
          <Tabs defaultValue="android" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="android" className="gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Android</span>
              </TabsTrigger>
              <TabsTrigger value="ios" className="gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">iOS</span>
              </TabsTrigger>
              <TabsTrigger value="desktop" className="gap-2">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Desktop</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="android" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    {t('pwa.androidTitle')}
                  </CardTitle>
                  <CardDescription>{t('pwa.androidDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">{t('pwa.androidStep1Title')}</p>
                      <p className="text-sm text-muted-foreground">{t('pwa.androidStep1Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">{t('pwa.androidStep2Title')}</p>
                        <p className="text-sm text-muted-foreground">{t('pwa.androidStep2Desc')}</p>
                      </div>
                      <MoreVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">{t('pwa.androidStep3Title')}</p>
                        <p className="text-sm text-muted-foreground">{t('pwa.androidStep3Desc')}</p>
                      </div>
                      <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ios" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    {t('pwa.iosTitle')}
                  </CardTitle>
                  <CardDescription>{t('pwa.iosDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">{t('pwa.iosStep1Title')}</p>
                      <p className="text-sm text-muted-foreground">{t('pwa.iosStep1Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">{t('pwa.iosStep2Title')}</p>
                        <p className="text-sm text-muted-foreground">{t('pwa.iosStep2Desc')}</p>
                      </div>
                      <Share2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">{t('pwa.iosStep3Title')}</p>
                        <p className="text-sm text-muted-foreground">{t('pwa.iosStep3Desc')}</p>
                      </div>
                      <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="desktop" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    {t('pwa.desktopTitle')}
                  </CardTitle>
                  <CardDescription>{t('pwa.desktopDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">{t('pwa.desktopStep1Title')}</p>
                      <p className="text-sm text-muted-foreground">{t('pwa.desktopStep1Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">{t('pwa.desktopStep2Title')}</p>
                        <p className="text-sm text-muted-foreground">{t('pwa.desktopStep2Desc')}</p>
                      </div>
                      <Download className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">{t('pwa.desktopStep3Title')}</p>
                      <p className="text-sm text-muted-foreground">{t('pwa.desktopStep3Desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Benefits section */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('pwa.benefit1Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pwa.benefit1Desc')}</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('pwa.benefit2Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pwa.benefit2Desc')}</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Monitor className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('pwa.benefit3Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pwa.benefit3Desc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Install;
