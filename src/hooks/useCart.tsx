import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CartItem {
  event_name: string;
  plan: "ESSENTIAL";
  amount: number;
  event_data?: {
    name: string;
    date: string;
    location: string;
    reminder_days_before?: number;
    table_map_url?: string | null;
  };
}

interface ShoppingCart {
  id: string;
  user_id: string;
  items: CartItem[];
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export const useCart = () => {
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ["shopping-cart"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("shopping_cart" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as unknown as ShoppingCart | null;
    },
  });

  const addToCart = useMutation({
    mutationFn: async (item: CartItem) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const currentItems = cart?.items || [];
      const newItems = [...currentItems, item];
      const newTotal = newItems.reduce((sum, i) => sum + i.amount, 0);

      if (cart) {
        const { error } = await supabase
          .from("shopping_cart" as any)
          .update({
            items: newItems,
            total_amount: newTotal,
          })
          .eq("id", cart.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shopping_cart" as any)
          .insert({
            user_id: user.id,
            items: newItems,
            total_amount: newTotal,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-cart"] });
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["user-event-plans"] });
      toast({
        title: "✅ Evento adicionado ao carrinho",
        description: "Continue adicionando mais eventos ou finalize a compra.",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar ao carrinho",
        description: "Não foi possível adicionar o evento ao carrinho.",
        variant: "destructive",
      });
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (index: number) => {
      if (!cart) return;

      const newItems = cart.items.filter((_, i) => i !== index);
      const newTotal = newItems.reduce((sum, i) => sum + i.amount, 0);

      if (newItems.length === 0) {
        const { error } = await supabase
          .from("shopping_cart" as any)
          .delete()
          .eq("id", cart.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shopping_cart" as any)
          .update({
            items: newItems,
            total_amount: newTotal,
          })
          .eq("id", cart.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-cart"] });
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["user-event-plans"] });
      toast({
        title: "🗑️ Evento removido",
        description: "O evento foi removido do carrinho.",
        duration: 2000,
      });
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (!cart) return;

      const { error } = await supabase
        .from("shopping_cart" as any)
        .delete()
        .eq("id", cart.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-cart"] });
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["user-event-plans"] });
    },
  });

  const itemCount = cart?.items?.length || 0;
  const totalAmount = cart?.total_amount || 0;

  return {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    clearCart,
    itemCount,
    totalAmount,
  };
};
