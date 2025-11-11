import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeScanner } from "./QRCodeScanner";
import { CheckInList } from "./CheckInList";
import { CheckInStats } from "./CheckInStats";
import { CheckedInGuestsList } from "./CheckedInGuestsList";
import { useGuests } from "@/hooks/useGuests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CheckInManagerProps {
  eventId: string;
}

export function CheckInManager({ eventId }: CheckInManagerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { guests, checkInGuest } = useGuests(eventId);
  const queryClient = useQueryClient();

  const handleQRCodeScan = async (qrCode: string) => {
    setIsProcessing(true);
    
    try {
      // Tentar decodificar QR Code estruturado (novo formato)
      let guestId: string | null = null;
      
      try {
        const decoded = atob(qrCode);
        const data = JSON.parse(decoded);
        
        if (data.guestId && data.eventId === eventId) {
          guestId = data.guestId;
        }
      } catch {
        // Se não for QR Code estruturado, tentar buscar pelo campo qr_code (formato antigo)
        const guestByQRCode = guests.find(g => g.qr_code === qrCode);
        if (guestByQRCode) {
          guestId = guestByQRCode.id;
        }
      }
      
      if (!guestId) {
        throw new Error("QR Code inválido ou convidado não encontrado.");
      }
      
      const guest = guests.find(g => g.id === guestId);
      
      if (!guest) {
        throw new Error("Convidado não encontrado neste evento.");
      }

      if (guest.checked_in_at) {
        throw new Error(`${guest.name} já fez check-in anteriormente.`);
      }

      // Perform check-in
      await supabase
        .from("guests")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("id", guest.id);

      // Invalidate queries to update UI
      await queryClient.invalidateQueries({ queryKey: ["guests", eventId] });

      console.log(`✅ Check-in realizado para ${guest.name} (ID: ${guest.id})`);
      console.log(`📊 Atualizando lista de check-ins...`);

      toast({
        title: "Check-in realizado!",
        description: `Presença confirmada para ${guest.name}${guest.table_number ? ` - Mesa ${guest.table_number}` : ''}.`,
      });
    } catch (error: any) {
      throw new Error(error.message || "Erro ao processar check-in");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCheckIn = async (guestId: string) => {
    try {
      await supabase
        .from("guests")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("id", guestId);

      await queryClient.invalidateQueries({ queryKey: ["guests", eventId] });

      const guest = guests.find(g => g.id === guestId);
      console.log(`✅ Check-in manual realizado para ${guest?.name} (ID: ${guestId})`);
      
      toast({
        title: "Check-in realizado!",
        description: `Presença confirmada para ${guest?.name}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer check-in",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <CheckInStats guests={guests} />

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">Scanner QR Code</TabsTrigger>
          <TabsTrigger value="list">Lista de Convidados</TabsTrigger>
          <TabsTrigger value="checked-in">Check-ins Realizados</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <QRCodeScanner onScan={handleQRCodeScan} isProcessing={isProcessing} />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <CheckInList guests={guests} onManualCheckIn={handleManualCheckIn} />
        </TabsContent>

        <TabsContent value="checked-in" className="space-y-4">
          <CheckedInGuestsList guests={guests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
