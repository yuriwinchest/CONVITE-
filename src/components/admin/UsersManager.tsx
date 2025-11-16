import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const UsersManager = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-get-all-users");
      if (error) throw error;
      return data.users;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Eventos</TableHead>
            <TableHead>Convidados</TableHead>
            <TableHead>Cadastro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>
                <Badge>{user.plan}</Badge>
              </TableCell>
              <TableCell>{user.events_count}</TableCell>
              <TableCell>{user.guests_count}</TableCell>
              <TableCell>
                {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
