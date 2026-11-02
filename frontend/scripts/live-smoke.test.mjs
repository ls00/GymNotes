import assert from "node:assert/strict";
import test from "node:test";

const webUrl = (process.env.GYMNOTES_WEB_URL || "https://gymnotes-gg.vercel.app").replace(/\/+$/, "");
const apiUrl = (process.env.GYMNOTES_API_URL || "https://gymnotes-api.vercel.app").replace(/\/+$/, "");
const apiBase = `${apiUrl}/api/v1`;
const requestTimeout = () => AbortSignal.timeout(60_000);

function jsonHeaders() {
  return { "Content-Type": "application/json" };
}

test("site login page is available", async () => {
  const response = await fetch(`${webUrl}/login`, { signal: requestTimeout() });
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/html/);
  assert.ok(
    body.includes("Diário de Treinos"),
    "Vercel access-protection HTML was returned instead of the GymNotes page",
  );
});

test("OpenAPI lists the application endpoints", async () => {
  const response = await fetch(`${apiUrl}/v3/api-docs`, { signal: requestTimeout() });
  const specification = await response.json();

  assert.equal(response.status, 200);
  assert.equal(Object.keys(specification.paths).length, 16);
});

test("OpenAPI advertises HTTPS for the deployed API", async () => {
  const response = await fetch(`${apiUrl}/v3/api-docs`, { signal: requestTimeout() });
  const specification = await response.json();

  assert.match(specification.servers?.[0]?.url || "", /^https:\/\//);
});

test("login rejects unknown credentials without creating an account", async () => {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      email: "gymnotes-smoke-no-account@example.invalid",
      password: "invalid-password",
    }),
    signal: requestTimeout(),
  });

  assert.equal(response.status, 401);
});

test("registration validates invalid input before persistence", async () => {
  const response = await fetch(`${apiBase}/auth/register`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ name: "", email: "invalid", password: "x" }),
    signal: requestTimeout(),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Validation Failed");
  assert.ok(body.fieldErrors);
});

test("frontend origin passes API CORS preflight", async () => {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: new URL(webUrl).origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
    signal: requestTimeout(),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), new URL(webUrl).origin);
  assert.match(response.headers.get("access-control-allow-methods") || "", /POST/);
});

test("protected API endpoints reject anonymous requests", async (t) => {
  const endpoints = [
    ["GET", "/users/me"],
    ["PUT", "/users/me", {}],
    ["POST", "/workouts/plans", {}],
    ["GET", "/workouts/plans"],
    ["GET", "/workouts/exercises/search?q=Agachamento"],
    ["POST", "/workouts/sessions", {}],
    ["GET", "/workouts/sessions/history"],
    ["GET", "/workouts/exercises/10000000-0000-4000-8000-000000000001/progress"],
    ["GET", "/nutrition/foods/search?q=banana"],
    ["POST", "/nutrition/foods", {}],
    ["POST", "/nutrition/meals", {}],
    ["GET", "/nutrition/summary/daily"],
    ["POST", "/social/friends/request/00000000-0000-4000-8000-000000000001"],
    ["PUT", "/social/friends/respond/00000000-0000-4000-8000-000000000001"],
    ["GET", "/social/feed"],
    ["POST", "/social/interactions", {}],
  ];

  for (const [method, path, body] of endpoints) {
    await t.test(`${method} ${path}`, async () => {
      const response = await fetch(`${apiBase}${path}`, {
        method,
        headers: body ? jsonHeaders() : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: requestTimeout(),
      });

      assert.equal(response.status, 401);
    });
  }
});

test("PWA manifest is served as JSON", async () => {
  const response = await fetch(`${webUrl}/manifest.json`, { signal: requestTimeout() });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /application\/(manifest\+)?json/);
});

for (const [path, size] of [
  ["/icons/icon-192x192.png", 192],
  ["/icons/icon-512x512.png", 512],
]) {
  test(`PWA ${size}px icon is served as PNG`, async () => {
    const response = await fetch(`${webUrl}${path}`, { signal: requestTimeout() });
    const bytes = new Uint8Array(await response.arrayBuffer());

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /image\/png/);
    assert.deepEqual(Array.from(bytes.slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
  });
}
