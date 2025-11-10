import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Guest {
  id: string;
  name: string;
  table_number: number | null;
}

interface Table {
  id: string;
  table_number: number;
  capacity: number;
}

interface GuestPoolListProps {
  guests: Guest[];
  tables: Table[];
  onAssignGuest: (guestId: string, tableNumber: number) => void;
  getTableOccupancy: (tableNumber: number) => { occupied: number; capacity: number; available: number };
}

export function GuestPoolList({
  guests,
  tables,
  onAssignGuest,
  getTableOccupancy,
}: GuestPoolListProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");

  const unassignedGuests = guests.filter(g => g.table_number === null);

  const handleAssignClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setSelectedTable("");
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = () => {
    if (!selectedGuest || !selectedTable) return;

    const tableNum = parseInt(selectedTable);
    onAssignGuest(selectedGuest.id, tableNum);
    setAssignDialogOpen(false);
    setSelectedGuest(null);
    setSelectedTable("");
  };

  if (unassignedGuests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidados Sem Mesa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Todos os convidados foram alocados em mesas! 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Convidados Sem Mesa
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {unassignedGuests.length} convidado(s)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {unassignedGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{guest.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAssignClick(guest)}
                >
                  Atribuir à Mesa
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Convidado à Mesa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Convidado</Label>
              <p className="text-sm font-medium mt-1">{selectedGuest?.name}</p>
            </div>

            <div>
              <Label htmlFor="tableSelect">Selecionar Mesa</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger id="tableSelect">
                  <SelectValue placeholder="Escolha uma mesa" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => {
                    const occupancy = getTableOccupancy(table.table_number);
                    const isFull = occupancy.available <= 0;
                    
                    return (
                      <SelectItem
                        key={table.id}
                        value={table.table_number.toString()}
                        disabled={isFull}
                      >
                        Mesa {table.table_number} ({occupancy.occupied}/{occupancy.capacity})
                        {isFull ? " - Cheia" : ` - ${occupancy.available} disponíveis`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAssignSubmit}
                disabled={!selectedTable}
              >
                Atribuir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
