import { Calendar, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEvents } from "@/hooks/useEvents";
import { useSubscription } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateEventDialog from "@/components/CreateEventDialog";
import EditEventDialog from "@/components/EditEventDialog";
import PlanUpgradeModal from "@/components/PlanUpgradeModal";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EventsList = () => {
  const { data: events, isLoading } = useEvents();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Tables<"events"> | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const navigate = useNavigate();
  const { canCreateEvent } = useSubscription();

  // Buscar planos dos eventos
  const { data: eventPurchases } = useQuery({
    queryKey: ["events-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_purchases")
        .select("event_id, plan")
        .eq("payment_status", "paid");
      
      if (error) throw error;
      return data;
    },
  });

  const handleCreateEvent = async () => {
    const { allowed, message } = await canCreateEvent();
    
    if (!allowed) {
      setUpgradeMessage(message || "Você atingiu o limite de eventos do seu plano.");
      setShowUpgradeModal(true);
      return;
    }
    
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasEvents = events && events.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Seus Eventos</h2>
        {hasEvents && (
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleCreateEvent}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Evento
          </Button>
        )}
      </div>

      {!hasEvents ? (
        <Card className="border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum evento ainda
            </h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Crie seu primeiro evento e comece a organizar com sofisticação
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleCreateEvent}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventPlan = eventPurchases?.find(p => p.event_id === event.id);
            
            return (
              <Card 
                key={event.id} 
                className="border-border/40 hover:shadow-lg transition-shadow relative group"
              >
                {eventPlan && (
                  <Badge 
                    className="absolute top-2 right-2 z-10"
                    variant={eventPlan.plan === "PREMIUM" ? "default" : "secondary"}
                  >
                    {eventPlan.plan === "PREMIUM" ? "Premium" : "Essencial"}
                  </Badge>
                )}
                <CardContent className="p-6 cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {event.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Data: {new Date(event.date).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {event.location && (
                    <p className="text-sm text-muted-foreground">Local: {event.location}</p>
                  )}
                </CardContent>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  aria-label="Editar evento"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <CreateEventDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />

      <EditEventDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        event={selectedEvent}
      />
      
      <PlanUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason="event_limit"
        message={upgradeMessage}
      />
    </div>
  );
};

export default EventsList;
