import { strict as assert } from "node:assert"
import test from "node:test"
import {
  buildProspectDuplicateWhere,
  isProspectTerminalStatus,
  normalizeProspectEmail,
  normalizeProspectPhone,
  normalizeProspectText,
  normalizeTerminalProspectState,
} from "@/lib/prospects"
import { isPlatformAdminSession } from "@/lib/admin-permissions"

test("normalizes prospect values for duplicate detection", () => {
  assert.equal(normalizeProspectText("  Tacos & Más  "), "tacos mas")
  assert.equal(normalizeProspectPhone("+52 55 1234 5678"), "525512345678")
  assert.equal(normalizeProspectEmail("Foo@Example.com"), "foo@example.com")
})

test("builds duplicate where from normalized fields", () => {
  const where = buildProspectDuplicateWhere({
    id: "x",
    businessNameNormalized: "tacos el buen sabor",
    phoneNormalized: "5512345678",
    emailNormalized: "hola@example.com",
    websiteNormalized: null,
    googleMapsUrlNormalized: null,
    facebookUrlNormalized: null,
    instagramUrlNormalized: null,
  })

  assert.ok(where)
  assert.ok("OR" in where!)
})

test("terminal status clears follow-up state", () => {
  assert.equal(isProspectTerminalStatus("WON"), true)
  assert.deepEqual(normalizeTerminalProspectState("WON", new Date("2026-08-05T12:00:00Z")), {
    status: "WON",
    nextFollowUpAt: null,
  })
})

test("admin session guard only accepts platform admins", () => {
  assert.equal(isPlatformAdminSession({ user: { globalRole: "PLATFORM_ADMIN" } }), true)
  assert.equal(isPlatformAdminSession({ user: { globalRole: "USER" } }), false)
})
