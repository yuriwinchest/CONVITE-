import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MapPin, Sparkles, ArrowLeft, X, Upload } from "lucide-react";
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

const eventSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  date: z.date({ required_error: "Data do evento é obrigatória" }),
  location: z.string().min(3, { message: "Local deve ter no mínimo 3 caracteres" }),
  reminder_days_before: z.number().min(0).max(30).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateEventDialog = ({ open, onOpenChange }: CreateEventDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Verificar tipo de arquivo
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast({ 
        title: "Formato inválido", 
        description: "Apenas PNG e JPG são aceitos", 
        variant: "destructive" 
      });
      return;
    }
    
    // Verificar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "Arquivo muito grande", 
        description: "Máximo 5MB", 
        variant: "destructive" 
      });
      return;
    }
    
    setSelectedImage(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
        reminder_days_before: data.reminder_days_before || null,
      }).select().single();

      if (error) throw error;

      let tableMapUrl = null;
      
      // Se houver imagem selecionada, fazer upload
      if (selectedImage && eventData) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}/${eventData.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-maps')
          .upload(fileName, selectedImage, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({ 
            title: "Evento criado com aviso", 
            description: "Evento criado, mas o mapa não foi enviado.", 
            variant: "destructive" 
          });
        } else {
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from('event-maps')
            .getPublicUrl(fileName);
          
          tableMapUrl = urlData.publicUrl;
          
          // Atualizar evento com URL da imagem
          await supabase.from('events')
            .update({ table_map_url: tableMapUrl })
            .eq('id', eventData.id);
        }
      }

      toast({
        title: "Evento criado com sucesso!",
        description: "Agora você pode adicionar convidados na página do evento.",
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });

      // Reset form and close dialog
      reset();
      setSelectedImage(null);
      setImagePreview(null);
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

              <div className="space-y-2 mt-6">
                <Label htmlFor="reminder_days_before">Lembrete Automático (opcional)</Label>
                <div className="space-y-2">
                  <Input
                    id="reminder_days_before"
                    type="number"
                    min="0"
                    max="30"
                    placeholder="Ex: 3 (para enviar 3 dias antes)"
                    className="bg-primary/5 border-primary/20"
                    {...register("reminder_days_before", { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === "" ? undefined : Number(v)
                    })}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    📧 Lembretes serão enviados automaticamente por email X dias antes do evento (deixe vazio para desativar)
                  </p>
                </div>
                {errors.reminder_days_before && (
                  <p className="text-sm text-destructive">{errors.reminder_days_before.message}</p>
                )}
              </div>

              <div className="space-y-2 mt-6">
                <Label htmlFor="tableMap">Mapa das Mesas (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview do mapa" 
                        className="mx-auto max-h-48 rounded-lg object-contain"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Clique para selecionar ou arraste a imagem
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG ou JPG, máximo 5MB
                      </p>
                      <Input
                        id="tableMap"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('tableMap')?.click()}
                      >
                        Selecionar Imagem
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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
            {isLoading ? "Criando..." : "Criar Evento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
