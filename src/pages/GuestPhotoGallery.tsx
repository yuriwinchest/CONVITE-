import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EventPhotosUploader } from "@/components/EventPhotosUploader";
import { EventPhotoGallery } from "@/components/EventPhotoGallery";
import { useEventPhotoAccess } from "@/hooks/useEventPhotoAccess";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Camera, Lock, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GuestPhotoGallery() {
  const { eventId } = useParams<{ eventId: string }>();
  const [email, setEmail] = useState("");
  const [guestId, setGuestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Auto-login if guestId is in URL
  const [searchParams] = useSearchParams();
  const guestIdParam = searchParams.get("guestId");
  const hasGuestIdInUrl = !!guestIdParam;

  // Use modo de convidado se tem guestId na URL
  const { data: photoAccess, isLoading: loadingAccess } = useEventPhotoAccess(
    eventId,
    hasGuestIdInUrl
  );

  useEffect(() => {
    if (guestIdParam && !guestId) {
      setGuestId(guestIdParam);
    }
  }, [guestIdParam, guestId]);

  const handleAccessGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: guest, error } = await supabase
        .from("guests")
        .select("id, name, checked_in_at")
        .eq("event_id", eventId!)
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (!guest) {
        toast({
          title: "Convidado não encontrado",
          description: "Verifique se o email está correto.",
          variant: "destructive",
        });
        return;
      }

      if (!guest.checked_in_at) {
        toast({
          title: "Check-in necessário",
          description: "Você precisa fazer check-in no evento antes de enviar fotos.",
          variant: "destructive",
        });
        return;
      }

      setGuestId(guest.id);
      toast({
        title: "Bem-vindo!",
        description: `Olá ${guest.name}, acesse sua galeria de fotos.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao acessar galeria",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvent || loadingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Evento não encontrado</CardTitle>
            <CardDescription>
              O evento que você está procurando não existe ou foi removido.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Se não é acesso de convidado (não tem guestId na URL) e não tem permissão, mostrar upgrade
  if (!hasGuestIdInUrl && !photoAccess?.canUpload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">{event.name}</CardTitle>
            <CardDescription className="text-base">
              {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription className="text-center">
                O envio de fotos não está disponível para este evento.
                <br />
                <strong>Recurso disponível apenas no plano Premium.</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se é acesso de convidado mas não tem plano premium, mostrar mensagem
  if (hasGuestIdInUrl && !photoAccess?.canUpload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">{event.name}</CardTitle>
            <CardDescription className="text-base">
              {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription className="text-center">
                O envio de fotos não está disponível para este evento.
                <br />
                <strong>Recurso disponível apenas no plano Premium.</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!guestId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Camera className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">{event.name}</CardTitle>
            <CardDescription>
              {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccessGallery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email cadastrado</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite o email que você usou para confirmar presença
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Acessar Minha Galeria"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <Camera className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <p className="text-muted-foreground">
            {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          {event.location && (
            <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setGuestId(null)}
          >
            Trocar Convidado
          </Button>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Envie suas Fotos</CardTitle>
              <CardDescription>
                Você pode enviar até 30 fotos do evento. Suas fotos ficarão em sua galeria privada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventPhotosUploader
                eventId={eventId!}
                guestId={guestId}
                onUploadComplete={() => {
                  // Atualizar galeria
                  window.location.reload();
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minhas Fotos</CardTitle>
              <CardDescription>
                Veja todas as fotos que você enviou deste evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventPhotoGallery eventId={eventId!} guestId={guestId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
