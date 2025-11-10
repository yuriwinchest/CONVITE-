import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const guestSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  table_number: z.number().int().positive("Número da mesa deve ser positivo").optional().or(z.literal(0).transform(() => undefined)),
});

type GuestFormData = z.infer<typeof guestSchema>;

interface GuestFormProps {
  onSubmit: (data: GuestFormData) => void;
  onCancel?: () => void;
  defaultValues?: Partial<GuestFormData>;
  isLoading?: boolean;
}

export function GuestForm({ onSubmit, onCancel, defaultValues, isLoading }: GuestFormProps) {
  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      table_number: defaultValues?.table_number || undefined,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do convidado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="table_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número da Mesa (opcional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Ex: 1, 2, 3..." 
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : parseInt(value));
                  }}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
