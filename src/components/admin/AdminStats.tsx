import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Calendar, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-analytics");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total de Usuários",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Usuários cadastrados",
    },
    {
      title: "Assinaturas Ativas",
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      description: "Pagamentos recorrentes",
    },
    {
      title: "Total de Eventos",
      value: stats?.totalEvents || 0,
      icon: Calendar,
      description: "Eventos criados",
    },
    {
      title: "Total de Convidados",
      value: stats?.totalGuests || 0,
      icon: UserCheck,
      description: "Convites enviados",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
