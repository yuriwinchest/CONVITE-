import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import { useGuests } from "@/hooks/useGuests";
import { useSubscription } from "@/hooks/useSubscription";
import { GuestForm } from "@/components/GuestForm";
import { GuestsList } from "@/components/GuestsList";
import { CSVUploader } from "@/components/CSVUploader";
import { TableManager } from "@/components/TableManager";
import { CheckInManager } from "@/components/CheckInManager";
import { EventQRCode } from "@/components/EventQRCode";
import { EventPhotoGallery } from "@/components/EventPhotoGallery";
import { useEventPhotoAccess } from "@/hooks/useEventPhotoAccess";
import { ParsedGuest } from "@/lib/csvParser";
import { useRealtimeCheckIns } from "@/hooks/useRealtimeCheckIns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PlanUpgradeModal from "@/components/PlanUpgradeModal";
import PlanUpgradeCard from "@/components/PlanUpgradeCard";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [addGuestDialogOpen, setAddGuestDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false);
  const [confirmEventName, setConfirmEventName] = useState("");
  const [pendingGuests, setPendingGuests] = useState<ParsedGuest[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const { data: events } = useEvents();
  const event = events?.find((e) => e.id === eventId);
  const { mutate: deleteEventMutation } = useDeleteEvent();

  const { guests, isLoading, addGuest, addMultipleGuests, updateGuest, deleteGuest, deleteMultipleGuests } =
    useGuests(eventId);
  
  const { canAddGuests, getGuestLimit } = useSubscription();
  const { data: photoAccess } = useEventPhotoAccess(eventId);

  // Buscar plano atual do evento
  const { data: eventPurchase } = useQuery({
    queryKey: ["event-purchase", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from("event_purchases")
        .select("*")
        .eq("event_id", eventId)
        .eq("payment_status", "paid")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Enable realtime check-in notifications
  useRealtimeCheckIns(eventId);

  // Verifica se o evento já passou
  const isEventPast = event ? new Date(event.date) < new Date() : false;

  const handleAddGuest = async (data: { name: string; email?: string; table_number?: number }) => {
    if (!eventId) return;
    
    try {
      const currentCount = guests?.length || 0;
      const { allowed, message } = await canAddGuests(eventId, currentCount, 1);
      
      if (!allowed) {
        setUpgradeMessage(message || "Você atingiu o limite de convidados do seu plano.");
        setShowUpgradeModal(true);
        return;
      }
      
      addGuest({ eventId, guest: data });
      setAddGuestDialogOpen(false);
    } catch (error) {
      console.error("Error validating guest limit:", error);
    }
  };

  const handleSendInvite = async (guestId: string) => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase.functions.invoke("send-invite", {
        body: { guestId, eventId },
      });

      if (error) throw error;

      toast({
        title: "Convite enviado!",
        description: "O convite foi enviado por email com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Não foi possível enviar o convite.",
        variant: "destructive",
      });
    }
  };

  const handleSendMultipleInvites = async (guestIds: string[]) => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase.functions.invoke("send-invite", {
        body: { guestIds, eventId },
      });

      if (error) throw error;

      const results = data?.results;
      if (results) {
        toast({
          title: "Convites enviados!",
          description: `${results.success?.length || 0} convites enviados. ${results.failed?.length > 0 ? `${results.failed.length} falharam.` : ""}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convites",
        description: error.message || "Não foi possível enviar os convites.",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async (guestId: string) => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase.functions.invoke("send-reminder", {
        body: { guestId, eventId },
      });

      if (error) throw error;

      toast({
        title: "Lembrete enviado!",
        description: "O lembrete foi enviado por email com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar lembrete",
        description: error.message || "Não foi possível enviar o lembrete.",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsAppReminder = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest || !guest.whatsapp || !event) return;

    // Remove caracteres não numéricos do WhatsApp
    const cleanPhone = guest.whatsapp.replace(/\D/g, '');
    
    // Format date
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create WhatsApp message with proper emoji encoding
    const message = `Olá, ${guest.name}! 👋

⏰ *Lembrete de Evento*

📅 *${event.name}*
📍 Data: ${formattedDate}
${event.location ? `📍 Local: ${event.location}` : ''}
${guest.table_number ? `🪑 Sua Mesa: Mesa ${guest.table_number}` : ''}

✅ *Importante:* Não esqueça de fazer seu check-in ao chegar no evento!

Nos vemos lá! 🎉`;

    // Open WhatsApp with pre-filled message - encode the entire message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp aberto",
      description: "A mensagem foi preparada. Clique em enviar no WhatsApp.",
    });
  };

  const handleSendMultipleReminders = async (guestIds: string[]) => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase.functions.invoke("send-reminder", {
        body: { guestIds, eventId },
      });

      if (error) throw error;

      const results = data?.results;
      if (results) {
        const successCount = results.success?.length || 0;
        const failedCount = results.failed?.length || 0;
        
        toast({
          title: "Lembretes enviados!",
          description: `${successCount} lembretes enviados por email.${failedCount > 0 ? ` ${failedCount} falharam.` : ""}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar lembretes",
        description: error.message || "Não foi possível enviar os lembretes.",
        variant: "destructive",
      });
    }
  };

  const handleSendMultipleWhatsAppReminders = (guestIds: string[]) => {
    if (!event) return;

    const selectedGuests = guests.filter(g => guestIds.includes(g.id) && g.whatsapp);
    
    if (selectedGuests.length === 0) {
      toast({
        title: "Nenhum convidado com WhatsApp",
        description: "Os convidados selecionados não possuem WhatsApp cadastrado.",
        variant: "destructive",
      });
      return;
    }

    // Format date
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let openedCount = 0;

    selectedGuests.forEach((guest, index) => {
      const cleanPhone = guest.whatsapp!.replace(/\D/g, '');
      
      // Create message with proper emoji encoding
      const message = `Olá, ${guest.name}! 👋

⏰ *Lembrete de Evento*

📅 *${event.name}*
📍 Data: ${formattedDate}
${event.location ? `📍 Local: ${event.location}` : ''}
${guest.table_number ? `🪑 Sua Mesa: Mesa ${guest.table_number}` : ''}

✅ *Importante:* Não esqueça de fazer seu check-in ao chegar no evento!

Nos vemos lá! 🎉`;

      // Encode the entire message properly for WhatsApp
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      // Open with delay to avoid popup blockers
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        openedCount++;
        
        if (openedCount === selectedGuests.length) {
          toast({
            title: "WhatsApp aberto",
            description: `${selectedGuests.length} conversas preparadas. Clique em enviar em cada janela do WhatsApp.`,
          });
        }
      }, index * 1000); // 1 segundo de delay entre cada abertura
    });

    if (selectedGuests.length < guestIds.length) {
      toast({
        title: "Aviso",
        description: `${guestIds.length - selectedGuests.length} convidados não possuem WhatsApp cadastrado e foram ignorados.`,
      });
    }
  };

  const handleCSVParsed = (guests: ParsedGuest[]) => {
    setPendingGuests(guests);
  };

  const handleConfirmCSVImport = async () => {
    if (!eventId || pendingGuests.length === 0) return;
    
    try {
      const currentCount = guests?.length || 0;
      const toAdd = pendingGuests.length;
      const { allowed, message, limit } = await canAddGuests(eventId, currentCount, toAdd);
      
      if (!allowed) {
        const remaining = limit - currentCount;
        const detailedMessage = remaining > 0 
          ? `${message}\n\nVocê pode adicionar apenas mais ${remaining} convidado(s) no plano atual.`
          : message;
        setUpgradeMessage(detailedMessage || "Você atingiu o limite de convidados do seu plano.");
        setShowUpgradeModal(true);
        return;
      }
      
      addMultipleGuests({ eventId, guests: pendingGuests });
      setPendingGuests([]);
      setCsvDialogOpen(false);
    } catch (error) {
      console.error("Error validating CSV import:", error);
    }
  };

  const handleDeleteEvent = () => {
    if (!eventId || !event) return;
    if (confirmEventName !== event.name) return;
    
    deleteEventMutation(eventId, {
      onSuccess: () => {
        navigate("/dashboard");
      },
    });
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Evento não encontrado</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setDeleteEventDialogOpen(true)}
            disabled={isEventPast}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar Evento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <CardTitle className="text-3xl">{event.name}</CardTitle>
              {eventPurchase && (
                <Badge variant={eventPurchase.plan === "PREMIUM" ? "default" : "secondary"}>
                  {eventPurchase.plan === "PREMIUM" ? "Premium" : "Essencial"}
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground space-y-1">
              <p>
                Data: {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              {event.location && <p>Local: {event.location}</p>}
              {event.description && <p>Descrição: {event.description}</p>}
            </div>
          </CardHeader>
        </Card>

        {isEventPast && (
          <Alert variant="default" className="border-2 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-900 dark:text-yellow-200 font-semibold">Evento Realizado</AlertTitle>
            <AlertDescription className="text-yellow-800 dark:text-yellow-300">
              Este evento já foi realizado e não pode ser editado ou fazer upgrade de plano.
            </AlertDescription>
          </Alert>
        )}

        {eventPurchase?.plan === "ESSENTIAL" && (
          <PlanUpgradeCard 
            eventId={eventId || ""} 
            currentPlan="ESSENTIAL"
            eventDate={event.date}
          />
        )}

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              ⏰ Lembretes Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="reminder-days">Enviar lembrete automático</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="reminder-days"
                    type="number"
                    min="0"
                    max="30"
                    placeholder="Ex: 3"
                    defaultValue={event.reminder_days_before || ""}
                    className="w-32"
                    onBlur={async (e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      try {
                        const { error } = await supabase
                          .from("events")
                          .update({ reminder_days_before: value })
                          .eq("id", eventId!);
                        
                        if (error) throw error;
                        
                        toast({
                          title: value 
                            ? "Lembretes automáticos ativados!" 
                            : "Lembretes automáticos desativados",
                          description: value 
                            ? `Lembretes serão enviados ${value} ${value === 1 ? 'dia' : 'dias'} antes do evento às 9h` 
                            : "Lembretes automáticos foram desativados",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Erro ao atualizar",
                          description: error.message,
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground self-center">
                    {event.reminder_days_before ? `${event.reminder_days_before} ${event.reminder_days_before === 1 ? 'dia' : 'dias'} antes` : 'dias antes do evento'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  📧 Lembretes são enviados automaticamente por email todos os dias às 9h da manhã. Deixe vazio para desativar.
                </p>
                {event.last_reminder_sent_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ✅ Último envio: {format(new Date(event.last_reminder_sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="guests" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="guests">Convidados</TabsTrigger>
            <TabsTrigger value="tables">Mesas</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
          </TabsList>

          <TabsContent value="guests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Convidados ({guests.length}
                      {event.capacity ? ` / ${event.capacity}` : ""})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Limite do plano: {guests.length}/{(() => {
                        const limit = getGuestLimit();
                        return limit === Infinity ? "∞" : limit;
                      })()} ({(() => {
                        const limit = getGuestLimit();
                        if (limit === Infinity) return "ilimitado";
                        return Math.round((guests.length / limit) * 100) + "% usado";
                      })()})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setCsvDialogOpen(true)} disabled={isEventPast}>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar CSV
                    </Button>
                    <Button onClick={() => setAddGuestDialogOpen(true)} disabled={isEventPast}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Convidado
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando convidados...
                  </div>
                ) : (
                  <GuestsList
                    guests={guests}
                    eventId={eventId!}
                    eventName={event.name}
                    eventDate={event.date}
                    eventLocation={event.location}
                    onEdit={(guestId, data) => updateGuest({ guestId, guest: data })}
                    onDelete={deleteGuest}
                    onDeleteMultiple={deleteMultipleGuests}
                    onSendInvite={handleSendInvite}
                    onSendMultipleInvites={handleSendMultipleInvites}
                    onSendReminder={handleSendReminder}
                    onSendWhatsAppReminder={handleSendWhatsAppReminder}
                    onSendMultipleReminders={handleSendMultipleReminders}
                    onSendMultipleWhatsAppReminders={handleSendMultipleWhatsAppReminders}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables">
            <TableManager eventId={eventId!} />
          </TabsContent>

          <TabsContent value="qrcode">
            <EventQRCode eventId={eventId!} eventName={event.name} />
          </TabsContent>

          <TabsContent value="checkin">
            <CheckInManager eventId={eventId!} />
          </TabsContent>

          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Fotos do Evento</CardTitle>
                <CardDescription>
                  {photoAccess?.canUpload 
                    ? "Veja e gerencie as fotos enviadas pelos convidados (até 30 fotos por convidado)" 
                    : "Recurso disponível apenas no plano Premium"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {photoAccess?.canUpload ? (
                  <EventPhotoGallery eventId={eventId!} isCreator={true} />
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">
                      Upgrade para Premium para permitir que seus convidados enviem até 30 fotos cada no evento.
                    </p>
                    <Button onClick={() => setShowUpgradeModal(true)}>
                      Ver Planos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={addGuestDialogOpen} onOpenChange={setAddGuestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Convidado</DialogTitle>
            </DialogHeader>
            <GuestForm
              onSubmit={handleAddGuest}
              onCancel={() => setAddGuestDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={csvDialogOpen} onOpenChange={(open) => {
          setCsvDialogOpen(open);
          if (!open) {
            setPendingGuests([]);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Importar Convidados via CSV</DialogTitle>
              <DialogDescription>
                Carregue um arquivo CSV com seus convidados
              </DialogDescription>
            </DialogHeader>
            <CSVUploader onGuestsParsed={handleCSVParsed} />
            {pendingGuests.length > 0 && (
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h4 className="font-semibold mb-2">
                    Preview ({pendingGuests.length} convidados)
                  </h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-3">
                    {pendingGuests.map((guest, index) => (
                      <div key={index} className="text-sm border-b pb-2 last:border-0">
                        <div><strong>Nome:</strong> {guest.name}</div>
                        {guest.email && <div><strong>Email:</strong> {guest.email}</div>}
                        {guest.whatsapp && <div><strong>WhatsApp:</strong> {guest.whatsapp}</div>}
                        {guest.table_number && <div><strong>Mesa:</strong> {guest.table_number}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPendingGuests([]);
                    }}
                  >
                    Limpar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPendingGuests([]);
                      setCsvDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmCSVImport}>
                    Confirmar Importação
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <PlanUpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          reason="guest_limit"
          message={upgradeMessage}
          eventId={eventId}
        />

        <AlertDialog open={deleteEventDialogOpen} onOpenChange={setDeleteEventDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Deletar evento permanentemente</AlertDialogTitle>
              <AlertDialogDescription>
                Isso removerá o evento "{event?.name}" e todos os {guests.length} convidado{guests.length !== 1 ? 's' : ''} associado{guests.length !== 1 ? 's' : ''}. 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirm-name">
                Digite o nome do evento para confirmar:
              </Label>
              <Input
                id="confirm-name"
                value={confirmEventName}
                onChange={(e) => setConfirmEventName(e.target.value)}
                placeholder={event?.name}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmEventName("")}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEvent}
                disabled={confirmEventName !== event?.name}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deletar Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
