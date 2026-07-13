-- Move marketplace defaults to Mexico and persist Stripe customer identifiers.
ALTER TABLE "cities" ALTER COLUMN "country" SET DEFAULT 'MX';
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'mxn';
ALTER TABLE "stores" ADD COLUMN "stripeCustomerId" TEXT;
