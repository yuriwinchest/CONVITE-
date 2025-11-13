import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Pricing from "./Pricing";

interface PlanUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "event_limit" | "guest_limit";
  message: string;
  eventId?: string;
}

const PlanUpgradeModal = ({
  open,
  onOpenChange,
  reason,
  message,
  eventId,
}: PlanUpgradeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reason === "event_limit" ? "Limite de Eventos Atingido" : "Limite de Convidados Atingido"}
          </DialogTitle>
        </DialogHeader>

        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            {reason === "event_limit" 
              ? "Escolha um plano que atende às suas necessidades e continue criando eventos incríveis!"
              : "Escolha um plano adequado para adicionar mais convidados ao seu evento!"}
          </p>

          <Pricing eventId={eventId} embedded />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanUpgradeModal;
