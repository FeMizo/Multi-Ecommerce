ALTER TABLE "public"."sessions" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_deny_all" ON "public"."sessions";

CREATE POLICY "sessions_deny_all"
  ON "public"."sessions"
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);
