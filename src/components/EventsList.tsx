import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateEventDialog from "@/components/CreateEventDialog";

const EventsList = () => {
  const { data: events, isLoading } = useEvents();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

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
            onClick={() => setIsCreateDialogOpen(true)}
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
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="border-border/40 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {event.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {new Date(event.date).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {event.location && (
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateEventDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
};

export default EventsList;
