import { useState } from "react";
import { CheckCircle2, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Guest } from "@/hooks/useGuests";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CheckedInGuestsListProps {
  guests: Guest[];
}

export function CheckedInGuestsList({ guests }: CheckedInGuestsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const checkedInGuests = guests
    .filter((guest) => guest.checked_in_at !== null)
    .sort((a, b) => {
      if (!a.checked_in_at || !b.checked_in_at) return 0;
      return new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime();
    });

  console.log(`📊 Total de convidados: ${guests.length}`);
  console.log(`✅ Check-ins realizados: ${checkedInGuests.length}`);

  const filteredGuests = checkedInGuests.filter((guest) =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGuests = guests.length;
  const checkedInCount = checkedInGuests.length;
  const percentage = totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Check-ins Realizados
          </CardTitle>
          <Badge variant="secondary" className="text-base">
            {checkedInCount} de {totalGuests} ({percentage}%)
          </Badge>
        </div>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar convidado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredGuests.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {searchTerm
                ? "Nenhum convidado encontrado"
                : checkedInCount === 0
                ? "Nenhum check-in realizado ainda"
                : "Comece escaneando QR Codes"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <p className="font-medium">{guest.name}</p>
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Presente
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {guest.table_number && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Mesa {guest.table_number}
                      </span>
                    )}
                    {guest.checked_in_at && (
                      <span>
                        {format(
                          new Date(guest.checked_in_at),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
