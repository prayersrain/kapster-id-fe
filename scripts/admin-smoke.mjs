import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const debugPort = process.env.CHROME_DEBUG_PORT ?? '9227';
const baseUrl = process.env.ADMIN_BASE_URL ?? 'http://127.0.0.1:3100';
const captureDir = process.env.ADMIN_CAPTURE_DIR;
const captureAll = process.env.ADMIN_CAPTURE_ALL === '1';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findPage() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
           const pages = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
      const page = pages.find((item) => item.type === 'page');
      if (page) return page;
    } catch {
      // Chrome may still be starting.
    }
    await delay(200);
  }
  throw new Error('Chrome DevTools endpoint dashboard Admin tidak tersedia.');
}

const page = await findPage();
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const consoleMessages = [];
let commandId = 0;

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    consoleMessages.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
  }
  if (message.method === 'Runtime.exceptionThrown') {
    consoleMessages.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

function command(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  return response.result.value;
}

async function waitForText(text, timeout = 5000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(`document.body?.innerText.includes(${JSON.stringify(text)}) ?? false`)) return;
    await delay(100);
  }
  throw new Error(`Teks tidak ditemukan: ${text}`);
}

async function clickNav(label) {
  const clicked = await evaluate(`(() => {
    const nav = document.querySelector('nav[aria-label="Navigasi Admin Platform"]');
    const button = [...(nav?.querySelectorAll('button') ?? [])].find((item) => item.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Menu Admin tidak ditemukan: ${label}`);
  await delay(220);
}

async function viewportInfo() {
  return evaluate(`(() => {
    const workspace = document.querySelector('div[class*="workspace"]');
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      workspaceWidth: workspace?.clientWidth ?? 0,
      workspaceScrollWidth: workspace?.scrollWidth ?? 0,
    };
  })()`);
}

async function capture(name) {
  if (!captureDir) return;
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(captureDir, `admin-${name}.png`), Buffer.from(result.data, 'base64'));
}

const views = [
  ['Overview', 'Ringkasan performa, kesehatan sistem, dan aktivitas tenant.'],
  ['Tenants', 'Kelola semua organisasi tenant'],
  ['Tenant Detail', 'Garasi Barber Group'],
  ['Onboarding', 'Pantau progres aktivasi tenant'],
  ['Subscription', 'Kelola paket, invoice, masa trial'],
  ['Operations', 'Pantau kesehatan platform'],
  ['Support', 'Kelola tiket dan masalah tenant'],
  ['Analytics', 'Analisis pertumbuhan tenant'],
  ['Audit & Security', 'Pantau aktivitas sensitif'],
  ['Platform Settings', 'Konfigurasi platform dan manajemen internal admin.'],
];

try {
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1672, height: 941, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: `${baseUrl}/admin` });
  await waitForText('Ringkasan performa, kesehatan sistem, dan aktivitas tenant.');
  await delay(500);

  const shell = await evaluate(`(() => {
    const nav = document.querySelector('nav[aria-label="Navigasi Admin Platform"]');
    const sidebar = nav?.closest('aside');
    const topbar = document.querySelector('header');
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      sidebarWidth: Math.round(sidebar?.getBoundingClientRect().width ?? 0),
      topbarHeight: Math.round(topbar?.getBoundingClientRect().height ?? 0),
      navCount: nav?.querySelectorAll('button').length ?? 0,
    };
  })()`);
  if (shell.documentWidth > shell.viewportWidth || shell.navCount !== views.length || shell.sidebarWidth !== 240 || shell.topbarHeight !== 70) {
    throw new Error(`Shell Admin desktop tidak sesuai: ${JSON.stringify(shell)}`);
  }
  await capture('overview-1672');

  for (const [label, expected] of views) {
    await clickNav(label);
    await waitForText(expected);
    if (captureAll) await capture(`${label.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and')}-1672`);
  }

  await clickNav('Tenants');
  const tenantOpened = await evaluate(`(() => { const row = document.querySelector('tbody tr'); if (!row) return false; row.click(); return true; })()`);
  if (!tenantOpened) throw new Error('Baris tenant tidak tersedia.');
  await waitForText('Break-glass Access');

  await clickNav('Support');
  const supportSelected = await evaluate(`(() => { const rows = document.querySelectorAll('tbody tr'); if (rows.length < 2) return false; rows[1].click(); return true; })()`);
  if (!supportSelected) throw new Error('Baris support tidak tersedia.');
  await waitForText('Tidak bisa login ke POS');

  await clickNav('Platform Settings');
  const toggleChanged = await evaluate(`(() => {
    const toggle = document.querySelector('button[aria-label^="Toggle"]');
    if (!toggle) return false;
    const before = toggle.className;
    toggle.click();
    return new Promise((resolve) => setTimeout(() => resolve(before !== toggle.className), 120));
  })()`);
  if (!toggleChanged) throw new Error('Toggle settings tidak merespons.');

  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: `${baseUrl}/admin` });
  await waitForText('Ringkasan performa, kesehatan sistem, dan aktivitas tenant.');
  await delay(500);
  const mobile = await viewportInfo();
  if (mobile.documentWidth > mobile.viewportWidth || mobile.bodyWidth > mobile.viewportWidth || mobile.workspaceScrollWidth > mobile.workspaceWidth) {
    const widest = await evaluate(`(() => [...document.querySelectorAll('body *')].map((node) => {
      const box = node.getBoundingClientRect();
      return { tag: node.tagName, className: String(node.className).slice(0, 90), left: Math.round(box.left), right: Math.round(box.right), width: Math.round(box.width) };
    }).filter((item) => item.right > window.innerWidth + 1 || item.left < -1).sort((a, b) => b.right - a.right).slice(0, 8))()`);
    throw new Error(`Dashboard Admin mobile melebar: ${JSON.stringify(mobile)} Elemen: ${JSON.stringify(widest)}`);
  }
  await capture('mobile-390');
  const menuButton = await evaluate(`document.querySelector('button[aria-label="Buka menu"]')?.click() ?? false`);
  await delay(220);
  const drawer = await evaluate(`(() => { const aside = document.querySelector('nav[aria-label="Navigasi Admin Platform"]')?.closest('aside'); const box = aside?.getBoundingClientRect(); return { left: Math.round(box?.left ?? -999), right: Math.round(box?.right ?? -999), backdrop: Boolean(document.querySelector('button[aria-label="Tutup menu"]')) }; })()`);
  if (drawer.left !== 0 || drawer.right > 390 || !drawer.backdrop) throw new Error(`Drawer mobile bermasalah: ${JSON.stringify(drawer)} ${menuButton}`);

  for (const [label, expected] of views) {
    await clickNav(label);
    await waitForText(expected);
    const size = await viewportInfo();
    if (size.workspaceScrollWidth > size.workspaceWidth) throw new Error(`Area kerja mobile melebar pada ${label}: ${JSON.stringify(size)}`);
  }

  const relevantConsoleMessages = consoleMessages.filter((message) => !message.includes('Download the React DevTools'));
  if (relevantConsoleMessages.length) throw new Error(`Console dashboard Admin tidak bersih: ${JSON.stringify(relevantConsoleMessages)}`);
  process.stdout.write(`Admin dashboard smoke test passed. Desktop ${JSON.stringify(shell)} Mobile ${JSON.stringify(mobile)} Console errors: 0\n`);
} finally {
  socket.close();
}
