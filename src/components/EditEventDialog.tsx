import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MapPin, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";

const eventSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  date: z.date({ required_error: "Data do evento é obrigatória" }),
  time: z.string().min(1, { message: "Hora do evento é obrigatória" }),
  location: z.string().min(3, { message: "Local deve ter no mínimo 3 caracteres" }),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Tables<"events"> | null;
}

const EditEventDialog = ({ open, onOpenChange, event }: EditEventDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Verifica se o evento já passou
  const isEventPast = event ? new Date(event.date) < new Date() : false;

  // Previne abertura do dialog para eventos passados
  useEffect(() => {
    if (open && isEventPast) {
      toast({
        title: "Evento não pode ser editado",
        description: "Não é possível editar eventos que já foram realizados.",
        variant: "destructive",
      });
      onOpenChange(false);
    }
  }, [open, isEventPast, toast, onOpenChange]);

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

  // Populate form when event changes
  useEffect(() => {
    if (event && open) {
      const eventDate = new Date(event.date);
      setValue("name", event.name);
      setValue("date", eventDate);
      setValue("time", format(eventDate, "HH:mm"));
      setValue("location", event.location || "");
    }
  }, [event, open, setValue]);

  const onSubmit = async (data: EventFormData) => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(':');
      const eventDateTime = new Date(data.date);
      eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase
        .from("events")
        .update({
          name: data.name,
          date: eventDateTime.toISOString(),
          location: data.location,
        })
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Evento atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      toast({
        title: "Erro ao atualizar evento",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Editar Evento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome do Evento */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Nome do Evento *
            </Label>
            <Input
              id="name"
              placeholder="Ex: Aniversário da Maria"
              {...register("name")}
              className="border-border/40"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Data do Evento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-border/40",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setValue("date", date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-foreground">
                Horário *
              </Label>
              <Input
                id="time"
                type="time"
                {...register("time")}
                className="border-border/40"
              />
              {errors.time && (
                <p className="text-sm text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Local */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground">
              Local do Evento *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Ex: Salão de Festas Premium"
                {...register("location")}
                className="pl-10 border-border/40"
              />
            </div>
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;
