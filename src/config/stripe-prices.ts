// IDs dos produtos e preços do Stripe
// Execute o edge function setup-stripe-products para gerar esses IDs
// e atualize os valores abaixo com os IDs retornados

export const STRIPE_PRICES = {
  ESSENTIAL: {
    name: "Essential",
    price_id: "price_1ST96TAihnYHiSyUX84RmL0k",
    product_id: "prod_TPz4Y15OPfpJSC",
    amount: 79.00,
    currency: "BRL",
    guests_limit: 200,
    description: "R$ 79 por evento - Até 200 convidados",
    payment_type: "one_time" as const,
  },
  PREMIUM: {
    name: "Premium",
    price_id: "price_1ST97TAihnYHiSyUQKzuwseJ",
    product_id: "prod_TPz5OJBGC82YtY",
    amount: 149.00,
    currency: "BRL",
    recurring: "monthly" as const,
    events_limit: 20,
    guests_limit: Infinity,
    description: "R$ 149/mês - Até 20 eventos por mês com convidados ilimitados",
    payment_type: "subscription" as const,
  },
};

export type StripePricePlan = keyof typeof STRIPE_PRICES;
