import { useState } from "react";
import { QrCode, CheckCircle2, Clock, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GuestQRCode } from "./GuestQRCode";
import { Guest } from "@/hooks/useGuests";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CheckInListProps {
  guests: Guest[];
  onManualCheckIn: (guestId: string) => void;
}

export function CheckInList({ guests, onManualCheckIn }: CheckInListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const filteredGuests = guests.filter((guest) =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowQRCode = (guest: Guest) => {
    setSelectedGuest(guest);
    setQrDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Convidados</CardTitle>
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
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? "Nenhum convidado encontrado" : "Nenhum convidado cadastrado"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{guest.name}</p>
                      {guest.checked_in_at ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Check-in Feito
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {guest.table_number && <span>Mesa {guest.table_number}</span>}
                      {guest.checked_in_at && (
                        <span>
                          Check-in: {format(new Date(guest.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {guest.qr_code && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowQRCode(guest)}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Ver QR Code
                      </Button>
                    )}
                    {!guest.checked_in_at && (
                      <Button
                        size="sm"
                        onClick={() => onManualCheckIn(guest.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Check-in Manual
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedGuest && selectedGuest.qr_code && (
        <GuestQRCode
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          guestName={selectedGuest.name}
          qrCode={selectedGuest.qr_code}
        />
      )}
    </>
  );
}
