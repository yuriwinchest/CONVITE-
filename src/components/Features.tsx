import { QrCode, Users, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: QrCode,
    title: "QR Code Elegante",
    description: "Cada evento recebe um QR code exclusivo. Seus convidados encontram seus lugares com facilidade e elegância.",
  },
  {
    icon: Users,
    title: "Gestão Intuitiva",
    description: "Importe listas CSV ou adicione convidados manualmente. Reorganize mesas em tempo real sem complicação.",
  },
  {
    icon: RefreshCw,
    title: "Atualizações em Tempo Real",
    description: "Mudanças de última hora? Sem problemas. Atualize os lugares e o QR code permanece o mesmo.",
  },
];

const Features = () => {
  return (
    <section className="bg-primary text-primary-foreground py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Cuidado em Cada Detalhe</h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Uma plataforma criada para transformar organização em momentos memoráveis.
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
