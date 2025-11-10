import { Users, Armchair, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TableStatsCardProps {
  totalTables: number;
  totalCapacity: number;
  occupiedSeats: number;
  availableSeats: number;
  unassignedGuests: number;
}

export function TableStatsCard({
  totalTables,
  totalCapacity,
  occupiedSeats,
  availableSeats,
  unassignedGuests,
}: TableStatsCardProps) {
  const occupancyPercentage = totalCapacity > 0
    ? Math.round((occupiedSeats / totalCapacity) * 100)
    : 0;

  const stats = [
    {
      label: "Total de Mesas",
      value: totalTables,
      icon: Armchair,
      color: "text-blue-500",
    },
    {
      label: "Lugares Totais",
      value: totalCapacity,
      icon: Users,
      color: "text-purple-500",
    },
    {
      label: "Lugares Ocupados",
      value: occupiedSeats,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      label: "Lugares Disponíveis",
      value: availableSeats,
      icon: Users,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {unassignedGuests > 0 && (
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Atenção: Convidados Sem Mesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 dark:text-orange-300">
              {unassignedGuests} convidado(s) ainda não foram alocados em mesas.
              {availableSeats < unassignedGuests && (
                <span className="block mt-2 font-semibold">
                  ⚠️ Não há lugares suficientes! Faltam {unassignedGuests - availableSeats} lugares.
                  Crie mais mesas ou aumente a capacidade das existentes.
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ocupação Geral</span>
              <span className="font-semibold">{occupancyPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  occupancyPercentage >= 90
                    ? "bg-red-500"
                    : occupancyPercentage >= 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
