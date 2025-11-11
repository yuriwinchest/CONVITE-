import { useState } from "react";
import { Plus, Shuffle, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableDialog } from "./TableDialog";
import { TableCard } from "./TableCard";
import { GuestPoolList } from "./GuestPoolList";
import { TableStatsCard } from "./TableStatsCard";
import { useTables } from "@/hooks/useTables";
import {
  autoDistributeGuests,
  redistributeGuests,
  getTableOccupancy,
  validateTableAssignment,
  getUnassignedGuestsCount,
  suggestAdditionalTables,
} from "@/lib/tableDistribution";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
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

interface TableManagerProps {
  eventId: string;
}

export function TableManager({ eventId }: TableManagerProps) {
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [redistributeDialogOpen, setRedistributeDialogOpen] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const queryClient = useQueryClient();

  const {
    tables,
    guests,
    isLoading,
    stats,
    addTable,
    addMultipleTables,
    updateTable,
    deleteTable,
  } = useTables(eventId);

  const handleCreateSingleTable = (tableNumber: number, capacity: number) => {
    addTable({ eventId, table: { table_number: tableNumber, capacity } });
  };

  const handleCreateMultipleTables = (
    tablesToCreate: { table_number: number; capacity: number }[]
  ) => {
    addMultipleTables({ eventId, tables: tablesToCreate });
  };

  const handleAutoDistribute = async () => {
    setIsDistributing(true);
    try {
      const distributions = autoDistributeGuests(guests, tables);

      if (distributions.length === 0) {
        toast({
          title: "Nenhum convidado para distribuir",
          description: "Todos os convidados já estão alocados em mesas.",
        });
        return;
      }

      // Update guests with their table assignments
      for (const dist of distributions) {
        await supabase
          .from("guests")
          .update({ table_number: dist.tableNumber })
          .eq("id", dist.guestId);
      }

      const unassigned = getUnassignedGuestsCount(guests) - distributions.length;
      
      toast({
        title: "Distribuição concluída!",
        description: `${distributions.length} convidado(s) alocado(s) em mesas.${
          unassigned > 0 ? ` ${unassigned} convidado(s) não puderam ser alocados (sem espaço).` : ""
        }`,
      });

      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });

      // Suggest additional tables if needed
      if (unassigned > 0) {
        const suggested = suggestAdditionalTables(guests, tables);
        if (suggested > 0) {
          toast({
            title: "Sugestão",
            description: `Crie mais ${suggested} mesa(s) de 8 lugares para acomodar todos os convidados.`,
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao distribuir convidados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDistributing(false);
    }
  };

  const handleRedistribute = async () => {
    setIsDistributing(true);
    setRedistributeDialogOpen(false);
    
    try {
      const distributions = redistributeGuests(guests, tables);

      // First, clear all table assignments
      for (const guest of guests) {
        if (guest.table_number !== null) {
          await supabase
            .from("guests")
            .update({ table_number: null })
            .eq("id", guest.id);
        }
      }

      // Then apply new distributions
      for (const dist of distributions) {
        await supabase
          .from("guests")
          .update({ table_number: dist.tableNumber })
          .eq("id", dist.guestId);
      }

      toast({
        title: "Redistribuição concluída!",
        description: `${distributions.length} convidado(s) redistribuído(s).`,
      });

      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
    } catch (error: any) {
      toast({
        title: "Erro ao redistribuir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDistributing(false);
    }
  };

  const handleRemoveGuestFromTable = async (guestId: string) => {
    try {
      await supabase
        .from("guests")
        .update({ table_number: null })
        .eq("id", guestId);

      toast({
        title: "Convidado removido da mesa",
        description: "O convidado foi movido para a lista de não alocados.",
      });

      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
    } catch (error: any) {
      toast({
        title: "Erro ao remover convidado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignGuest = async (guestId: string, tableNumber: number) => {
    const validation = validateTableAssignment(guestId, tableNumber, guests, tables);
    
    if (!validation.valid) {
      toast({
        title: "Não foi possível atribuir",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase
        .from("guests")
        .update({ table_number: tableNumber })
        .eq("id", guestId);

      toast({
        title: "Convidado atribuído!",
        description: `Convidado alocado na Mesa ${tableNumber}.`,
      });

      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
    } catch (error: any) {
      toast({
        title: "Erro ao atribuir convidado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getOccupancy = (tableNumber: number) => {
    return getTableOccupancy(tableNumber, guests, tables);
  };

  const unassignedCount = getUnassignedGuestsCount(guests);

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <TableStatsCard
        totalTables={stats.totalTables}
        totalCapacity={stats.totalCapacity}
        occupiedSeats={stats.occupiedSeats}
        availableSeats={stats.availableSeats}
        unassignedGuests={unassignedCount}
      />

      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">Configurar Mesas</TabsTrigger>
          <TabsTrigger value="distribute">Distribuir</TabsTrigger>
          <TabsTrigger value="organize">Organizar</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mesas do Evento</h3>
            <Button onClick={() => setTableDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Mesa
            </Button>
          </div>

          {tables.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma mesa criada ainda. Comece adicionando mesas para o evento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  guests={guests.filter(g => g.table_number === table.table_number)}
                  onRemoveGuest={handleRemoveGuestFromTable}
                  onDeleteTable={deleteTable}
                  onEditCapacity={(tableId, newCapacity) =>
                    updateTable({ tableId, capacity: newCapacity })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="distribute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Automática</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Distribua convidados automaticamente nas mesas disponíveis respeitando a capacidade de cada uma.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleAutoDistribute}
                  disabled={isDistributing || tables.length === 0 || unassignedCount === 0}
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Distribuir Não Alocados ({unassignedCount})
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setRedistributeDialogOpen(true)}
                  disabled={isDistributing || tables.length === 0 || guests.length === 0}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Redistribuir Todos
                </Button>
              </div>

              {tables.length === 0 && (
                <p className="text-sm text-orange-600">
                  ⚠️ Crie mesas primeiro antes de distribuir convidados.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organize" className="space-y-4">
          <GuestPoolList
            guests={guests}
            tables={tables}
            onAssignGuest={handleAssignGuest}
            getTableOccupancy={getOccupancy}
          />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mapa de Mesas
            </h3>
            {tables.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Crie mesas na aba "Configurar Mesas" para visualizar o mapa.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    guests={guests.filter(g => g.table_number === table.table_number)}
                    onRemoveGuest={handleRemoveGuestFromTable}
                    onDeleteTable={deleteTable}
                    onEditCapacity={(tableId, newCapacity) =>
                      updateTable({ tableId, capacity: newCapacity })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <TableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        onCreateSingle={handleCreateSingleTable}
        onCreateMultiple={handleCreateMultipleTables}
        existingTableNumbers={tables.map(t => t.table_number)}
      />

      <AlertDialog open={redistributeDialogOpen} onOpenChange={setRedistributeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redistribuir Todos os Convidados?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá todas as atribuições atuais de mesas e redistribuirá todos os convidados automaticamente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRedistribute}>
              Confirmar Redistribuição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
