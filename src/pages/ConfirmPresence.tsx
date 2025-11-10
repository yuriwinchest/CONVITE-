import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGuestConfirmation } from "@/hooks/useGuestConfirmation";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { Loader2, CheckCircle2, XCircle, MapPin, Calendar, Users, Download, ZoomIn, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConfirmPresence() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [guestName, setGuestName] = useState("");
  const [searchState, setSearchState] = useState<"idle" | "searching" | "found" | "not-found" | "confirmed">("idle");
  const [guestData, setGuestData] = useState<any>(null);
  const [isProcessingQR, setIsProcessingQR] = useState(false);

  const { searchGuest, confirmPresence, getEventDetails, eventDetails, isLoadingEvent } = useGuestConfirmation(eventId || "");

  const handleQRScan = async (scannedData: string) => {
    setIsProcessingQR(true);
    try {
      let extractedEventId = "";
      
      try {
        const url = new URL(scannedData);
        const pathParts = url.pathname.split('/').filter(Boolean);
        const confirmIndex = pathParts.indexOf('confirm');
        if (confirmIndex !== -1 && pathParts[confirmIndex + 1]) {
          extractedEventId = pathParts[confirmIndex + 1];
        }
      } catch {
        extractedEventId = scannedData;
      }

      if (!extractedEventId) {
        toast({
          title: "QR Code inválido",
          description: "O QR Code escaneado não contém um evento válido.",
          variant: "destructive",
        });
        return;
      }

      navigate(`/confirm/${extractedEventId}`);
      toast({
        title: "QR Code escaneado!",
        description: "Carregando informações do evento...",
      });
    } catch (error) {
      console.error("Erro ao processar QR Code:", error);
      toast({
        title: "Erro ao processar QR Code",
        description: "Não foi possível processar o QR Code escaneado.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingQR(false);
    }
  };

  const handleSearch = async () => {
    if (!guestName.trim() || !eventId) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite seu nome para buscar.",
        variant: "destructive",
      });
      return;
    }

    setSearchState("searching");

    try {
      const result = await searchGuest(guestName);
      
      if (result) {
        if (result.confirmed) {
          toast({
            title: "Presença já confirmada",
            description: "Sua presença já foi confirmada anteriormente.",
          });
        }
        setGuestData(result);
        setSearchState("found");
      } else {
        setSearchState("not-found");
        toast({
          title: "Convidado não encontrado",
          description: "Não encontramos nenhum convidado com esse nome. Verifique a ortografia.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setSearchState("idle");
      toast({
        title: "Erro ao buscar",
        description: "Ocorreu um erro ao buscar seu nome. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = async () => {
    if (!guestData?.id) return;

    try {
      await confirmPresence(guestData.id);
      setSearchState("confirmed");
      toast({
        title: "✅ Presença confirmada!",
        description: "Obrigado por confirmar. Aguardamos você no evento!",
      });
    } catch (error) {
      toast({
        title: "Erro ao confirmar",
        description: "Ocorreu um erro ao confirmar sua presença. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setSearchState("idle");
    setGuestName("");
    setGuestData(null);
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Quando não tem eventId, mostrar scanner
  if (!eventId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Confirmar Presença no Evento
              </CardTitle>
              <CardDescription>
                Escaneie o QR Code fornecido pelo organizador do evento para acessar a página de confirmação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRCodeScanner 
                onScan={handleQRScan} 
                isProcessing={isProcessingQR}
                mode="event-access"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Não tem um QR Code?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Entre em contato com o organizador do evento para obter o QR Code de acesso ou o link direto para confirmação.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quando tem eventId mas o evento não existe
  if (!eventDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Evento não encontrado</CardTitle>
            <CardDescription>
              O evento que você está procurando não existe ou foi removido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center space-y-3 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">🎉 Confirme sua Presença</CardTitle>
          <CardDescription className="text-base">{eventDetails.name}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Event Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Data do Evento</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(eventDetails.date), "PPP 'às' p", { locale: ptBR })}
                </p>
              </div>
            </div>
            {eventDetails.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Local</p>
                  <p className="text-sm text-muted-foreground">{eventDetails.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Search State: Idle or Not Found */}
          {(searchState === "idle" || searchState === "not-found") && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="guestName" className="text-sm font-medium">
                  Digite seu nome completo
                </label>
                <Input
                  id="guestName"
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="text-base"
                />
              </div>
              <Button onClick={handleSearch} className="w-full" size="lg">
                Buscar Meu Lugar
              </Button>
            </div>
          )}

          {/* Search State: Searching */}
          {searchState === "searching" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Procurando seu nome...</p>
            </div>
          )}

          {/* Search State: Found */}
          {searchState === "found" && guestData && (
            <div className="space-y-6">
              <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                  <h3 className="text-xl font-semibold">Convidado encontrado!</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="text-lg font-medium">{guestData.name}</p>
                  </div>
                  
                  {guestData.table_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sua Mesa</p>
                      <p className="text-2xl font-bold text-primary">Mesa {guestData.table_number}</p>
                    </div>
                  )}

                  {guestData.confirmed && (
                    <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
                      <p className="text-sm text-accent-foreground">
                        ✅ Presença já confirmada anteriormente
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleConfirm} 
                  className="flex-1" 
                  size="lg"
                  disabled={guestData.confirmed}
                >
                  {guestData.confirmed ? "Já Confirmado" : "Confirmar Presença"}
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Search State: Confirmed */}
          {searchState === "confirmed" && guestData && (
            <div className="space-y-6">
              <div className="bg-primary/5 border-2 border-primary rounded-lg p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2">Presença Confirmada!</h3>
                  <p className="text-muted-foreground">
                    Obrigado, <strong>{guestData.name}</strong>! Sua presença foi confirmada com sucesso.
                  </p>
                  {guestData.table_number && (
                    <p className="mt-4 text-lg">
                      Você está na <strong className="text-primary">Mesa {guestData.table_number}</strong>
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground border-t pt-4">
                  Aguardamos você no evento! 🎉
                </p>
              </div>

              {/* Mapa das Mesas */}
              {eventDetails.table_map_url ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">📍 Localização da sua mesa</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={eventDetails.table_map_url} 
                      alt="Mapa das mesas"
                      className="w-full h-auto"
                      onError={(e) => {
                        console.error("Error loading image:", eventDetails.table_map_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        console.log("Download button clicked, URL:", eventDetails.table_map_url);
                        try {
                          const link = document.createElement('a');
                          link.href = eventDetails.table_map_url!;
                          link.download = `mapa-mesas-${eventDetails.name}.jpg`;
                          link.target = '_blank';
                          link.rel = 'noopener noreferrer';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          console.log("Download link clicked successfully");
                        } catch (error) {
                          console.error("Error downloading map:", error);
                          toast({
                            title: "Erro ao baixar mapa",
                            description: "Não foi possível baixar o mapa. Tente abrir em tela cheia.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Mapa
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        console.log("Fullscreen button clicked, URL:", eventDetails.table_map_url);
                        try {
                          window.open(eventDetails.table_map_url, '_blank', 'noopener,noreferrer');
                          console.log("Window opened successfully");
                        } catch (error) {
                          console.error("Error opening fullscreen:", error);
                          toast({
                            title: "Erro ao abrir mapa",
                            description: "Não foi possível abrir o mapa em tela cheia.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <ZoomIn className="mr-2 h-4 w-4" />
                      Ver em Tela Cheia
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground text-sm">
                  O organizador não adicionou um mapa das mesas para este evento.
                </div>
              )}
              
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Voltar para o início
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
