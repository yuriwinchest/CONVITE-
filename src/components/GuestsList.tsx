import { useState } from "react";
import { Pencil, Trash2, Mail, Send } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Guest } from "@/hooks/useGuests";
import { GuestForm } from "./GuestForm";

interface GuestsListProps {
  guests: Guest[];
  eventId: string;
  onEdit: (guestId: string, data: { name: string; table_number?: number }) => void;
  onDelete: (guestId: string) => void;
  onDeleteMultiple: (guestIds: string[]) => void;
  onSendInvite: (guestId: string) => void;
  onSendMultipleInvites: (guestIds: string[]) => void;
}

export function GuestsList({ guests, eventId, onEdit, onDelete, onDeleteMultiple, onSendInvite, onSendMultipleInvites }: GuestsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const handleEditSubmit = (data: { name: string; table_number?: number }) => {
    if (selectedGuest) {
      onEdit(selectedGuest.id, data);
      setEditDialogOpen(false);
      setSelectedGuest(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(guests.map(g => g.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectGuest = (guestId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, guestId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== guestId));
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    onDeleteMultiple(selectedIds);
    setSelectedIds([]);
    setBulkDeleteDialogOpen(false);
  };

  const handleCancelSelection = () => {
    setSelectedIds([]);
  };

  const handleSendInvites = () => {
    onSendMultipleInvites(selectedIds);
    setSelectedIds([]);
  };

  if (guests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum convidado adicionado ainda
      </div>
    );
  }

  const allSelected = guests.length > 0 && selectedIds.length === guests.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < guests.length;

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
          <span className="font-medium">
            {selectedIds.length} convidado{selectedIds.length > 1 ? 's' : ''} selecionado{selectedIds.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelSelection}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleSendInvites}>
              <Send className="mr-2 h-4 w-4" />
              Enviar Convites
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar Selecionados
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mesa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(guest.id)}
                    onCheckedChange={(checked) => handleSelectGuest(guest.id, checked as boolean)}
                    aria-label={`Selecionar ${guest.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{guest.email || "-"}</span>
                    {!guest.email && (
                      <span className="text-xs text-muted-foreground">(sem email)</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{guest.table_number ? `Mesa ${guest.table_number}` : "-"}</TableCell>
                <TableCell>
                  {guest.confirmed ? (
                    <Badge variant="default">Confirmado</Badge>
                  ) : (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {guest.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSendInvite(guest.id)}
                      title="Enviar convite por email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
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

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar múltiplos convidados</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selectedIds.length} convidado{selectedIds.length > 1 ? 's' : ''}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedIds.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-1">
              {guests
                .filter(g => selectedIds.includes(g.id))
                .map(g => (
                  <div key={g.id} className="text-sm">
                    • {g.name}
                  </div>
                ))}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar Todos
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
                table_number: selectedGuest.table_number || undefined,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
