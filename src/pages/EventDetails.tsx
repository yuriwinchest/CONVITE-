import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEvents } from "@/hooks/useEvents";
import { useGuests } from "@/hooks/useGuests";
import { GuestForm } from "@/components/GuestForm";
import { GuestsList } from "@/components/GuestsList";
import { CSVUploader } from "@/components/CSVUploader";
import { ParsedGuest } from "@/lib/csvParser";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [addGuestDialogOpen, setAddGuestDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [pendingGuests, setPendingGuests] = useState<ParsedGuest[]>([]);

  const { data: events } = useEvents();
  const event = events?.find((e) => e.id === eventId);

  const { guests, isLoading, addGuest, addMultipleGuests, updateGuest, deleteGuest } =
    useGuests(eventId);

  const handleAddGuest = (data: { name: string; table_number?: number }) => {
    if (!eventId) return;
    addGuest({ eventId, guest: data });
    setAddGuestDialogOpen(false);
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
                onEdit={(guestId, data) => updateGuest({ guestId, guest: data })}
                onDelete={deleteGuest}
              />
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
