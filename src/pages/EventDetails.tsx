import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { GuestForm } from "@/components/GuestForm";
import { GuestsList } from "@/components/GuestsList";
import { CSVUploader } from "@/components/CSVUploader";
import { TableManager } from "@/components/TableManager";
import { CheckInManager } from "@/components/CheckInManager";
import { EventQRCode } from "@/components/EventQRCode";
import { ParsedGuest } from "@/lib/csvParser";
import { useRealtimeCheckIns } from "@/hooks/useRealtimeCheckIns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [addGuestDialogOpen, setAddGuestDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false);
  const [confirmEventName, setConfirmEventName] = useState("");
  const [pendingGuests, setPendingGuests] = useState<ParsedGuest[]>([]);

  const { data: events } = useEvents();
  const event = events?.find((e) => e.id === eventId);
  const { mutate: deleteEventMutation } = useDeleteEvent();

  const { guests, isLoading, addGuest, addMultipleGuests, updateGuest, deleteGuest, deleteMultipleGuests } =
    useGuests(eventId);

  // Enable realtime check-in notifications
  useRealtimeCheckIns(eventId);

  const handleAddGuest = (data: { name: string; email?: string; table_number?: number }) => {
    if (!eventId) return;
    addGuest({ eventId, guest: data });
    setAddGuestDialogOpen(false);
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

    // Create WhatsApp message
    const message = `Olá, ${guest.name}! 👋

⏰ *Lembrete de Evento*

📅 *${event.name}*
📍 Data: ${formattedDate}
${event.location ? `📍 Local: ${event.location}` : ''}
${guest.table_number ? `🪑 Sua Mesa: Mesa ${guest.table_number}` : ''}

✅ *Importante:* Não esqueça de fazer seu check-in ao chegar no evento!

Nos vemos lá! 🎉`;

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp aberto",
      description: "A mensagem foi preparada. Clique em enviar no WhatsApp.",
    });
  };

  const handleCSVParsed = (guests: ParsedGuest[]) => {
    setPendingGuests(guests);
  };

  const handleConfirmCSVImport = () => {
    if (!eventId || pendingGuests.length === 0) return;
    addMultipleGuests({ eventId, guests: pendingGuests });
    setPendingGuests([]);
    setCsvDialogOpen(false);
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
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar Evento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{event.name}</CardTitle>
            <div className="text-muted-foreground space-y-1">
              <p>
                Data: {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              {event.location && <p>Local: {event.location}</p>}
              {event.description && <p>Descrição: {event.description}</p>}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="guests" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="guests">Convidados</TabsTrigger>
            <TabsTrigger value="tables">Mesas</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
          </TabsList>

          <TabsContent value="guests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Convidados ({guests.length}
                    {event.capacity ? ` / ${event.capacity}` : ""})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={() => setCsvDialogOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar CSV
                    </Button>
                    <Button onClick={() => setAddGuestDialogOpen(true)}>
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

        <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importar Convidados via CSV</DialogTitle>
            </DialogHeader>
            <CSVUploader onGuestsParsed={handleCSVParsed} />
            {pendingGuests.length > 0 && (
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h4 className="font-semibold mb-2">
                    Preview ({pendingGuests.length} convidados)
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {pendingGuests.map((guest, index) => (
                      <div key={index} className="text-sm">
                        {guest.name} {guest.table_number && `(Mesa ${guest.table_number})`}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
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
