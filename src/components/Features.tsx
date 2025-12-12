import { QrCode, Users, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

const Features = () => {
  const { t } = useTranslation('home');

  const features = [
    {
      icon: QrCode,
      title: t('features.qrCode.title'),
      description: t('features.qrCode.description'),
    },
    {
      icon: Users,
      title: t('features.management.title'),
      description: t('features.management.description'),
    },
    {
      icon: RefreshCw,
      title: t('features.realtime.title'),
      description: t('features.realtime.description'),
    },
  ];

  return (
    <section className="bg-primary text-primary-foreground py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t('features.title')}</h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
