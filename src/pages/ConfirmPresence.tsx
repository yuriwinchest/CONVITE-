import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGuestConfirmation } from "@/hooks/useGuestConfirmation";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { generateQRCodeImage, parseQRCodeData } from "@/lib/qrCodeGenerator";
import { Loader2, CheckCircle2, XCircle, MapPin, Calendar, Users, Download, ZoomIn, ArrowLeft, Camera } from "lucide-react";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";

function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value.trim());
}

function extractEventId(input: string): string | null {
  const trimmed = input.trim();
  const uuidMatch = trimmed.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  if (uuidMatch && isUuid(uuidMatch[0])) return uuidMatch[0];

  try {
    const url = new URL(trimmed);
    const eventIdParam = url.searchParams.get("eventId") || url.searchParams.get("event_id");
    if (eventIdParam && isUuid(eventIdParam)) return eventIdParam;
    const parts = url.pathname.split("/").filter(Boolean);
    const confirmIndex = parts.indexOf("confirm");
    if (confirmIndex !== -1 && parts[confirmIndex + 1] && isUuid(parts[confirmIndex + 1])) return parts[confirmIndex + 1];
    const eventsIndex = parts.indexOf("events");
    if (eventsIndex !== -1 && parts[eventsIndex + 1] && isUuid(parts[eventsIndex + 1])) return parts[eventsIndex + 1];
  } catch { }
  return null;
}

interface GuestLookupMatch {
  guest_id: string;
  guest_name: string;
  event_id: string;
  event_name: string;
  event_date: string;
  event_location: string | null;
  table_number: number | null;
  confirmed: boolean;
}

