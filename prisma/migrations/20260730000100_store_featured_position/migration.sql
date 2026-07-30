ALTER TABLE "stores"
ADD COLUMN "featuredPosition" INTEGER;

CREATE UNIQUE INDEX "stores_featuredPosition_key" ON "stores"("featuredPosition");
