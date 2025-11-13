// IDs dos produtos e preços do Stripe
// Execute o edge function setup-stripe-products para gerar esses IDs
// e atualize os valores abaixo com os IDs retornados

export const STRIPE_PRICES = {
  ESSENTIAL: {
    name: "Essential",
    price_id: "price_1ST7jePLqFlDnWiItuRHaCDV",
    product_id: "prod_TPxeH3Jxz95rou",
    amount: 79.00,
    currency: "BRL",
    guests_limit: 200,
    description: "Até 200 convidados por evento",
  },
  PREMIUM: {
    name: "Premium",
    price_id: "price_1ST7k0PLqFlDnWiIbfCIajPf",
    product_id: "prod_TPxf52QGQeGZfR",
    amount: 149.00,
    currency: "BRL",
    guests_limit: Infinity,
    description: "Convidados ilimitados por evento",
  },
  PROFESSIONAL: {
    name: "Professional",
    price_id: "price_1ST7kFPLqFlDnWiIUOGgbJ0m",
    product_id: "prod_TPxfoKW5euUqBm",
    amount: 97.00,
    currency: "BRL",
    recurring: "monthly" as const,
    events_limit: Infinity,
    guests_limit: Infinity,
    description: "Eventos e convidados ilimitados",
  },
};

export type StripePricePlan = keyof typeof STRIPE_PRICES;
