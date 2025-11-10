import { UserCheck, UserX, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Guest } from "@/hooks/useGuests";

interface CheckInStatsProps {
  guests: Guest[];
}

export function CheckInStats({ guests }: CheckInStatsProps) {
  const totalGuests = guests.length;
  const checkedInGuests = guests.filter(g => g.checked_in_at !== null).length;
  const pendingGuests = totalGuests - checkedInGuests;
  const checkInRate = totalGuests > 0 ? Math.round((checkedInGuests / totalGuests) * 100) : 0;

  const stats = [
    {
      label: "Total de Convidados",
      value: totalGuests,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Check-in Realizado",
      value: checkedInGuests,
      icon: UserCheck,
      color: "text-green-500",
    },
    {
      label: "Aguardando Check-in",
      value: pendingGuests,
      icon: UserX,
      color: "text-orange-500",
    },
    {
      label: "Taxa de Presença",
      value: `${checkInRate}%`,
      icon: Clock,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
