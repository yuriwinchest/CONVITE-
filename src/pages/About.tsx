import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Pricing from "@/components/Pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Users, Heart } from "lucide-react";

const About = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('about');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />

      <div className="container mx-auto px-4 py-10 md:py-16 max-w-5xl">
        {/* Header Section */}
        <div className="mb-8 md:mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-2 rounded-full mb-4 sm:mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">{t('badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent px-2">
            {t('title')}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            {t('subtitle')}
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="border-primary/20 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/70 to-primary" />

          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="space-y-6 sm:space-y-8">
              {/* Mission Statement */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t('mission.title')}</h2>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed pl-15">
                  {t('mission.description')}
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Differential */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t('differential.title')}</h2>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed pl-15">
                  {t('differential.description')}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border/50">
                <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{t('features.sophistication.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('features.sophistication.description')}
                  </p>
                </div>

                <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{t('features.care.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('features.care.description')}
                  </p>
                </div>

                <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{t('features.efficiency.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('features.efficiency.description')}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-8">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                >
                  {t('cta')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToHome')}
          </Button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Pricing />
      </div>
    </div>
  );
};

export default About;
