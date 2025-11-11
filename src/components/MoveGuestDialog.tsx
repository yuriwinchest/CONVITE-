import { useState } from "react";
import { ArrowRightLeft, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

interface MoveGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: Guest | null;
  currentTableNumber: number;
  availableTables: Table[];
  guests: Guest[];
  onMove: (guestId: string, newTableNumber: number) => void;
}

export function MoveGuestDialog({
  open,
  onOpenChange,
  guest,
  currentTableNumber,
  availableTables,
  guests,
  onMove,
}: MoveGuestDialogProps) {
  const [selectedTable, setSelectedTable] = useState<string>("");

  const getTableOccupancy = (tableNumber: number) => {
    const occupiedSeats = guests.filter(g => g.table_number === tableNumber).length;
    const table = availableTables.find(t => t.table_number === tableNumber);
    return {
      occupied: occupiedSeats,
      capacity: table?.capacity || 0,
      available: (table?.capacity || 0) - occupiedSeats,
      isFull: occupiedSeats >= (table?.capacity || 0),
    };
  };

  const handleMove = () => {
    if (guest && selectedTable) {
      onMove(guest.id, parseInt(selectedTable));
      setSelectedTable("");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedTable("");
    onOpenChange(false);
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Mover Convidado
          </DialogTitle>
          <DialogDescription>
            Selecione a nova mesa para {guest.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Mesa atual:</span>
            <Badge variant="secondary">Mesa {currentTableNumber}</Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nova mesa:</label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma mesa" />
              </SelectTrigger>
              <SelectContent>
                {availableTables
                  .filter(table => table.table_number !== currentTableNumber)
                  .sort((a, b) => a.table_number - b.table_number)
                  .map((table) => {
                    const occupancy = getTableOccupancy(table.table_number);
                    return (
                      <SelectItem
                        key={table.id}
                        value={table.table_number.toString()}
                        disabled={occupancy.isFull}
                      >
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>Mesa {table.table_number}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <Users className="h-3 w-3" />
                            <span className={occupancy.isFull ? "text-red-500" : "text-muted-foreground"}>
                              {occupancy.occupied}/{occupancy.capacity}
                            </span>
                            {occupancy.isFull && (
                              <Badge variant="destructive" className="text-xs">
                                CHEIA
                              </Badge>
                            )}
                            {!occupancy.isFull && occupancy.available <= 2 && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                {occupancy.available} vaga{occupancy.available > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {selectedTable && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                {guest.name} será movido da Mesa {currentTableNumber} para a Mesa {selectedTable}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleMove} disabled={!selectedTable}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Mover Convidado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
