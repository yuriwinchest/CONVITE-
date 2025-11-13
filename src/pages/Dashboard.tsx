import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardStats from "@/components/DashboardStats";
import EventsList from "@/components/EventsList";
import Pricing from "@/components/Pricing";
import { Skeleton } from "@/components/ui/skeleton";
import { StripeTestPanel } from "@/components/StripeTestPanel";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

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
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Painel de Controle
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus eventos com elegância e praticidade
          </p>
        </div>

        <DashboardStats />
        
        <div className="mb-8">
          <StripeTestPanel />
        </div>
        
        <EventsList />
      </main>
      
      <Pricing />
    </div>
  );
};

export default Dashboard;
