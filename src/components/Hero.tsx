import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  QrCode,
  Users,
  Clock,
  Heart,
  Sparkles,
  CheckCircle2,
  Star,
  MessageCircle,
  Instagram
} from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Organização Inteligente de Eventos</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Organize assentos com sofisticação e tranquilidade
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Para a tranquilidade de quem planeja e o conforto de quem chega, Encontre Meu Lugar
            transforma a organização de assentos em uma experiência fluida e sofisticada. Nossa
            plataforma assegura que cada detalhe seja cuidado, do planejamento ao conforto dos seus convidados.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold"
            >
              Criar Meu Evento
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary/30 px-8 py-6 text-base font-semibold"
              onClick={() => navigate("/confirm")}
            >
              <Search className="w-5 h-5 mr-2" />
              Encontrar Meu Lugar
            </Button>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Como Funciona</h2>
            <p className="text-xl text-muted-foreground">
              Sua organização perfeita em passos simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-primary/20 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Crie em 2 Minutos</CardTitle>
                <CardDescription className="text-base">
                  Crie seu evento e gerencie a lista de convidados em 2 minutos.
                  Não precisa de aplicativo nem senhas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">QR Code Exclusivo</CardTitle>
                <CardDescription className="text-base">
                  Seu QR Code exclusivo está pronto instantaneamente.
                  Compartilhe com facilidade e praticidade.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Experiência Acolhedora</CardTitle>
                <CardDescription className="text-base">
                  Convidados escaneiam e encontram o lugar certo, garantindo
                  uma experiência acolhedora e sem imprevistos.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Para Quem */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-primary/20 shadow-2xl">
            <CardContent className="p-12">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-10 h-10 text-primary" />
                <h2 className="text-3xl font-bold text-foreground">
                  Para Quem Deseja um Evento Verdadeiramente Memorável
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                O Encontre Meu Lugar é a solução perfeita para qualquer pessoa que organiza um evento
                e deseja demonstrar um carinho especial por cada convidado. Oferecemos a certeza de
                que todos se sentirão parte do evento, com seus lugares cuidadosamente designados,
                desde pequenas celebrações no salão do seu edifício a grandes galas empresariais.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Portfólio / Casos de Uso */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Histórias de Sucesso: Onde a Organização Encontra a Emoção
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore como o Encontre Meu Lugar tem transformado a experiência em diversos eventos.
              Cada imagem e cada história refletem nosso compromisso com a excelência e o acolhimento.
            </p>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-primary/20">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4 leading-relaxed">
                  "O Encontre Meu Lugar foi a solução que eu precisava. Meus convidados se sentiram
                  valorizados e a logística do evento fluiu perfeitamente. Indico de olhos fechados!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Cliente Satisfeito</p>
                    <p className="text-sm text-muted-foreground">Casamento</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4 leading-relaxed">
                  "Organização impecável! Nossos convidados elogiaram muito a facilidade de encontrar
                  seus lugares. A plataforma é intuitiva e economizou muito tempo."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Assessora de Eventos</p>
                    <p className="text-sm text-muted-foreground">Evento Corporativo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Planos e Preços */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Escolha a Tranquilidade: Soluções Adaptadas ao Seu Evento
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Compreendemos que cada evento é único, e a sua necessidade também.
              Nossas soluções são projetadas para se moldar ao seu evento, garantindo
              que você receba exatamente o que precisa para uma organização impecável.
            </p>
          </div>

          <Card className="border-primary/20 shadow-2xl">
            <CardContent className="p-12 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Converse Conosco
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                Estamos prontos para ajudar a planejar seu evento com a organização
                e sofisticação que você merece.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Business
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 gap-2"
                  onClick={() => window.open("https://instagram.com/encontremeulugar", "_blank")}
                >
                  <Instagram className="w-5 h-5" />
                  @encontremeulugar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para Transformar Seu Evento?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece agora e proporcione uma experiência inesquecível para seus convidados
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90 px-8 py-6 text-base font-semibold"
            onClick={() => navigate("/auth")}
          >
            Criar Meu Evento Gratuitamente
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Hero;
