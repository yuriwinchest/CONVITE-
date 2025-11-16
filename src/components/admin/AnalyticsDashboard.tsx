import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export const AnalyticsDashboard = () => {
  const { data: analytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-analytics");
      if (error) throw error;
      return data;
    },
  });

  // Buscar dados de usuários para conversão
  const { data: conversionData } = useQuery({
    queryKey: ["admin-conversion"],
    queryFn: async () => {
      const { data: users, error } = await supabase.functions.invoke("admin-get-all-users");
      if (error) throw error;
      return users.users;
    },
  });

  // Buscar dados do funil de conversão
  const { data: funnelData } = useQuery({
    queryKey: ["admin-funnel"],
    queryFn: async () => {
      // Total de usuários
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Usuários com pelo menos 1 evento
      const { data: usersWithEvents } = await supabase
        .from("events")
        .select("user_id");
      
      const uniqueUsersWithEvents = new Set(usersWithEvents?.map(e => e.user_id)).size;

      // Usuários com pelo menos 1 convidado
      const { data: eventsWithGuests } = await supabase
        .from("events")
        .select("user_id, guests!inner(id)");
      
      const uniqueUsersWithGuests = new Set(
        eventsWithGuests?.filter(e => e.guests && e.guests.length > 0).map(e => e.user_id)
      ).size;

      // Usuários que fizeram upgrade
      const { data: paidUsers } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan")
        .neq("plan", "FREE");

      const { data: eventPurchases } = await supabase
        .from("event_purchases")
        .select("user_id")
        .eq("payment_status", "paid");

      const allPaidUserIds = new Set([
        ...(paidUsers?.map(u => u.user_id) || []),
        ...(eventPurchases?.map(u => u.user_id) || [])
      ]);

      return {
        totalUsers: totalUsers || 0,
        usersWithEvents: uniqueUsersWithEvents,
        usersWithGuests: uniqueUsersWithGuests,
        usersWithUpgrade: allPaidUserIds.size,
      };
    },
  });

  // Calcular métricas de conversão
  const conversionMetrics = conversionData ? {
    totalUsers: conversionData.length,
    freeUsers: conversionData.filter((u: any) => u.plan === "FREE").length,
    paidUsers: conversionData.filter((u: any) => u.plan !== "FREE").length,
    conversionRate: conversionData.length > 0 
      ? ((conversionData.filter((u: any) => u.plan !== "FREE").length / conversionData.length) * 100).toFixed(1)
      : "0.0",
  } : { totalUsers: 0, freeUsers: 0, paidUsers: 0, conversionRate: "0.0" };

  const planData = analytics?.planDistribution
    ? Object.entries(analytics.planDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const conversionChartData = [
    { name: "Gratuitos", usuarios: conversionMetrics.freeUsers, fill: "#94a3b8" },
    { name: "Pagantes", usuarios: conversionMetrics.paidUsers, fill: "#10b981" },
  ];

  // Dados do funil
  const funnelSteps = funnelData ? [
    {
      name: "Cadastro",
      value: funnelData.totalUsers,
      percentage: 100,
      color: "#3b82f6",
    },
    {
      name: "Primeiro Evento",
      value: funnelData.usersWithEvents,
      percentage: funnelData.totalUsers > 0 
        ? ((funnelData.usersWithEvents / funnelData.totalUsers) * 100).toFixed(1)
        : 0,
      color: "#8b5cf6",
    },
    {
      name: "Primeiro Convidado",
      value: funnelData.usersWithGuests,
      percentage: funnelData.totalUsers > 0 
        ? ((funnelData.usersWithGuests / funnelData.totalUsers) * 100).toFixed(1)
        : 0,
      color: "#ec4899",
    },
    {
      name: "Upgrade",
      value: funnelData.usersWithUpgrade,
      percentage: funnelData.totalUsers > 0 
        ? ((funnelData.usersWithUpgrade / funnelData.totalUsers) * 100).toFixed(1)
        : 0,
      color: "#10b981",
    },
  ] : [];

  return (
    <div className="grid gap-4">
      {/* Funil de Conversão */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Funil de Conversão - Jornada do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Funil Visual */}
            <div className="relative">
              {funnelSteps.map((step, index) => {
                const width = `${step.percentage}%`;
                const dropoff = index > 0 
                  ? funnelSteps[index - 1].value - step.value 
                  : 0;
                const dropoffPercentage = index > 0 
                  ? (((funnelSteps[index - 1].value - step.value) / funnelSteps[index - 1].value) * 100).toFixed(1)
                  : 0;

                return (
                  <div key={step.name} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: step.color }}
                        />
                        <span className="font-semibold">{step.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{step.value}</span>
                        <Badge variant="secondary">{step.percentage}%</Badge>
                      </div>
                    </div>
                    
                    <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 flex items-center justify-center text-white font-semibold"
                        style={{ 
                          width,
                          backgroundColor: step.color,
                        }}
                      >
                        {step.value > 0 && step.value}
                      </div>
                    </div>

                    {index > 0 && dropoff > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span>
                          Perda de {dropoff} usuário{dropoff > 1 ? 's' : ''} ({dropoffPercentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Insights do Funil */}
            <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Taxa de Ativação</p>
                <p className="text-2xl font-bold">
                  {funnelData?.totalUsers > 0
                    ? ((funnelData.usersWithEvents / funnelData.totalUsers) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Cadastro → Evento</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Taxa de Engajamento</p>
                <p className="text-2xl font-bold">
                  {funnelData?.usersWithEvents > 0
                    ? ((funnelData.usersWithGuests / funnelData.usersWithEvents) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Evento → Convidado</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Taxa de Monetização</p>
                <p className="text-2xl font-bold text-green-600">
                  {funnelData?.usersWithGuests > 0
                    ? ((funnelData.usersWithUpgrade / funnelData.usersWithGuests) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Convidado → Upgrade</p>
              </div>
            </div>

            {/* Recomendações */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                💡 Recomendações para Otimizar o Funil
              </h4>
              <ul className="text-sm space-y-2">
                {funnelData && (
                  <>
                    {funnelData.usersWithEvents / funnelData.totalUsers < 0.5 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          <strong>Ativação baixa:</strong> {((1 - (funnelData.usersWithEvents / funnelData.totalUsers)) * 100).toFixed(0)}% dos usuários não criaram eventos. 
                          Considere melhorar o onboarding e adicionar tutoriais.
                        </span>
                      </li>
                    )}
                    {funnelData.usersWithGuests / funnelData.usersWithEvents < 0.7 && funnelData.usersWithEvents > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          <strong>Engajamento médio:</strong> Envie lembretes para adicionar convidados após criar evento.
                        </span>
                      </li>
                    )}
                    {funnelData.usersWithUpgrade / funnelData.usersWithGuests < 0.1 && funnelData.usersWithGuests > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          <strong>Monetização baixa:</strong> Destaque os benefícios dos planos pagos quando usuários atingirem limites.
                        </span>
                      </li>
                    )}
                    {funnelData.usersWithUpgrade / funnelData.totalUsers >= 0.1 && (
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>
                          <strong>Ótimo desempenho!</strong> Continue focando em manter a qualidade do produto.
                        </span>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Taxa de Conversão (Gratuito → Pagante)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Métricas Principais */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-primary">{conversionMetrics.conversionRate}%</p>
                  {parseFloat(conversionMetrics.conversionRate) >= 10 ? (
                    <Badge className="bg-green-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Ótima
                    </Badge>
                  ) : parseFloat(conversionMetrics.conversionRate) >= 5 ? (
                    <Badge className="bg-yellow-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Boa
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Baixa
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  </div>
                  <p className="text-2xl font-bold">{conversionMetrics.totalUsers}</p>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                    <p className="text-sm text-muted-foreground">Usuários Gratuitos</p>
                  </div>
                  <p className="text-lg font-semibold">{conversionMetrics.freeUsers}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <p className="text-sm text-muted-foreground">Usuários Pagantes</p>
                  </div>
                  <p className="text-lg font-semibold text-green-600">{conversionMetrics.paidUsers}</p>
                </div>
              </div>
            </div>

            {/* Gráfico de Conversão */}
            <div className="md:col-span-2">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={conversionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usuarios" radius={[8, 8, 0, 0]}>
                    {conversionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">💡 Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • {conversionMetrics.paidUsers > 0 
                      ? `${conversionMetrics.paidUsers} usuário${conversionMetrics.paidUsers > 1 ? 's' : ''} já converteu${conversionMetrics.paidUsers > 1 ? 'ram' : ''} para planos pagos`
                      : 'Nenhum usuário converteu ainda para planos pagos'}
                  </li>
                  <li>
                    • {parseFloat(conversionMetrics.conversionRate) >= 10 
                      ? 'Excelente taxa de conversão! Continue assim.'
                      : parseFloat(conversionMetrics.conversionRate) >= 5
                      ? 'Taxa de conversão está boa, mas pode melhorar com mais recursos.'
                      : 'Considere adicionar mais valor ao produto para aumentar conversões.'}
                  </li>
                  <li>
                    • Potencial de receita com {conversionMetrics.freeUsers} usuários gratuitos
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards existentes de distribuição e receita */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            R$ {analytics?.monthlyRevenue?.toFixed(2) || "0.00"}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Receita de compras de eventos pagas no mês atual
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
