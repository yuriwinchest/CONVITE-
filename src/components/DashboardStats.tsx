import { Card } from "@/components/ui/card";
import { Calendar, Users, Grid3x3 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardStats = () => {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Eventos Ativos",
      value: stats?.activeEvents || 0,
      subtitle: "Este mês",
      icon: Calendar,
      color: "text-primary",
    },
    {
      title: "Total de Convidados",
      value: stats?.totalGuests || 0,
      subtitle: "Todos os eventos",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Mesas Organizadas",
      value: stats?.totalCapacity || 0,
      subtitle: "Capacidade total",
      icon: Grid3x3,
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">{stat.title}</p>
                <p className="text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg bg-primary/10 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
