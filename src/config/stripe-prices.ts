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
    description: "Até 200 convidados por evento",
  },
  PREMIUM: {
    name: "Premium",
    price_id: "price_1ST97TAihnYHiSyUQKzuwseJ",
    product_id: "prod_TPz5OJBGC82YtY",
    amount: 149.00,
    currency: "BRL",
    guests_limit: Infinity,
    description: "Convidados ilimitados, mapa interativo, relatórios PDF e envio de fotos",
  },
  PROFESSIONAL: {
    name: "Professional",
    price_id: "price_1ST98NAihnYHiSyUbdmKmpx2",
    product_id: "prod_TPz6Vjx8KZO7d1",
    amount: 97.00,
    currency: "BRL",
    recurring: "monthly" as const,
    events_limit: Infinity,
    guests_limit: Infinity,
    description: "Eventos e convidados ilimitados com todos os recursos",
  },
};

export type StripePricePlan = keyof typeof STRIPE_PRICES;
