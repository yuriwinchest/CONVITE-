import { Users, X, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface Guest {
  id: string;
  name: string;
  table_number: number | null;
  checked_in_at?: string | null;
}

interface Table {
  id: string;
  table_number: number;
  capacity: number;
}

interface TableCardProps {
  table: Table;
  guests: Guest[];
  onRemoveGuest: (guestId: string) => void;
  onDeleteTable: (tableId: string) => void;
  onEditCapacity: (tableId: string, newCapacity: number) => void;
}

export function TableCard({
  table,
  guests,
  onRemoveGuest,
  onDeleteTable,
  onEditCapacity,
}: TableCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState(table.capacity.toString());

  const occupied = guests.length;
  const available = table.capacity - occupied;
  const percentage = (occupied / table.capacity) * 100;
  const checkedInCount = guests.filter(g => g.checked_in_at !== null).length;

  let statusColor = "bg-green-500";
  let statusText = "Disponível";
  
  if (occupied === 0) {
    statusColor = "bg-muted";
    statusText = "Vazia";
  } else if (percentage >= 100) {
    statusColor = "bg-red-500";
    statusText = "Cheia";
  } else if (percentage >= 75) {
    statusColor = "bg-yellow-500";
    statusText = "Quase Cheia";
  } else {
    statusColor = "bg-green-500";
    statusText = "Disponível";
  }

  const handleEditCapacity = () => {
    const cap = parseInt(newCapacity);
    if (isNaN(cap) || cap < 2 || cap > 20) {
      alert("Capacidade deve estar entre 2 e 20.");
      return;
    }
    if (cap < occupied) {
      alert(`Não é possível reduzir capacidade abaixo de ${occupied} (convidados já alocados).`);
      return;
    }
    onEditCapacity(table.id, cap);
    setEditingCapacity(false);
  };

  const handleDeleteTable = () => {
    if (guests.length > 0) {
      const confirmed = window.confirm(
        `Mesa ${table.table_number} tem ${guests.length} convidado(s). Eles serão removidos da mesa. Continuar?`
      );
      if (!confirmed) return;
    }
    onDeleteTable(table.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Mesa {table.table_number}</h3>
              <Badge variant="secondary" className={`${statusColor} text-white`}>
                {statusText}
              </Badge>
              {checkedInCount > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {checkedInCount}/{occupied} check-in
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingCapacity(!editingCapacity)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {editingCapacity ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-16 px-2 py-1 border rounded"
                  autoFocus
                />
                <Button size="sm" onClick={handleEditCapacity}>
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingCapacity(false);
                    setNewCapacity(table.capacity.toString());
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <span>
                {occupied}/{table.capacity} lugares ({available} disponíveis)
              </span>
            )}
          </div>

          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${statusColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </CardHeader>

        <CardContent>
          {guests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum convidado nesta mesa
            </p>
          ) : (
            <div className="space-y-2">
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                    guest.checked_in_at 
                      ? 'bg-green-50 hover:bg-green-100 border border-green-200' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {guest.checked_in_at && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <span className={`text-sm ${guest.checked_in_at ? 'text-green-900 font-medium' : ''}`}>
                      {guest.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemoveGuest(guest.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Mesa {table.table_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              {guests.length > 0
                ? `Esta mesa tem ${guests.length} convidado(s). Eles serão removidos da mesa e voltarão para a lista de convidados sem mesa.`
                : "Tem certeza que deseja excluir esta mesa?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable}>
              Excluir Mesa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
