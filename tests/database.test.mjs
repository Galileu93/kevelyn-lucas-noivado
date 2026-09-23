import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const root = new URL("../", import.meta.url);
test("PostgreSQL: RLS, atomic reservations, idempotency, validation and admin release", async (t) => {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
  );
  await db.exec(
    await readFile(new URL("supabase/001_schema.sql", root), "utf8"),
  );
  await db.exec(
    await readFile(new URL("supabase/002_gifts.sql", root), "utf8"),
  );
  const id = "1733527355293599176",
    admin = "00000000-0000-4000-8000-000000000001",
    nonadmin = "00000000-0000-4000-8000-000000000002";
  const req = "11111111-1111-4111-8111-111111111111",
    req2 = "22222222-2222-4222-8222-222222222222";
  await db.exec(
    `insert into auth.users values('${admin}'),('${nonadmin}');insert into private.admin_users values('${admin}');set role anon;`,
  );
  await t.test(
    "anonymous sees only public catalog and cannot write tables/read guest identities",
    async () => {
      assert.equal(
        (await db.query("select * from public.gifts")).rows.length,
        32,
      );
      for (const q of [
        "select * from public.gift_claims",
        "select * from public.rsvps",
        "select * from private.admin_users",
        "update public.gifts set status='claimed'",
        "delete from public.gifts",
      ])
        await assert.rejects(db.query(q), /permission denied/);
    },
  );
  await t.test("two competing requests produce exactly one claim", async () => {
    const queries = [req, req2].map((r, i) =>
      db.query("select public.reserve_gift($1,$2,$3,$4) as result", [
        id,
        "Convidado teste " + i,
        "Família teste",
        r,
      ]),
    );
    const results = await Promise.all(queries);
    assert.deepEqual(results.map((r) => r.rows[0].result).sort(), [
      "already_claimed",
      "reserved",
    ]);
    assert.equal(
      (await db.query("select status from public.gifts where id=$1", [id]))
        .rows[0].status,
      "claimed",
    );
  });
  await t.test(
    "retry with same request id is idempotent; invalid fields rejected",
    async () => {
      assert.equal(
        (
          await db.query("select public.reserve_gift($1,$2,$3,$4) as result", [
            id,
            "Convidado teste",
            "Família teste",
            req,
          ])
        ).rows[0].result,
        "reserved",
      );
      await assert.rejects(
        db.query("select public.reserve_gift($1,$2,$3,$4)", [
          id,
          "A",
          "",
          req2,
        ]),
        /INVALID_INPUT/,
      );
      await assert.rejects(
        db.query("select public.reserve_gift($1,$2,$3,$4)", [
          "inexistente",
          "Convidado",
          "",
          req2,
        ]),
        /GIFT_NOT_FOUND/,
      );
    },
  );
  await t.test("RSVP yes/no, retry deduplication and validation", async () => {
    const q = "select public.submit_rsvp($1,$2,$3,$4,$5,$6)";
    await db.query(q, ["Teste Sim", "Família", 3, true, "Um abraço", req]);
    await db.query(q, ["Teste Sim", "Família", 3, true, "Um abraço", req]);
    await db.query(q, ["Teste Não", "Família", 2, false, "", req2]);
    await assert.rejects(
      db.query(q, ["Nome", "", 0, true, "", crypto.randomUUID()]),
      /INVALID_INPUT/,
    );
    await assert.rejects(
      db.query(q, ["Nome", "", 1, true, "x".repeat(1001), crypto.randomUUID()]),
      /INVALID_INPUT/,
    );
  });
  await t.test(
    "signed-in nonadmin cannot see identities or release gifts",
    async () => {
      await db.exec(
        `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${nonadmin}',false)`,
      );
      assert.equal(
        (await db.query("select * from public.gift_claims")).rows.length,
        0,
      );
      assert.equal(
        (await db.query("select * from public.rsvps")).rows.length,
        0,
      );
      await assert.rejects(
        db.query("select public.release_gift($1)", [id]),
        /FORBIDDEN/,
      );
      await assert.rejects(
        db.query("insert into private.admin_users values($1)", [nonadmin]),
        /permission denied/,
      );
    },
  );
  await t.test(
    "admin reads records, releases atomically, permits new reservation",
    async () => {
      await db.exec(
        `select set_config('request.jwt.claim.sub','${admin}',false)`,
      );
      assert.equal(
        (await db.query("select * from public.gift_claims")).rows.length,
        1,
      );
      const rsvps = (await db.query("select * from public.rsvps")).rows;
      assert.equal(rsvps.length, 2);
      assert.equal(
        rsvps.reduce((n, r) => n + (r.attendance ? r.guest_count : 0), 0),
        3,
      );
      await db.query("select public.release_gift($1)", [id]);
      assert.equal(
        (await db.query("select * from public.gift_claims")).rows.length,
        0,
      );
      await db.exec("reset role;set role anon");
      assert.equal(
        (
          await db.query("select public.reserve_gift($1,$2,$3,$4) as result", [
            id,
            "Novo convidado",
            "",
            req2,
          ])
        ).rows[0].result,
        "reserved",
      );
    },
  );
  await t.test("unique constraint is a database backstop", async () => {
    await db.exec("reset role");
    await assert.rejects(
      db.query(
        "insert into public.gift_claims(gift_id,request_id,guest_name) values($1,$2,$3)",
        [id, crypto.randomUUID(), "Duplicado"],
      ),
      /unique constraint/,
    );
  });
  await db.close();
});
