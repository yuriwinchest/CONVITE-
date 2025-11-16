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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-8 py-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {reason === "event_limit" ? "Limite de Eventos Atingido" : "Limite de Convidados Atingido"}
            </DialogTitle>
          </DialogHeader>

          <Alert className="mt-4 border-2 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 rounded-md p-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-base text-foreground font-semibold ml-2 whitespace-pre-line">
              {message}
            </AlertDescription>
          </Alert>
        </div>

        {/* Content Section */}
        <div className="px-8 py-6 space-y-6">
          <p className="text-center text-muted-foreground text-sm">
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
