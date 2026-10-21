const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
const requestTimeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 5000);

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const text = await response.text();
    let parsed = null;

    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    return { response, body: parsed };
  } finally {
    clearTimeout(timeout);
  }
}

function fail(message) {
  console.error(`Smoke check failed: ${message}`);
  process.exitCode = 1;
  return false;
}

async function main() {
  const results = [];

  try {
    const frontend = await requestJson(frontendUrl, { method: 'GET' });
    if (!frontend.response.ok) {
      fail(`frontend returned ${frontend.response.status}`);
    } else {
      results.push(`frontend ${frontend.response.status}`);
    }

    const health = await requestJson(new URL('/api/health', backendUrl).toString(), { method: 'GET' });
    if (!health.response.ok) {
      fail(`backend health returned ${health.response.status}`);
    } else if (!health.body || health.body.status !== 'ok' || health.body.database !== 'up') {
      fail(`backend health payload was unexpected: ${JSON.stringify(health.body)}`);
    } else {
      results.push(`backend health ${health.response.status}`);
    }

    const profile = await requestJson(new URL('/api/profile', backendUrl).toString(), { method: 'GET' });
    if (profile.response.status !== 401) {
      fail(`protected profile endpoint returned ${profile.response.status} instead of 401`);
    } else {
      results.push('protected route 401');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(message);
  }

  if (process.exitCode === 1) {
    process.exit(1);
  }

  console.log(`Smoke check passed: ${results.join(', ')}`);
}

main();