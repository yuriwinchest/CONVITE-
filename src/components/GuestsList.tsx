import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Guest } from "@/hooks/useGuests";
import { GuestForm } from "./GuestForm";

interface GuestsListProps {
  guests: Guest[];
  onEdit: (guestId: string, data: { name: string; email?: string }) => void;
  onDelete: (guestId: string) => void;
}

export function GuestsList({ guests, onEdit, onDelete }: GuestsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const handleDeleteClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedGuest) {
      onDelete(selectedGuest.id);
      setDeleteDialogOpen(false);
      setSelectedGuest(null);
    }
  };

  const handleEditSubmit = (data: { name: string; email?: string }) => {
    if (selectedGuest) {
      onEdit(selectedGuest.id, data);
      setEditDialogOpen(false);
      setSelectedGuest(null);
    }
  };

  if (guests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum convidado adicionado ainda
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>{guest.email || "-"}</TableCell>
                <TableCell>
                  {guest.confirmed ? (
                    <Badge variant="default">Confirmado</Badge>
                  ) : (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(guest)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(guest)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selectedGuest?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Convidado</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <GuestForm
              onSubmit={handleEditSubmit}
              onCancel={() => setEditDialogOpen(false)}
              defaultValues={{
                name: selectedGuest.name,
                email: selectedGuest.email || "",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
