import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Users, Heart } from "lucide-react";

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <Header />

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                {/* Header Section */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Sobre Nós</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Encontre Meu Lugar
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Transformando eventos em experiências inesquecíveis através da organização perfeita
                    </p>
                </div>

                {/* Main Content Card */}
                <Card className="border-primary/20 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/70 to-primary" />

                    <CardContent className="p-8 md:p-12">
                        <div className="space-y-8">
                            {/* Mission Statement */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Heart className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">Nossa Missão</h2>
                                </div>

                                <p className="text-lg text-muted-foreground leading-relaxed pl-15">
                                    Nosso desejo de transformar e facilitar a organização de eventos, cuidando da
                                    logística de assentos com a mais pura sofisticação, assegurando que cada convidado
                                    seja recebido com a devida consideração.
                                </p>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                            {/* Differential */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">Nosso Diferencial</h2>
                                </div>

                                <p className="text-lg text-muted-foreground leading-relaxed pl-15">
                                    Nosso diferencial é a preocupação genuína com o bem-estar de todos: a tranquilidade
                                    para o organizador e o conforto inestimável para os convidados, culminando em uma
                                    eficiência logística sem precedentes que eleva qualquer celebração.
                                </p>
                            </div>

                            {/* Features Grid */}
                            <div className="grid md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-border/50">
                                <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-2">Sofisticação</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Organização com elegância e atenção aos detalhes
                                    </p>
                                </div>

                                <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Heart className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-2">Cuidado</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Cada convidado recebe a atenção que merece
                                    </p>
                                </div>

                                <div className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-2">Eficiência</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Logística impecável para eventos perfeitos
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
                                    Comece Agora
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
                        Voltar para o Início
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default About;