export default function ConfirmPresence() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation('confirm');
  
  // Get the correct date-fns locale based on current language
  const dateLocale = i18n.language === 'es' ? es : ptBR;

  const {
    searchGuest,
    confirmPresence,
    getEventDetails,
    eventDetails,
    isLoadingEvent,
    isCheckInAllowed,
    searchGuestAcrossEvents,
  } = useGuestConfirmation(eventId || "");

  const guestIdFromQR = searchParams.get("guest");
  const viaQR = searchParams.get("via") === "qr";
  const kioskMode = searchParams.get("mode") === "kiosk";
  const prefillNameParam = searchParams.get("prefillName");

  const [guestName, setGuestName] = useState("");
  const [searchState, setSearchState] = useState<"idle" | "searching" | "found" | "not-found" | "confirmed">("idle");
  const [guestData, setGuestData] = useState<any>(null);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [invalidEventId, setInvalidEventId] = useState(false);
  const [showGuestQRScanner, setShowGuestQRScanner] = useState(false);
  const [isProcessingGuestQR, setIsProcessingGuestQR] = useState(false);
  const [kioskCountdown, setKioskCountdown] = useState<number | null>(null);
  const [manualEventInput, setManualEventInput] = useState("");
  const [isManualLookupLoading, setIsManualLookupLoading] = useState(false);
  const [guestLookupMatches, setGuestLookupMatches] = useState<GuestLookupMatch[]>([]);
  const [showGuestLookupDialog, setShowGuestLookupDialog] = useState(false);

  const [timeUntilCheckIn, setTimeUntilCheckIn] = useState<number>(0);
  const [photosQRCode, setPhotosQRCode] = useState<string>("");
  const [mapImageError, setMapImageError] = useState(false);

  const toggleKioskMode = (enable: boolean) => {
    if (!eventId) return;
    const params = new URLSearchParams(searchParams);

    if (enable) {
      params.set("mode", "kiosk");
      params.delete("guest");
      params.delete("via");
    } else {
      params.delete("mode");
    }

    const query = params.toString();
    navigate(`/confirm/${eventId}${query ? `?${query}` : ""}`);
  };

  // Validate eventId from route
  useEffect(() => {
    if (eventId && !isUuid(eventId)) {
      console.error("Invalid event ID from route:", eventId);
      setInvalidEventId(true);
      toast({
        title: t('messages.invalidLink'),
        description: t('messages.invalidLinkDescription'),
        variant: "destructive",
      });
    }
  }, [eventId, toast, t]);

  useEffect(() => {
    if (!prefillNameParam || !eventId || searchState !== "idle") {
      return;
    }

    const decodedName = decodeURIComponent(prefillNameParam);
    const normalized = decodedName.trim();

    if (!normalized) {
      return;
    }

    let cancelled = false;

    const runPrefillSearch = async () => {
      try {
        setGuestName(decodedName);
        setSearchState("searching");
        const result = await searchGuest(normalized);

        if (cancelled) {
          return;
        }

        if (result) {
          if (result.confirmed) {
            setGuestData(result);
            setSearchState("confirmed");

            // Generate QR Code for photos if confirmed
            if (eventId && result.id) {
              const photosUrl = `${window.location.origin}/event/${eventId}/guest-gallery?guestId=${result.id}`;
              const qrImage = await generateQRCodeImage(photosUrl);
              setPhotosQRCode(qrImage);
            }

            toast({
              title: t('status.alreadyConfirmed'),
              description: t('messages.redirectingToGallery'),
            });
          } else {
            setGuestData(result);
            setSearchState("found");
          }
        } else {
          setSearchState("not-found");
          toast({
            title: t('messages.guestNotFound'),
            description: t('messages.guestNotFoundDescription'),
            variant: "destructive",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setSearchState("idle");
          toast({
            title: t('messages.searchError'),
            description: t('messages.searchErrorDescription'),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("prefillName");
          const query = params.toString();
          navigate(`/confirm/${eventId}${query ? `?${query}` : ""}`, { replace: true });
        }
      }
    };

    runPrefillSearch();

    return () => {
      cancelled = true;
    };
  }, [prefillNameParam, eventId, searchState, searchGuest, toast, navigate, searchParams]);

  const handleQRScan = async (scannedData: string) => {
    console.log("📱 [QR Scan] Iniciando processamento do QR code");
    console.log("📱 [QR Scan] Dados escaneados:", scannedData);

    setIsProcessingQR(true);
    try {
      // 1) Try to parse as guest QR code first
      console.log("📱 [QR Scan] Tentando parsear como QR de convidado...");
      const parsed = parseQRCodeData(scannedData);
      console.log("📱 [QR Scan] Resultado do parse:", parsed);

      // Formato novo: tem guestId e eventId
      if (parsed && parsed.guestId && parsed.eventId) {
        console.log("✅ [QR Scan] QR novo (Base64 JSON) detectado!", { guestId: parsed.guestId, eventId: parsed.eventId });
        navigate(`/confirm/${parsed.eventId}?guest=${parsed.guestId}&via=qr`);
        toast({
          title: t('messages.qrScanned'),
          description: t('messages.loadingInfo'),
        });
        return;
      }

      // Formato antigo: só tem guestId, precisa buscar eventId
      if (parsed && parsed.guestId && parsed.isLegacyFormat) {
        console.log("✅ [QR Scan] QR antigo (UUID) detectado, guestId:", parsed.guestId);

        // Se já estamos em um evento, usar o eventId atual
        if (eventId) {
          console.log("📱 [QR Scan] Usando eventId do contexto:", eventId);
          navigate(`/confirm/${eventId}?guest=${parsed.guestId}&via=qr`);
          toast({
            title: t('messages.qrScanned'),
            description: t('messages.loadingInfo'),
          });
          return;
        }

        // Se não tem eventId no contexto, buscar no banco
        console.log("📱 [QR Scan] Buscando evento do convidado no banco...");
        try {
          const { data: guest, error } = await supabase
            .from("guests")
            .select("event_id")
            .eq("id", parsed.guestId)
            .single();

          if (error) throw error;

          if (guest?.event_id) {
            console.log("✅ [QR Scan] Evento encontrado no banco:", guest.event_id);
            navigate(`/confirm/${guest.event_id}?guest=${parsed.guestId}&via=qr`);
            toast({
              title: t('messages.qrScanned'),
              description: t('messages.loadingInfo'),
            });
            return;
          }
        } catch (error) {
          console.error("❌ [QR Scan] Erro ao buscar convidado no banco:", error);
          toast({
            title: t('messages.guestNotFound'),
            description: t('messages.guestNotFoundDescription'),
            variant: "destructive",
          });
          return;
        }
      }

      // 2) Fallback: tentar como QR de evento
      console.log("📱 [QR Scan] Não é QR de convidado, tentando extrair eventId...");
      const extractedEventId = extractEventId(scannedData);
      console.log("📱 [QR Scan] EventId extraído:", extractedEventId);

      if (!extractedEventId) {
        console.error("❌ [QR Scan] Nenhum eventId válido encontrado");
        toast({
          title: t('messages.invalidQR'),
          description: t('messages.invalidQRDescription'),
          variant: "destructive",
        });
        return;
      }

      console.log("✅ [QR Scan] QR de evento detectado, navegando para:", extractedEventId);
      navigate(`/confirm/${extractedEventId}`);
      toast({
        title: t('messages.qrScanned'),
        description: t('messages.loadingEvent'),
      });
    } catch (error) {
      console.error("❌ [QR Scan] Erro ao processar QR Code:", error);
      toast({
        title: "Erro ao processar QR Code",
        description: "Não foi possível processar o QR Code escaneado.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingQR(false);
    }
  };

  const handleSearch = async (nameOverride?: string) => {
    const valueToSearch = nameOverride !== undefined ? nameOverride : guestName;
    const normalized = valueToSearch.trim();

    if (!normalized || !eventId) {
      toast({
        title: t('messages.nameRequired'),
        description: t('messages.nameRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    if (nameOverride !== undefined) {
      setGuestName(valueToSearch);
    }

    setSearchState("searching");

    try {
      const result = await searchGuest(normalized);

      if (result) {
        // Se já estiver confirmado, vai direto para a tela de confirmado
        // Se já estiver confirmado, redirecionar para a galeria
        if (result.confirmed) {
          setGuestData(result);
          setSearchState("confirmed");

          if (eventId && result.id) {
            toast({
              title: t('status.alreadyConfirmed'),
              description: t('messages.redirectingToGallery'),
            });

            // Redirecionar automaticamente para a galeria
            setTimeout(() => {
              navigate(`/event/${eventId}/guest-gallery?guestId=${result.id}`);
            }, 1500);
            return;
          }
        }

        // Se não estiver confirmado, tenta confirmar agora (Auto-Checkin)
        const checkInStatus = isCheckInAllowed();
        if (!checkInStatus.allowed) {
          // Se não puder fazer check-in (horário, etc), mostra encontrado mas avisa
          setGuestData(result);
          setSearchState("found");
          toast({
            title: t('messages.checkInNotAvailable'),
            description: checkInStatus.message,
            variant: "destructive",
          });
          return;
        }

        // Realiza o check-in
        await confirmPresence(result.id);

        setGuestData({ ...result, confirmed: true });
        setSearchState("confirmed");

        if (eventId && result.id) {
          const photosUrl = `${window.location.origin}/event/${eventId}/guest-gallery?guestId=${result.id}`;
          const qrImage = await generateQRCodeImage(photosUrl);
          setPhotosQRCode(qrImage);
        }

        toast({
          title: t('messages.confirmSuccess'),
          description: t('messages.confirmSuccessDescription'),
        });

      } else {
        setSearchState("not-found");
        toast({
          title: t('messages.guestNotFound'),
          description: t('messages.guestNotFoundDescription'),
          variant: "destructive",
        });
      }
    } catch (error) {
      setSearchState("idle");
      toast({
        title: t('messages.searchError'),
        description: t('messages.searchErrorDescription'),
        variant: "destructive",
      });
    }
  };

  const handleConfirm = async () => {
    if (!guestData?.id) return;

    // Check if check-in is allowed
    const checkInStatus = isCheckInAllowed();
    if (!checkInStatus.allowed) {
      toast({
        title: t('messages.checkInNotAvailable'),
        description: checkInStatus.message,
        variant: "destructive",
      });
      return;
    }

    try {
      await confirmPresence(guestData.id);
      setSearchState("confirmed");

      // Gerar QR Code para galeria de fotos do convidado
      if (eventId && guestData.id) {
        const photosUrl = `${window.location.origin}/event/${eventId}/guest-gallery?guestId=${guestData.id}`;
        const qrImage = await generateQRCodeImage(photosUrl);
        setPhotosQRCode(qrImage);
      }

      toast({
        title: t('messages.confirmSuccess'),
        description: t('messages.confirmSuccessDescription'),
      });
    } catch (error) {
      toast({
        title: t('messages.confirmError'),
        description: t('messages.confirmErrorDescription'),
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setSearchState("idle");
    setGuestName("");
    setGuestData(null);
    setShowGuestQRScanner(false);
    setKioskCountdown(null);
    setPhotosQRCode("");
  };

  const handleGuestQRScan = async (qrCode: string) => {
    if (!eventId) {
      toast({
        title: "Evento não encontrado",
        description: "Não foi possível identificar o evento deste QR Code.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingGuestQR(true);

    try {
      // 1) Try to decode structured QR code
      const parsed = parseQRCodeData(qrCode);
      if (!parsed || !parsed.guestId || !parsed.eventId) {
        throw new Error("QR Code inválido ou em formato antigo.");
      }

      if (parsed.eventId !== eventId) {
        throw new Error("Este QR Code pertence a outro evento.");
      }

      // 2) Check if check-in is allowed
      const checkInStatus = isCheckInAllowed();
      if (!checkInStatus.allowed) {
        throw new Error(checkInStatus.message || "Check-in não disponível no momento.");
      }

      // 3) Confirm presence via existing RPC
      const result = await confirmPresence(parsed.guestId);
      const data = result as any | null;

      // 4) Update UI to confirmed state
      setGuestData({
        id: parsed.guestId,
        name: data?.guestName ?? "Convidado",
        table_number: data?.tableNumber ?? null,
        confirmed: true,
      });
      setSearchState("confirmed");

      // Generate photos QR code
      if (eventId && parsed.guestId) {
        const photosUrl = `${window.location.origin}/event/${eventId}/guest-gallery?guestId=${parsed.guestId}`;
        const qrImage = await generateQRCodeImage(photosUrl);
        setPhotosQRCode(qrImage);
      }

      toast({
        title: "Check-in realizado!",
        description: "Sua presença foi confirmada pelo QR Code.",
      });
    } catch (error: any) {
      console.error("Erro ao processar QR de convidado:", error);
      toast({
        title: "Erro ao ler QR Code",
        description: error.message || "Não foi possível processar este QR Code.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingGuestQR(false);
    }
  };

  const handleManualEventAccess = async () => {
    const typedValue = manualEventInput.trim();

    if (!typedValue) {
      toast({
        title: "Informe um nome ou código",
        description: "Digite seu nome completo ou cole o link/código do evento.",
        variant: "destructive",
      });
      return;
    }

    const extractedId = extractEventId(typedValue);

    if (extractedId) {
      navigate(`/confirm/${extractedId}`);
      setManualEventInput("");
      return;
    }

    setIsManualLookupLoading(true);

    try {
      const matches = await searchGuestAcrossEvents(typedValue);

      if (!matches || matches.length === 0) {
        toast({
          title: "Convidado não encontrado",
          description: "Não encontramos nenhum evento recente com esse nome. Verifique a ortografia.",
          variant: "destructive",
        });
        return;
      }

      if (matches.length === 1) {
        handleSelectGuestMatch(matches[0]);
        return;
      }

      setGuestLookupMatches(matches);
      setShowGuestLookupDialog(true);
    } catch (error: any) {
      console.error("Erro ao buscar convidado globalmente:", error);
      toast({
        title: "Erro ao buscar",
        description: "Ocorreu um problema ao procurar seu nome. Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsManualLookupLoading(false);
    }
  };

  const handleSelectGuestMatch = (match: GuestLookupMatch) => {
    setShowGuestLookupDialog(false);
    setGuestLookupMatches([]);
    setManualEventInput("");
    navigate(`/confirm/${match.event_id}?prefillName=${encodeURIComponent(match.guest_name)}`);
  };

  // Auto-reset in kiosk mode after confirmation
  useEffect(() => {
    if (kioskMode && searchState === "confirmed") {
      setKioskCountdown(10);
      const interval = setInterval(() => {
        setKioskCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            handleReset();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [kioskMode, searchState]);

  // Auto-process check-in when guestId comes from URL (scanned guest QR)
  useEffect(() => {
    if (
      !isLoadingEvent &&
      eventDetails &&
      guestIdFromQR &&
      viaQR &&
      searchState === "idle"
    ) {
      const checkInStatus = isCheckInAllowed();
      if (!checkInStatus.allowed) {
        toast({
          title: "Check-in não disponível",
          description: checkInStatus.message,
          variant: "destructive",
        });
        return;
      }

      (async () => {
        try {
          const result = await confirmPresence(guestIdFromQR);
          const data = result as any | null;

          setGuestData({
            id: guestIdFromQR,
            name: data?.guestName ?? "Convidado",
            table_number: data?.tableNumber ?? null,
            confirmed: true,
          });
          setSearchState("confirmed");

          // Generate photos QR code
          if (eventId && guestIdFromQR) {
            const photosUrl = `${window.location.origin}/event/${eventId}/guest-gallery?guestId=${guestIdFromQR}`;
            const qrImage = await generateQRCodeImage(photosUrl);
            setPhotosQRCode(qrImage);
          }

          toast({
            title: "Presença confirmada!",
            description: "Seu check-in foi realizado com sucesso.",
          });
        } catch (error: any) {
          console.error("Erro no check-in via QR:", error);
          toast({
            title: "Erro ao confirmar presença",
            description: error.message || "Não foi possível confirmar sua presença pelo QR Code.",
            variant: "destructive",
          });
        }
      })();
    }
  }, [isLoadingEvent, eventDetails, guestIdFromQR, viaQR, searchState, isCheckInAllowed, confirmPresence, eventId, toast]);

  if (isLoadingEvent) {
    return (
      <div key="loading" className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                Carregando informações do evento...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quando não tem eventId ou eventId inválido, mostrar scanner
  if (!eventId || invalidEventId) {
    return (
      <div key="no-event-id" className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Voltar</span>
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
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ou informe o link/código do evento para abrir a tela de confirmação manualmente.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      placeholder="Cole o link ou código do evento"
                      value={manualEventInput}
                      onChange={(event) => setManualEventInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !isManualLookupLoading) {
                          event.preventDefault();
                          handleManualEventAccess();
                        }
                      }}
                      disabled={isManualLookupLoading}
                    />
                    <Button
                      className="sm:w-40"
                      onClick={handleManualEventAccess}
                      disabled={isManualLookupLoading}
                    >
                      {isManualLookupLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Buscando...</span>
                        </>
                      ) : (
                        <span>Buscar evento</span>
                      )}
                    </Button>
                  </div>
                </div>
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

          <Dialog
            open={showGuestLookupDialog}
            onOpenChange={(open) => {
              setShowGuestLookupDialog(open);
              if (!open) {
                setGuestLookupMatches([]);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Encontramos mais de um evento</DialogTitle>
                <DialogDescription>
                  Selecione abaixo o evento correto para continuar com a confirmação de presença.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {guestLookupMatches.map((match) => (
                  <Button
                    key={`${match.event_id}-${match.guest_id}`}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleSelectGuestMatch(match)}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">{match.event_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(match.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {match.event_location ? ` • ${match.event_location}` : ""}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right text-xs text-muted-foreground">
                      <span>{match.guest_name}</span>
                      {typeof match.table_number === "number" && (
                        <span>Mesa {match.table_number}</span>
                      )}
                      {match.confirmed && (
                        <span className="text-amber-600 dark:text-amber-400">Presença já confirmada</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowGuestLookupDialog(false);
                    setGuestLookupMatches([]);
                  }}
                >
                  <span>Cancelar</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div >
      </div>
    );
  }

  // Quando tem eventId mas o evento não existe (após o loading terminar)
  if (!isLoadingEvent && eventId && !eventDetails) {
    return (
      <div key="event-not-found" className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Evento não encontrado</CardTitle>
              <CardDescription>
                O evento que você está procurando não existe, foi removido ou o link está incorreto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                <span>Voltar para o início</span>
              </Button>
              <Button onClick={() => navigate("/confirm")} className="w-full">
                <span>Tentar com outro QR Code</span>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Se o problema continuar, peça ao organizador para enviar um novo link ou QR Code.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div key="content" className={`min-h-screen ${kioskMode ? 'bg-background' : 'bg-gradient-to-br from-background via-muted/20 to-background'} flex flex-col`}>
      {!kioskMode && <Header />}
      <div className={`flex-1 flex items-center justify-center p-4`}>
        <Card className={`${kioskMode ? 'max-w-4xl h-[90vh]' : 'max-w-2xl'} w-full shadow-lg ${kioskMode ? 'flex flex-col' : ''}`}>
          <CardHeader className={`text-center ${kioskMode ? 'space-y-4 pb-6' : 'space-y-3 pb-8'}`}>
            {kioskMode && (
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleKioskMode(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span>Sair do modo Totem</span>
                </Button>
              </div>
            )}
            {!kioskMode && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleKioskMode(true)}
                >
                  <span>Ativar modo Totem</span>
                </Button>
              </div>
            )}
            <div className={`mx-auto ${kioskMode ? 'w-20 h-20' : 'w-16 h-16'} bg-primary/10 rounded-full flex items-center justify-center mb-2`}>
              <Users className={`${kioskMode ? 'h-10 w-10' : 'h-8 w-8'} text-primary`} />
            </div>
            <CardTitle className={kioskMode ? 'text-4xl' : 'text-3xl'}>🎉 Confirme sua Presença</CardTitle>
            <CardDescription className={kioskMode ? 'text-xl' : 'text-base'}>{eventDetails.name}</CardDescription>
          </CardHeader>

          <CardContent className={`space-y-6 ${kioskMode ? 'flex-1 overflow-y-auto' : ''}`}>
            {/* Event Details */}
            <div className={`bg-muted/50 rounded-lg p-4 space-y-3 ${kioskMode ? 'text-lg' : ''}`}>
              <div className="flex items-center gap-3">
                <Calendar className={`${kioskMode ? 'h-6 w-6' : 'h-5 w-5'} text-primary`} />
                <div>
                  <p className={`font-medium ${kioskMode ? 'text-lg' : ''}`}>Data do Evento</p>
                  <p className={`${kioskMode ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                    {format(new Date(eventDetails.date), "PPP 'às' p", { locale: ptBR })}
                  </p>
                </div>
              </div>
              {eventDetails.location && (
                <div className="flex items-center gap-3">
                  <MapPin className={`${kioskMode ? 'h-6 w-6' : 'h-5 w-5'} text-primary`} />
                  <div>
                    <p className={`font-medium ${kioskMode ? 'text-lg' : ''}`}>Localização</p>
                    <p className={`${kioskMode ? 'text-base' : 'text-sm'} text-muted-foreground`}>{eventDetails.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Initial Form: Name Input + QR Scan */}
            {searchState === "idle" && (
              <div className="space-y-4">
                {!kioskMode && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">🔎 Encontre seu nome na lista</h4>
                    <p className="text-sm text-muted-foreground">
                      Para confirmar sua presença, digite seu nome completo abaixo.
                    </p>
                  </div>
                )}
                <Input
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={`${kioskMode ? 'text-2xl h-14' : ''}`}
                />
                <Button
                  onClick={() => handleSearch()}
                  disabled={!guestName.trim()}
                  className={`w-full ${kioskMode ? 'h-16 text-2xl' : ''}`}
                >
                  <span>Confirmar Presença</span>
                </Button>

                {!kioskMode && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-lg">
                      📱 Confirmar com QR Code
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Se você possui um QR Code, escaneie-o para confirmar sua
                      presença mais rapidamente.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => setShowGuestQRScanner(true)}
                    >
                      <span>Escanear QR Code</span>
                    </Button>
                  </div>
                )}

                {showGuestQRScanner && (
                  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full">
                      <CardHeader>
                        <CardTitle>Escanear QR Code do Convite</CardTitle>
                        <CardDescription>
                          Aponte a câmera para o QR Code para confirmar sua
                          presença automaticamente.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <QRCodeScanner
                          onScan={handleGuestQRScan}
                          isProcessing={isProcessingGuestQR}
                          mode="checkin"
                        />
                        <Button
                          variant="secondary"
                          className="w-full mt-4"
                          onClick={() => setShowGuestQRScanner(false)}
                        >
                          <span>Cancelar</span>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Search State: Not Found */}
            {searchState === "not-found" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-lg font-medium">
                  🤔 Convidado não encontrado
                </p>
                <p className="text-muted-foreground">
                  Não encontramos nenhum convidado com esse nome. Verifique a
                  ortografia ou tente um nome diferente.
                </p>
                <Button variant="outline" className="w-full" onClick={handleReset}>
                  <span>Tentar Novamente</span>
                </Button>
              </div>
            )}

            {/* Search State: Found */}
            {searchState === "found" && guestData && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-6 text-center space-y-4">
                  <p className={`text-xl font-medium ${kioskMode ? 'text-3xl' : ''}`}>
                    🎉 Olá, <strong>{guestData.name}</strong>!
                  </p>
                  {guestData.table_number && (
                    <p className={`text-muted-foreground ${kioskMode ? 'text-2xl' : ''}`}>
                      Sua mesa é a <strong className="text-primary">Mesa {guestData.table_number}</strong>
                    </p>
                  )}
                  <Button onClick={handleConfirm} className={`w-full ${kioskMode ? 'h-16 text-2xl' : ''}`}>
                    <span>Confirmar Presença</span>
                  </Button>
                  {!kioskMode && (
                    <Button variant="outline" className="w-full" onClick={handleReset}>
                      <span>Cancelar</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Search State: Confirmed */}
            {searchState === "confirmed" && guestData && (
              <div className="space-y-6">
                <div className={`bg-primary/5 border-2 border-primary rounded-lg ${kioskMode ? 'p-10' : 'p-6'} text-center space-y-4`}>
                  <div className={`mx-auto ${kioskMode ? 'w-24 h-24' : 'w-16 h-16'} bg-primary/10 rounded-full flex items-center justify-center`}>
                    <CheckCircle2 className={`${kioskMode ? 'h-16 w-16' : 'h-10 w-10'} text-primary`} />
                  </div>
                  <div>
                    <h3 className={`${kioskMode ? 'text-4xl' : 'text-2xl'} font-bold text-primary mb-2`}>Presença Confirmada!</h3>
                    <p className={`${kioskMode ? 'text-xl' : 'text-base'} text-muted-foreground`}>
                      Obrigado, <strong>{guestData.name}</strong>! Sua presença foi confirmada com sucesso.
                    </p>
                    {guestData.table_number && (
                      <p className={`${kioskMode ? 'mt-6 text-3xl' : 'mt-4 text-lg'}`}>
                        Você está na <strong className="text-primary">Mesa {guestData.table_number}</strong>
                      </p>
                    )}
                  </div>

                  {photosQRCode && (
                    <div className="mt-6 flex flex-col items-center space-y-2">
                      <p className={`font-medium ${kioskMode ? 'text-xl' : 'text-sm'} text-muted-foreground`}>
                        Escaneie para ver as fotos do evento
                      </p>
                      <div className="bg-white p-2 rounded-lg shadow-sm border">
                        <img src={photosQRCode} alt="QR Code para fotos" className={kioskMode ? "w-64 h-64" : "w-48 h-48"} />
                      </div>
                      <Button
                        variant="secondary"
                        className="mt-4"
                        onClick={() => window.open(`${window.location.origin}/event/${eventId}/guest-gallery?guestId=${guestData.id}`, '_blank')}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        <span>Ver Fotos do Evento</span>
                      </Button>
                    </div>
                  )}
                  {kioskMode && kioskCountdown !== null && (
                    <div className="bg-muted/50 rounded-md p-4 mt-6">
                      <p className="text-lg text-muted-foreground">
                        Voltando ao início em <strong className="text-primary text-2xl">{kioskCountdown}</strong> segundos
                      </p>
                    </div>
                  )}
                  <p className={`${kioskMode ? 'text-lg' : 'text-sm'} text-muted-foreground border-t pt-4`}>
                    Aguardamos você no evento! 🎉
                  </p>
                </div>

                <Button onClick={handleReset} variant="outline" className="w-full">
                  <span>Voltar para o início</span>
                </Button>

                {/* Show table map and photos only in non-kiosk mode */}
                {!kioskMode && (
                  <div className="space-y-6">
                    {/* Mapa das Mesas */}
                    {eventDetails.table_map_url ? (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">📍 Localização da sua mesa</h4>
                        {!mapImageError ? (
                          <>
                            <div className="border rounded-lg overflow-hidden bg-muted/20">
                              <img
                                src={eventDetails.table_map_url}
                                alt="Mapa das mesas"
                                className="w-full h-auto"
                                onLoad={() => {
                                  console.log("Mapa carregado com sucesso:", eventDetails.table_map_url);
                                }}
                                onError={() => {
                                  console.error("Erro ao carregar imagem do mapa:", eventDetails.table_map_url);
                                  setMapImageError(true);
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
                                    const link = document.createElement("a");
                                    link.href = eventDetails.table_map_url!;
                                    link.download = `mapa-mesas-${eventDetails.name}.jpg`;
                                    link.target = "_blank";
                                    link.rel = "noopener noreferrer";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    console.log("Download link clicked successfully");
                                  } catch (error) {
                                    console.error("Error downloading map:", error);
                                    toast({
                                      title: "Erro ao baixar mapa",
                                      description: "Não foi possível baixar o mapa. Tente abrir em tela cheia.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                <span>Baixar Mapa</span>
                              </Button>

                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  console.log("Fullscreen button clicked, URL:", eventDetails.table_map_url);
                                  try {
                                    window.open(eventDetails.table_map_url, "_blank", "noopener,noreferrer");
                                    console.log("Window opened successfully");
                                  } catch (error) {
                                    console.error("Error opening fullscreen:", error);
                                    toast({
                                      title: "Erro ao abrir mapa",
                                      description: "Não foi possível abrir o mapa em tela cheia.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <ZoomIn className="mr-2 h-4 w-4" />
                                <span>Ver em Tela Cheia</span>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <XCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                  Não foi possível carregar o mapa das mesas
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Isso pode acontecer por problemas temporários de conexão ou se o mapa foi removido.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setMapImageError(false);
                                  toast({
                                    title: "Recarregando...",
                                    description: "Tentando carregar o mapa novamente.",
                                  });
                                }}
                              >
                                <span>Tentar Novamente</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  window.open(eventDetails.table_map_url, "_blank");
                                }}
                              >
                                <span>Abrir em Nova Aba</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground text-sm">
                        O organizador não adicionou um mapa das mesas para este evento.
                      </div>
                    )}

                    {/* QR Code para Envio de Fotos */}
                    {photosQRCode && (
                      <div className="space-y-3 border-t pt-6">
                        <h4 className="font-semibold text-lg">📸 Compartilhe Fotos do Evento</h4>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            Escaneie o QR Code ou clique no botão para enviar suas fotos do evento
                          </p>
                          <div className="flex justify-center mb-3">
                            <img
                              src={photosQRCode}
                              alt="QR Code para enviar fotos"
                              className="w-48 h-48 border-2 border-border rounded-lg p-2 bg-white"
                            />
                          </div>
                          {guestData?.checked_in_at && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => navigate(`/event/${eventId}/guest-gallery?guestId=${guestData?.id}`)}
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              <span>Enviar Fotos</span>
                            </Button>
                          )}

                          {!guestData?.checked_in_at && (
                            <Alert>
                              <AlertDescription>
                                Você poderá enviar fotos após fazer check-in no evento.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    )}

                    <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                      <span>Voltar para o início</span>
                    </Button>
                  </div>
                )}

              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={showGuestLookupDialog}
          onOpenChange={(open) => {
            setShowGuestLookupDialog(open);
            if (!open) {
              setGuestLookupMatches([]);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Encontramos mais de um evento</DialogTitle>
              <DialogDescription>
                Selecione abaixo o evento correto para continuar com a confirmação de presença.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {guestLookupMatches.map((match) => (
                <Button
                  key={`${match.event_id}-${match.guest_id}`}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handleSelectGuestMatch(match)}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{match.event_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(match.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {match.event_location ? ` • ${match.event_location}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-right text-xs text-muted-foreground">
                    <span>{match.guest_name}</span>
                    {typeof match.table_number === "number" && (
                      <span>Mesa {match.table_number}</span>
                    )}
                    {match.confirmed && (
                      <span className="text-amber-600 dark:text-amber-400">Presença já confirmada</span>
                    )}
                  </div>
                </Button>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowGuestLookupDialog(false);
                  setGuestLookupMatches([]);
                }}
              >
                <span>Cancelar</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
