import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Guest } from "@/hooks/useGuests";

interface EventStatsReportProps {
  eventDate: string;
  eventName: string;
  guests: Guest[];
}

const EventStatsReport = ({ eventDate, eventName, guests }: EventStatsReportProps) => {
  // Calcular estatísticas
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter(g => g.confirmed).length;
  const checkedInGuests = guests.filter(g => g.checked_in_at).length;
  
  const confirmationRate = totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0;
  const attendanceRate = totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0;
  const attendanceOfConfirmed = confirmedGuests > 0 ? (checkedInGuests / confirmedGuests) * 100 : 0;

  const stats = [
    {
      title: "Total de Convidados",
      value: totalGuests,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Confirmações",
      value: confirmedGuests,
      percentage: confirmationRate,
      icon: UserCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Presentes (Check-in)",
      value: checkedInGuests,
      percentage: attendanceRate,
      icon: CheckCircle,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Taxa de Comparecimento",
      subtitle: "(dos confirmados)",
      value: `${attendanceOfConfirmed.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Relatório do Evento
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Estatísticas finais de {eventName}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-1">
              Realizado em {format(new Date(eventDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <Badge variant="secondary" className="opacity-70">
            ✓ Concluído
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`${stat.bgColor} border-none shadow-sm`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-background/50`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      {stat.title}
                      {stat.subtitle && (
                        <span className="block text-xs">{stat.subtitle}</span>
                      )}
                    </p>
                    <div className="flex items-end gap-2">
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      {stat.percentage !== undefined && (
                        <p className="text-sm text-muted-foreground mb-1">
                          ({stat.percentage.toFixed(1)}%)
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Insights */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Análise do Evento
          </h4>
          
          <div className="grid gap-3">
            {attendanceRate >= 80 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Excelente Presença!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {attendanceRate.toFixed(0)}% dos convidados compareceram ao evento.
                  </p>
                </div>
              </div>
            )}

            {attendanceRate < 50 && totalGuests > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">Presença Abaixo do Esperado</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Apenas {attendanceRate.toFixed(0)}% dos convidados compareceram. 
                    Considere enviar lembretes com mais antecedência nos próximos eventos.
                  </p>
                </div>
              </div>
            )}

            {confirmedGuests > 0 && attendanceOfConfirmed < 70 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Oportunidade de Melhoria</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {((confirmedGuests - checkedInGuests) / confirmedGuests * 100).toFixed(0)}% dos confirmados não compareceram. 
                    Enviar lembretes no dia do evento pode aumentar o comparecimento.
                  </p>
                </div>
              </div>
            )}

            {confirmationRate >= 90 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Ótima Taxa de Confirmação!</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {confirmationRate.toFixed(0)}% dos convidados confirmaram presença.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="pt-4 border-t">
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Resumo:</span> De {totalGuests} convidados, 
              {confirmedGuests > 0 && ` ${confirmedGuests} confirmaram (${confirmationRate.toFixed(0)}%)`}
              {checkedInGuests > 0 && ` e ${checkedInGuests} compareceram (${attendanceRate.toFixed(0)}% do total)`}.
              {confirmedGuests > 0 && checkedInGuests > 0 && 
                ` Isso representa ${attendanceOfConfirmed.toFixed(0)}% de comparecimento dos confirmados.`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventStatsReport;
