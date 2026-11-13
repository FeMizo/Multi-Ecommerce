-- Inserts only: preserve every original plan, its limits, features and commission.
INSERT INTO plans (id, name, slug, "priceMonthly", "priceYearly", "maxProducts", "maxOrdersMonth", "commissionRate", features, "stripePriceId", "isActive", "createdAt")
SELECT 'launch2026_' || id, name || ' Promo', slug || '-promo',
       ROUND(("priceMonthly" * 0.8)::numeric, 2)::double precision,
       "priceYearly", "maxProducts", "maxOrdersMonth", "commissionRate", features,
       NULL, "isActive", NOW()
FROM plans WHERE slug IN ('starter', 'pro', 'business', 'agency')
ON CONFLICT (slug) DO NOTHING;
