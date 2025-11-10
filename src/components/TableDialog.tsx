import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSingle: (tableNumber: number, capacity: number) => void;
  onCreateMultiple: (tables: { table_number: number; capacity: number }[]) => void;
  existingTableNumbers: number[];
}

export function TableDialog({
  open,
  onOpenChange,
  onCreateSingle,
  onCreateMultiple,
  existingTableNumbers,
}: TableDialogProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [batchCount, setBatchCount] = useState("10");
  const [batchCapacity, setBatchCapacity] = useState("8");
  const [batchStartNumber, setBatchStartNumber] = useState("1");

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(tableNumber);
    const cap = parseInt(capacity);

    if (isNaN(num) || num < 1) {
      return;
    }

    if (existingTableNumbers.includes(num)) {
      alert(`Mesa ${num} já existe!`);
      return;
    }

    if (isNaN(cap) || cap < 2 || cap > 20) {
      alert("Capacidade deve estar entre 2 e 20 pessoas.");
      return;
    }

    onCreateSingle(num, cap);
    setTableNumber("");
    setCapacity("8");
    onOpenChange(false);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(batchCount);
    const cap = parseInt(batchCapacity);
    const start = parseInt(batchStartNumber);

    if (isNaN(count) || count < 1 || count > 50) {
      alert("Quantidade deve estar entre 1 e 50.");
      return;
    }

    if (isNaN(cap) || cap < 2 || cap > 20) {
      alert("Capacidade deve estar entre 2 e 20 pessoas.");
      return;
    }

    if (isNaN(start) || start < 1) {
      alert("Número inicial inválido.");
      return;
    }

    const tables = [];
    for (let i = 0; i < count; i++) {
      const num = start + i;
      if (existingTableNumbers.includes(num)) {
        alert(`Mesa ${num} já existe! Operação cancelada.`);
        return;
      }
      tables.push({ table_number: num, capacity: cap });
    }

    onCreateMultiple(tables);
    setBatchCount("10");
    setBatchCapacity("8");
    setBatchStartNumber("1");
    onOpenChange(false);
  };

  const getNextAvailableNumber = () => {
    if (existingTableNumbers.length === 0) return 1;
    return Math.max(...existingTableNumbers) + 1;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Mesas</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="single">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Mesa Individual</TabsTrigger>
            <TabsTrigger value="batch">Criar em Lote</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tableNumber">Número da Mesa</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  min="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder={`Próximo disponível: ${getNextAvailableNumber()}`}
                  required
                />
              </div>

              <div>
                <Label htmlFor="capacity">Capacidade (pessoas)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="2"
                  max="20"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Mesa</Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="batch">
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <Label htmlFor="batchStartNumber">Começar do Número</Label>
                <Input
                  id="batchStartNumber"
                  type="number"
                  min="1"
                  value={batchStartNumber}
                  onChange={(e) => setBatchStartNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="batchCount">Quantidade de Mesas</Label>
                <Input
                  id="batchCount"
                  type="number"
                  min="1"
                  max="50"
                  value={batchCount}
                  onChange={(e) => setBatchCount(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="batchCapacity">Capacidade Padrão (pessoas)</Label>
                <Input
                  id="batchCapacity"
                  type="number"
                  min="2"
                  max="20"
                  value={batchCapacity}
                  onChange={(e) => setBatchCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  Criar mesas {batchStartNumber} até {parseInt(batchStartNumber) + parseInt(batchCount) - 1},
                  cada uma com {batchCapacity} lugares
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar {batchCount} Mesas</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
