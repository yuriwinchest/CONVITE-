import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MapPin, Sparkles, ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CSVUploader } from "./CSVUploader";
import { ParsedGuest } from "@/lib/csvParser";

const eventSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  date: z.date({ required_error: "Data do evento é obrigatória" }),
  location: z.string().min(3, { message: "Local deve ter no mínimo 3 caracteres" }),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateEventDialog = ({ open, onOpenChange }: CreateEventDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tempGuests, setTempGuests] = useState<ParsedGuest[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestTableNumber, setGuestTableNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const selectedDate = watch("date");

  const handleAddManualGuest = () => {
    if (!guestName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do convidado é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const tableNum = guestTableNumber.trim() ? parseInt(guestTableNumber.trim()) : undefined;
    if (guestTableNumber.trim() && (!tableNum || tableNum < 1)) {
      toast({
        title: "Erro",
        description: "Número da mesa deve ser um número positivo",
        variant: "destructive",
      });
      return;
    }

    const newGuest: ParsedGuest = {
      name: guestName.trim(),
      table_number: tableNum,
    };

    setTempGuests([...tempGuests, newGuest]);
    setGuestName("");
    setGuestTableNumber("");
  };

  const handleRemoveGuest = (index: number) => {
    setTempGuests(tempGuests.filter((_, i) => i !== index));
  };

  const handleCSVParsed = (guests: ParsedGuest[]) => {
    setTempGuests([...tempGuests, ...guests]);
    toast({
      title: "Convidados carregados",
      description: `${guests.length} convidados adicionados da lista CSV`,
    });
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para criar um evento",
          variant: "destructive",
        });
        return;
      }

      const { data: eventData, error } = await supabase.from("events").insert({
        user_id: user.id,
        name: data.name,
        date: data.date.toISOString(),
        location: data.location,
      }).select().single();

      if (error) throw error;

      // Se houver convidados temporários, adicioná-los ao evento
      if (tempGuests.length > 0 && eventData) {
        const guestsToInsert = tempGuests.map(guest => ({
          event_id: eventData.id,
          name: guest.name,
          table_number: guest.table_number,
        }));

        const { error: guestsError } = await supabase
          .from("guests")
          .insert(guestsToInsert);

        if (guestsError) {
          toast({
            title: "Evento criado com aviso",
            description: "O evento foi criado, mas houve erro ao adicionar alguns convidados.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Evento criado!",
            description: `Evento criado com ${tempGuests.length} convidados.`,
          });
        }
      } else {
        toast({
          title: "Evento criado com sucesso!",
          description: "Seu evento foi cadastrado.",
        });
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });

      // Reset form and close dialog
      reset();
      setTempGuests([]);
      setGuestName("");
      setGuestTableNumber("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Erro ao criar evento",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b border-border p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <DialogTitle className="text-2xl font-bold">
                  Criar Evento
                </DialogTitle>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-6">
          <form id="event-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-6">Detalhes do Evento</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Evento</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Casamento de Maria e João"
                    className="bg-primary/5 border-primary/20"
                    {...register("name")}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Data do Evento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-primary/5 border-primary/20",
                          !selectedDate && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setValue("date", date)}
                        initialFocus
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-sm text-destructive">{errors.date.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <Label htmlFor="location">Local</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Ex: Brasília, Brasil"
                    className="pl-10 bg-primary/5 border-primary/20"
                    {...register("location")}
                    disabled={isLoading}
                  />
                </div>
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Convidados (opcional)</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nome do convidado"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddManualGuest();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Input
                    type="number"
                    placeholder="Número da mesa"
                    value={guestTableNumber}
                    onChange={(e) => setGuestTableNumber(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddManualGuest();
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddManualGuest}
                  className="w-full"
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Convidado
                </Button>
              </div>

              <CSVUploader onGuestsParsed={handleCSVParsed} />

              {tempGuests.length > 0 && (
                <div className="rounded-md border p-4">
                  <h4 className="font-semibold mb-2">
                    Convidados adicionados ({tempGuests.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {tempGuests.map((guest, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm bg-muted p-2 rounded"
                      >
                        <span>
                          {guest.name} {guest.table_number && `(Mesa ${guest.table_number})`}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveGuest(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="border-t border-border p-6 flex-shrink-0">
          <Button
            type="submit"
            form="event-form"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
            disabled={isLoading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isLoading 
              ? "Criando..." 
              : tempGuests.length > 0 
                ? `Criar Evento com ${tempGuests.length} convidados`
                : "Criar Evento"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
