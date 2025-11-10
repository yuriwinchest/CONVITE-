import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeScanner } from "./QRCodeScanner";
import { CheckInList } from "./CheckInList";
import { CheckInStats } from "./CheckInStats";
import { useGuests } from "@/hooks/useGuests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CheckInManagerProps {
  eventId: string;
}

export function CheckInManager({ eventId }: CheckInManagerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { guests, checkInGuest } = useGuests(eventId);

  const handleQRCodeScan = async (qrCode: string) => {
    setIsProcessing(true);
    
    try {
      // Find guest by QR code
      const guest = guests.find(g => g.qr_code === qrCode);
      
      if (!guest) {
        throw new Error("QR Code inválido ou convidado não encontrado.");
      }

      if (guest.checked_in_at) {
        throw new Error(`${guest.name} já fez check-in anteriormente.`);
      }

      // Perform check-in
      await supabase
        .from("guests")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("id", guest.id);

      toast({
        title: "Check-in realizado!",
        description: `Presença confirmada para ${guest.name}.`,
      });

      // Reload to update the list
      window.location.reload();
    } catch (error: any) {
      throw new Error(error.message || "Erro ao processar check-in");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCheckIn = (guestId: string) => {
    checkInGuest(guestId);
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-6">
      <CheckInStats guests={guests} />

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">Scanner QR Code</TabsTrigger>
          <TabsTrigger value="list">Lista de Convidados</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <QRCodeScanner onScan={handleQRCodeScan} isProcessing={isProcessing} />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <CheckInList guests={guests} onManualCheckIn={handleManualCheckIn} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
