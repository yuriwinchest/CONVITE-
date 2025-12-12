import { useState } from "react";
import { Pencil, Trash2, Mail, Send, QrCode, Search, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { Input } from "@/components/ui/input";
import { Guest } from "@/hooks/useGuests";
import { GuestForm } from "./GuestForm";
import { GuestQRCodeDialog } from "./GuestQRCodeDialog";

interface GuestsListProps {
  guests: Guest[];
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  onEdit: (guestId: string, data: { name: string; email?: string; whatsapp?: string; table_number?: number }) => void;
  onDelete: (guestId: string) => void;
  onDeleteMultiple: (guestIds: string[]) => void;
  onSendInvite: (guestId: string) => void;
  onSendMultipleInvites: (guestIds: string[]) => void;
  onSendReminder: (guestId: string) => void;
  onSendWhatsAppReminder: (guestId: string) => void;
  onSendMultipleReminders: (guestIds: string[]) => void;
  onSendMultipleWhatsAppReminders: (guestIds: string[]) => void;
}

export function GuestsList({ guests, eventId, eventName, eventDate, eventLocation, onEdit, onDelete, onDeleteMultiple, onSendInvite, onSendMultipleInvites, onSendReminder, onSendWhatsAppReminder, onSendMultipleReminders, onSendMultipleWhatsAppReminders }: GuestsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending">("all");
  const { t } = useTranslation('guests');

  const handleDeleteClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setEditDialogOpen(true);
  };

  const handleQRCodeClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setQrCodeDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedGuest) {
      onDelete(selectedGuest.id);
      setDeleteDialogOpen(false);
      setSelectedGuest(null);
    }
  };

  const handleEditSubmit = (data: { name: string; email?: string; whatsapp?: string; table_number?: number }) => {
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

  const handleSendReminders = () => {
    onSendMultipleReminders(selectedIds);
    setSelectedIds([]);
  };

  const handleSendWhatsAppReminders = () => {
    onSendMultipleWhatsAppReminders(selectedIds);
    setSelectedIds([]);
  };

  // Filter guests based on search and status
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          guest.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "confirmed" && guest.confirmed) ||
      (statusFilter === "pending" && !guest.confirmed);
    
    return matchesSearch && matchesStatus;
  });

  const confirmedCount = guests.filter(g => g.confirmed).length;
  const pendingCount = guests.length - confirmedCount;

  if (guests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('noGuests')}
      </div>
    );
  }

  const allSelected = filteredGuests.length > 0 && selectedIds.length === filteredGuests.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < filteredGuests.length;

  return (
    <>
      <div className="space-y-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            {t('all')} ({guests.length})
          </Button>
          <Button
            variant={statusFilter === "confirmed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("confirmed")}
          >
            {t('confirmed')} ({confirmedCount})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            {t('pending')} ({pendingCount})
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">
              {selectedIds.length} {selectedIds.length > 1 ? t('guestPlural') : t('guest')} {selectedIds.length > 1 ? t('selectedPlural') : t('selected')}
            </span>
            <Button variant="outline" size="sm" onClick={handleCancelSelection}>
              {t('cancel')}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="default" onClick={handleSendInvites}>
              <Send className="mr-2 h-4 w-4" />
              {t('sendInvites')}
            </Button>
            <Button variant="secondary" onClick={handleSendReminders}>
              <Mail className="mr-2 h-4 w-4" />
              {t('emailReminders')}
            </Button>
            <Button variant="secondary" onClick={handleSendWhatsAppReminders}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {t('whatsappReminders')}
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('delete')}
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
                  aria-label={t('all')}
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.email')}</TableHead>
              <TableHead>{t('table.whatsapp')}</TableHead>
              <TableHead>{t('table.tableNumber')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead className="text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? t('noGuestsFiltered')
                    : t('noGuests')}
                </TableCell>
              </TableRow>
            ) : (
              filteredGuests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(guest.id)}
                    onCheckedChange={(checked) => handleSelectGuest(guest.id, checked as boolean)}
                    aria-label={`${t('all')} ${guest.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{guest.email || "-"}</span>
                    {!guest.email && (
                      <span className="text-xs text-muted-foreground">({t('noEmail')})</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{guest.whatsapp || "-"}</span>
                    {!guest.whatsapp && (
                      <span className="text-xs text-muted-foreground">({t('noWhatsapp')})</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{guest.table_number ? `${t('table.tableNumber')} ${guest.table_number}` : "-"}</TableCell>
                <TableCell>
                  {guest.confirmed ? (
                    <Badge variant="default">{t('statusConfirmed')}</Badge>
                  ) : (
                    <Badge variant="secondary">{t('statusPending')}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQRCodeClick(guest)}
                    title={t('viewQRCode')}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  {guest.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSendReminder(guest.id)}
                      title={t('sendEmailReminder')}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  {guest.whatsapp && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSendWhatsAppReminder(guest.id)}
                      title={t('sendWhatsappReminder')}
                    >
                      <MessageCircle className="h-4 w-4" />
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.confirmDeleteDescription', { name: selectedGuest?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.bulkDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.bulkDeleteDescription', { count: selectedIds.length })}
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
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('deleteAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogs.editGuest')}</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <GuestForm
              onSubmit={handleEditSubmit}
              onCancel={() => setEditDialogOpen(false)}
              defaultValues={{
                name: selectedGuest.name,
                email: selectedGuest.email,
                whatsapp: selectedGuest.whatsapp,
                table_number: selectedGuest.table_number || undefined,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <GuestQRCodeDialog
        guest={selectedGuest}
        eventName={eventName}
        open={qrCodeDialogOpen}
        onOpenChange={setQrCodeDialogOpen}
      />
    </>
  );
}
