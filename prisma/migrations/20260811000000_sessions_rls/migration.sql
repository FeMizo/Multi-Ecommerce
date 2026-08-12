ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sessions" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE "public"."sessions" FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE "public"."sessions" FROM authenticated';
  END IF;
END $$;
