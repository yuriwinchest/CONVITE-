import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardStats from "@/components/DashboardStats";
import EventsList from "@/components/EventsList";
import Pricing from "@/components/Pricing";
import { Skeleton } from "@/components/ui/skeleton";
import { UserProfilePanel } from "@/components/UserProfilePanel";
import PlanUpgradeCard from "@/components/PlanUpgradeCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Ativar atualizações em tempo real
  useRealtimeUpdates();

  // Buscar eventos com plano Essencial para mostrar opção de upgrade
  const { data: essentialEvents } = useQuery({
    queryKey: ["essential-events", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, name")
        .eq("user_id", user.id);
      
      if (eventsError) throw eventsError;
      if (!events || events.length === 0) return [];
      
      const { data: purchases, error: purchasesError } = await supabase
        .from("event_purchases")
        .select("event_id, plan, payment_status")
        .in("event_id", events.map(e => e.id))
        .eq("payment_status", "paid");
      
      if (purchasesError) throw purchasesError;
      
      // Filtrar apenas eventos com plano Essencial
      const essentialEventIds = purchases
        ?.filter(p => p.plan === "ESSENTIAL")
        .map(p => p.event_id) || [];
      
      return events.filter(e => essentialEventIds.includes(e.id));
    },
    enabled: !!user?.id,
  });

  // Query para detectar upgrades pendentes
  const { data: pendingUpgrades } = useQuery({
    queryKey: ["pending-upgrades", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("event_purchases")
        .select(`
          id,
          plan,
          amount,
          event_id,
          events(name)
        `)
        .eq("user_id", user.id)
        .eq("payment_status", "pending")
        .eq("plan", "PREMIUM");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Painel de Controle
          </h1>
          <p className="text-muted-foreground text-lg">
            Gerencie seus eventos com elegância e praticidade
          </p>
        </div>

        {/* Alerta de upgrades pendentes */}
        {pendingUpgrades && pendingUpgrades.length > 0 && (
          <Alert className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 shadow-sm">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-400">
              Upgrade Pendente
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              Você tem {pendingUpgrades.length} upgrade(s) aguardando confirmação de pagamento. 
              Assim que o pagamento for processado, seus recursos Premium serão ativados automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats and Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <DashboardStats />
          </div>
          <div>
            <UserProfilePanel />
          </div>
        </div>

        {/* Separator */}
        {essentialEvents && essentialEvents.length > 0 && (
          <div className="border-t border-border/40 my-10" />
        )}

        {/* Events Available for Upgrade */}
        {essentialEvents && essentialEvents.length > 0 && (
          <div className="mb-10 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Eventos disponíveis para Upgrade
              </h2>
              <p className="text-muted-foreground">
                Desbloqueie recursos Premium para seus eventos
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {essentialEvents.map((event) => (
                <PlanUpgradeCard 
                  key={event.id}
                  eventId={event.id}
                  currentPlan="ESSENTIAL"
                />
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-border/40 my-10" />
        
        {/* Events List */}
        <EventsList />

        {/* Separator */}
        <div className="border-t border-border/40 my-10" />
      </main>
      
      {/* Pricing Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Conheça nossos planos
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Escolha o plano ideal para seus eventos e comece a organizar com eficiência
            </p>
          </div>
          <Pricing />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
