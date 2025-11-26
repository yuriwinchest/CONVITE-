import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEventPhotoAccess } from "@/hooks/useEventPhotoAccess";
import { EventPhotosUploader } from "@/components/EventPhotosUploader";
import { EventPhotoGallery } from "@/components/EventPhotoGallery";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Camera, Lock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";

export default function EventPhotos() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

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

  const { data: photoAccess, isLoading: loadingAccess } = useEventPhotoAccess(eventId);

  // Verificar se o usuário logado é o criador do evento
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const isCreator = user && event?.user_id === user.id;

  const isLoading = loadingEvent || loadingAccess;

  const handleUploadComplete = () => {
    // Invalidar a query de fotos para recarregar a galeria
    queryClient.invalidateQueries({ queryKey: ["event-photos", eventId] });
  };

  const showLoading = (loadingEvent && !event) || (loadingAccess && !photoAccess);

  if (showLoading) {
    return (
      <div key="loading" className="min-h-screen bg-background flex flex-col notranslate" translate="no">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div key="no-event" className="min-h-screen bg-background flex flex-col notranslate" translate="no">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Evento não encontrado</CardTitle>
              <CardDescription>
                O evento que você está procurando não existe ou foi removido.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!photoAccess?.canUpload) {
    return (
      <div key="no-access" className="min-h-screen bg-background flex flex-col notranslate" translate="no">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
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
                  <strong>Recurso disponível apenas nos planos Premium e Professional.</strong>
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upgrade o plano deste evento para permitir que os convidados enviem fotos!
                </p>
                <Button asChild>
                  <Link to="/dashboard">Ver Planos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div key="content" className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <Camera className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <p className="text-muted-foreground">
            {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          {event.location && (
            <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
          )}
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Envie suas Fotos</CardTitle>
              <CardDescription>
                Compartilhe momentos especiais do evento. Suas fotos ficarão disponíveis na galeria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventPhotosUploader
                eventId={eventId!}
                onUploadComplete={handleUploadComplete}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Galeria do Evento</CardTitle>
              <CardDescription>
                Veja todas as fotos compartilhadas pelos convidados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventPhotoGallery eventId={eventId!} isCreator={isCreator} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
