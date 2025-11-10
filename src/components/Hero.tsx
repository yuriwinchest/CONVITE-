import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Hero = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Organização Inteligente que Conecta Pessoas
        </h1>
        
        <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
          Transforme a recepção do seu evento em uma experiência inesquecível de acolhimento.
          Com nossa gestão inteligente de assentos e setorização personalizada, cada convidado
          encontra o seu lugar de forma prática e elegante.
        </p>
        
        <p className="text-base text-muted-foreground mb-10 max-w-2xl mx-auto">
          Mais que organização, entregamos tranquilidade, fluidez e sofisticação — porque os
          detalhes fazem toda a diferença nos grandes momentos.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-primary hover:bg-accent text-primary-foreground px-8 py-6 text-base font-semibold">
            Criar Meu Evento
          </Button>
          <Button size="lg" variant="outline" className="border-2 border-muted-foreground/30 px-8 py-6 text-base font-semibold">
            <Search className="w-5 h-5 mr-2" />
            Encontrar Meu Lugar
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
