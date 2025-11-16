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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Taxa de Conversão */}
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

      {/* Cards existentes */}
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
  );
};
