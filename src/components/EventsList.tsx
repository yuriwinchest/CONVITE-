import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";

const EventsList = () => {
  const { data: events, isLoading } = useEvents();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48" />
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
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Evento
          </Button>
        )}
      </div>

      {!hasEvents ? (
        <div className="bg-card rounded-lg p-12 text-center border border-border">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Nenhum evento ainda
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crie seu primeiro evento e comece a organizar com sofisticação
          </p>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Evento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {event.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {new Date(event.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {event.location && (
                <p className="text-sm text-muted-foreground mb-4">
                  📍 {event.location}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
                <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                  Gerenciar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsList;
