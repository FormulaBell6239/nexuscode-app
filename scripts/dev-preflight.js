#!/usr/bin/env node

const { execSync } = require('node:child_process');

const PORTS = [3000, 3001];

function getPidsForPort(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (!output) return [];
    return output
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    execSync(`kill ${pid}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run() {
  let killed = 0;

  for (const port of PORTS) {
    const pids = getPidsForPort(port);
    if (pids.length === 0) {
      console.log(`[preflight] Port ${port}: clear`);
      continue;
    }

    for (const pid of pids) {
      if (killPid(pid)) {
        killed += 1;
        console.log(`[preflight] Port ${port}: stopped process ${pid}`);
      } else {
        console.warn(`[preflight] Port ${port}: could not stop process ${pid}`);
      }
    }
  }

  if (killed === 0) {
    console.log('[preflight] No stale listeners found.');
  } else {
    console.log(`[preflight] Stopped ${killed} process(es).`);
  }
}

run();
