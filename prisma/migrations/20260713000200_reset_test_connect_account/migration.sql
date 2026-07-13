-- A test-mode connected account cannot receive destination charges from the
-- live platform. Preserve the store and its history, but require live onboarding.
UPDATE "stores"
SET "stripeAccountId" = NULL, "stripeOnboarded" = false
WHERE "stripeAccountId" = 'acct_1TsodgRNFUFykv2T';
