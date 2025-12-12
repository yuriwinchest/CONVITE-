import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X, Upload } from "lucide-react";
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
import { useSubscription } from "@/hooks/useSubscription";
import { useCart, CartItem } from "@/hooks/useCart";

const eventSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  date: z.date({ required_error: "Data do evento é obrigatória" }),
  time: z.string().min(1, { message: "Hora do evento é obrigatória" }),
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
  const { plan, canCreateEventThisMonth } = useSubscription();
  const { addToCart } = useCart();
  const [canCreate, setCanCreate] = useState(true);
  const [needsToPay, setNeedsToPay] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      const status = await canCreateEventThisMonth();
      
      if (plan === "PREMIUM") {
        // Premium pode criar até 5 eventos por mês gratuitamente
        setCanCreate(status.allowed);
        setNeedsToPay(false);
        setStatusMessage(status.allowed ? "" : status.message || "");
      } else if (plan === "FREE") {
        // FREE tem 1 evento gratuito, depois adiciona ao carrinho
        setCanCreate(true); // Sempre pode, mas pode precisar pagar
        setNeedsToPay(!status.allowed);
        setStatusMessage(status.allowed ? "" : "");
      } else {
        // ESSENTIAL sempre adiciona ao carrinho
        setCanCreate(true);
        setNeedsToPay(true);
        setStatusMessage("");
      }
    }
    onOpenChange(newOpen);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast({ title: "Formato inválido", description: "Apenas PNG e JPG são aceitos", variant: "destructive" });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }
    
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddToCart = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      const [hours, minutes] = data.time.split(':');
      const eventDateTime = new Date(data.date);
      eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Upload do mapa antes de adicionar ao carrinho
      let tableMapUrl: string | null = null;
      if (selectedImage) {
        const tempId = crypto.randomUUID();
        const fileName = `pending-${tempId}-${Date.now()}-${selectedImage.name}`;
        const { error: uploadError } = await supabase.storage
          .from("event-maps")
          .upload(fileName, selectedImage);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("event-maps")
            .getPublicUrl(fileName);
          tableMapUrl = publicUrl;
        }
      }

      const cartItem: CartItem = {
        event_name: data.name,
        plan: "ESSENTIAL",
        amount: 79,
        event_data: {
          name: data.name,
          date: eventDateTime.toISOString(),
          location: data.location,
          reminder_days_before: data.reminder_days_before,
          table_map_url: tableMapUrl,
        },
      };

      await addToCart.mutateAsync(cartItem);
      reset();
      setSelectedImage(null);
      setImagePreview(null);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    // Se precisa pagar, adiciona ao carrinho
    if (needsToPay) {
      await handleAddToCart(data);
      return;
    }

    // Criar evento gratuitamente (FREE com quota ou PREMIUM)
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [hours, minutes] = data.time.split(':');
      const eventDateTime = new Date(data.date);
      eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data: eventData, error } = await supabase.from("events").insert({
        user_id: user.id,
        name: data.name,
        date: eventDateTime.toISOString(),
        location: data.location,
        reminder_days_before: data.reminder_days_before || 1,
      }).select().single();

      if (error) throw error;

      if (selectedImage && eventData) {
        console.log("[CreateEventDialog] Uploading table map...", { eventId: eventData.id, fileName: selectedImage.name });
        const fileName = `${user.id}/${eventData.id}-${Date.now()}-${selectedImage.name}`;
        const { error: uploadError, data: uploadData } = await supabase.storage.from("event-maps").upload(fileName, selectedImage);
        
        if (uploadError) {
          console.error("[CreateEventDialog] Upload error:", uploadError);
          toast({
            title: "Aviso",
            description: "Evento criado, mas houve erro ao enviar o mapa. Você pode adicionar depois na página do evento.",
            variant: "destructive",
          });
        } else {
          console.log("[CreateEventDialog] Upload success:", uploadData);
          const { data: { publicUrl } } = supabase.storage.from("event-maps").getPublicUrl(fileName);
          console.log("[CreateEventDialog] Public URL:", publicUrl);
          const { error: updateError } = await supabase.from("events").update({ table_map_url: publicUrl }).eq("id", eventData.id);
          if (updateError) {
            console.error("[CreateEventDialog] Update error:", updateError);
          } else {
            console.log("[CreateEventDialog] Map URL saved successfully");
          }
        }
      }

      const description = plan === "PREMIUM" 
        ? "🎉 Seu evento Premium foi criado com sucesso!"
        : "✅ Seu evento gratuito foi criado com sucesso!";

      toast({ 
        title: "Evento criado!", 
        description,
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["user-event-plans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      reset();
      setSelectedImage(null);
      setImagePreview(null);
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível criar o evento.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan === "PREMIUM" 
              ? "Criar Evento Premium" 
              : needsToPay 
              ? "Adicionar ao Carrinho (R$ 79)" 
              : "Criar Evento Gratuito"}
          </DialogTitle>
          {statusMessage && (
            <p className="text-sm text-destructive mt-2">{statusMessage}</p>
          )}
        </DialogHeader>

        {!canCreate ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">{statusMessage}</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Fechar
            </Button>
          </div>
        ) : (

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent><Calendar mode="single" selected={selectedDate} onSelect={(date) => setValue("date", date as Date)} locale={ptBR} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="time">Hora *</Label>
              <Input id="time" type="time" {...register("time")} />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Local *</Label>
            <Input id="location" {...register("location")} />
          </div>

          <div>
            <Label htmlFor="reminder_days_before">Lembrete (dias antes)</Label>
            <Input id="reminder_days_before" type="number" min="0" max="30" defaultValue="1" {...register("reminder_days_before", { valueAsNumber: true })} />
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setSelectedImage(null); setImagePreview(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">Mapa de mesas (opcional)</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading 
                ? "Processando..." 
                : needsToPay 
                ? "Adicionar ao Carrinho (R$ 79)" 
                : plan === "PREMIUM"
                ? "Criar Evento Premium"
                : "Criar Evento Gratuito"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
