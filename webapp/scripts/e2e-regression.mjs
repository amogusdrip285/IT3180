const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
const user = process.env.E2E_USER || "admin";
const password = process.env.E2E_PASSWORD || "admin";

async function expectOk(name, response) {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${name} failed (${response.status}): ${body}`);
  }
}

function parseSetCookie(headers) {
  const raw = headers.get("set-cookie") || "";
  const match = raw.match(/bm_session=[^;]+/);
  return match ? match[0] : "";
}

async function main() {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usernameOrEmail: user, password }),
  });
  await expectOk("login", loginRes);

  const cookie = parseSetCookie(loginRes.headers);
  if (!cookie) {
    throw new Error("login succeeded but session cookie not returned");
  }

  const authHeaders = { cookie };

  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
  await expectOk("auth me", meRes);

  const bootstrapRes = await fetch(`${baseUrl}/api/bootstrap`, { method: "POST", headers: authHeaders });
  await expectOk("bootstrap", bootstrapRes);

  const householdsRes = await fetch(`${baseUrl}/api/households?page=1&pageSize=10`, { headers: authHeaders });
  await expectOk("households list", householdsRes);

  const residentsRes = await fetch(`${baseUrl}/api/residents?page=1&pageSize=10`, { headers: authHeaders });
  await expectOk("residents list", residentsRes);

  const feesRes = await fetch(`${baseUrl}/api/fee-types?page=1&pageSize=10`, { headers: authHeaders });
  await expectOk("fee types list", feesRes);

  const periodsRes = await fetch(`${baseUrl}/api/periods?page=1&pageSize=10`, { headers: authHeaders });
  await expectOk("periods list", periodsRes);

  const obligationsRes = await fetch(`${baseUrl}/api/obligations?page=1&pageSize=10`, { headers: authHeaders });
  await expectOk("obligations list", obligationsRes);

  const paymentsRes = await fetch(`${baseUrl}/api/payments?page=1&pageSize=10`, { headers: authHeaders });
  await expectOk("payments list", paymentsRes);

  const reportRes = await fetch(`${baseUrl}/api/reports/payments?month=3&year=2026&category=all`, { headers: authHeaders });
  await expectOk("payments report", reportRes);

  const auditRes = await fetch(`${baseUrl}/api/audit-logs?page=1&pageSize=10`, { headers: authHeaders });
  await expectOk("audit logs", auditRes);

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: authHeaders });
  await expectOk("logout", logoutRes);

  console.log("E2E smoke regression passed");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
