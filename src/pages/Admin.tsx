import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import DashboardHeader from "@/components/DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStats } from "@/components/admin/AdminStats";
import { SubscriptionsManager } from "@/components/admin/SubscriptionsManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { EventsOverview } from "@/components/admin/EventsOverview";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-6 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Painel de Controle
            </Button>
          </div>

          <div className="mb-8 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Painel de Administração
              </h1>
              <p className="text-muted-foreground">
                Gerencie usuários, assinaturas e analytics da plataforma
              </p>
            </div>
          </div>

          <div className="mb-8">
            <AdminStats />
          </div>

          <Tabs defaultValue="subscriptions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="space-y-4">
              <SubscriptionsManager />
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <UsersManager />
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <EventsOverview />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedAdminRoute>
  );
};

export default Admin;
