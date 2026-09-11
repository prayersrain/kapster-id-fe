import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const debugPort = process.env.CHROME_DEBUG_PORT ?? '9224';
const baseUrl = process.env.OWNER_BASE_URL ?? 'http://127.0.0.1:3102';
const captureDir = process.env.OWNER_CAPTURE_DIR;
const captureAll = process.env.OWNER_CAPTURE_ALL === '1';
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
  throw new Error('Chrome DevTools endpoint tidak tersedia.');
}

const page = await findPage();
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const consoleMessages = [];
let commandId = 0;

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    const detail = message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
    consoleMessages.push(`${message.params.type}: ${detail}`);
  }
  if (message.method === 'Runtime.exceptionThrown') {
    consoleMessages.push(`exception: ${message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text}`);
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
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  }
  return response.result.value;
}

async function waitForText(text, timeout = 4000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const found = await evaluate(`document.body?.innerText.includes(${JSON.stringify(text)}) ?? false`);
    if (found) return;
    await delay(100);
  }
  throw new Error(`Teks tidak ditemukan: ${text}`);
}

async function clickNav(label) {
  const clicked = await evaluate(`(() => {
    const nav = document.querySelector('nav[aria-label="Navigasi dashboard Owner"]');
    const button = [...(nav?.querySelectorAll('button') ?? [])].find((item) => item.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Menu tidak ditemukan: ${label}`);
  await delay(160);
}

async function capture(name) {
  if (!captureDir) return;
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(captureDir, `owner-${name}.png`), Buffer.from(result.data, 'base64'));
}

async function findMetricOverflows() {
  return evaluate(`(() => [...document.querySelectorAll('[class*="metricCard"]')].flatMap((card, index) => {
    const content = card.querySelector(':scope > div');
    const value = content?.querySelector(':scope > strong');
    if (!content || !value || !value.firstChild) return [];
    const range = document.createRange();
    range.selectNodeContents(value);
    const textBox = range.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();
    return textBox.right > contentBox.right + 0.75
      ? [{ index, label: content.querySelector('span')?.textContent ?? '', value: value.textContent ?? '', overflow: Math.round(textBox.right - contentBox.right) }]
      : [];
  }))()`);
}

async function findViewportEscapes() {
  return evaluate(`(() => [...document.querySelectorAll('button, input, [role="button"]')].flatMap((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || box.width === 0 || box.height === 0) return [];
    return box.left < -0.75 || box.right > window.innerWidth + 0.75
      ? [{ text: (element.textContent || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '').trim().slice(0, 45), left: Math.round(box.left), right: Math.round(box.right) }]
      : [];
  }))()`);
}

const views = [
  ['Dashboard', 'Selamat datang, Andi!'],
  ['Booking', 'Kelola semua reservasi pelanggan'],
  ['Kalender', 'Kalender Booking'],
  ['Transaksi', 'Daftar Transaksi'],
  ['Laporan', 'Laporan & Analitik'],
  ['Outlet', 'Manajemen Outlet'],
  ['Kapster', 'Manajemen Kapster'],
  ['Layanan', 'Layanan & Harga'],
  ['Customer', 'Total Customer'],
  ['Kasir & Shift', 'Kasir Hari Ini'],
  ['Pengaturan', 'Pengaturan & Akses'],
];

try {
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1672, height: 941, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: `${baseUrl}/owner` });
  await waitForText('Selamat datang, Andi!', 6000);
  await delay(500);

  const shell = await evaluate(`(() => {
    const sidebar = document.querySelector('aside');
    const topbar = document.querySelector('header');
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      sidebarWidth: Math.round(sidebar.getBoundingClientRect().width),
      topbarHeight: Math.round(topbar.getBoundingClientRect().height),
      navCount: document.querySelectorAll('nav[aria-label="Navigasi dashboard Owner"] button').length,
    };
  })()`);
  if (shell.documentWidth > shell.viewportWidth || shell.navCount !== views.length || shell.sidebarWidth < 220 || shell.sidebarWidth > 250 || shell.topbarHeight < 68 || shell.topbarHeight > 76) {
    throw new Error(`Shell dashboard tidak sesuai: ${JSON.stringify(shell)}`);
  }

  for (const [label, expected] of views) {
    await clickNav(label);
    await waitForText(expected);
    const active = await evaluate(`document.querySelector('nav [aria-current="page"]')?.textContent.trim()`);
    if (active !== label) throw new Error(`Menu aktif tidak sesuai: ${label} -> ${active}`);
    const overflows = await findMetricOverflows();
    if (overflows.length) throw new Error(`KPI overflow pada ${label} @1672px: ${JSON.stringify(overflows)}`);
    const viewportEscapes = await findViewportEscapes();
    if (viewportEscapes.length) throw new Error(`Elemen interaktif keluar viewport pada ${label}: ${JSON.stringify(viewportEscapes)}`);
    if (captureAll || label === 'Booking' || label === 'Pengaturan') await capture(`1672-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`);
  }

  await command('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: `${baseUrl}/owner` });
  await waitForText('Selamat datang, Andi!', 5000);
  for (const [label, expected] of views) {
    await clickNav(label);
    await waitForText(expected);
    const overflows = await findMetricOverflows();
    if (overflows.length) throw new Error(`KPI overflow pada ${label} @1280px: ${JSON.stringify(overflows)}`);
    if (captureAll && ['Dashboard', 'Transaksi', 'Laporan', 'Outlet', 'Kapster', 'Kasir & Shift'].includes(label)) {
      await capture(`1280-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`);
    }
  }

  await command('Emulation.setDeviceMetricsOverride', { width: 1280, height: 650, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: `${baseUrl}/owner` });
  await delay(500);
  await waitForText('Selamat datang, Andi!', 5000);
  const sidebarScroll = await evaluate(`(() => {
    const sidebar = document.querySelector('nav[aria-label="Navigasi dashboard Owner"]')?.closest('aside');
    const foot = sidebar?.querySelector('[class*="sidebarFoot"]');
    if (!sidebar || !foot) return null;
    const scrollable = sidebar.scrollHeight > sidebar.clientHeight;
    sidebar.scrollTop = sidebar.scrollHeight;
    const sidebarBox = sidebar.getBoundingClientRect();
    const footBox = foot.getBoundingClientRect();
    return { scrollable, scrollTop: Math.round(sidebar.scrollTop), footVisible: footBox.bottom <= sidebarBox.bottom + 1 };
  })()`);
  if (!sidebarScroll?.scrollable || sidebarScroll.scrollTop <= 0 || !sidebarScroll.footVisible) throw new Error(`Sidebar tidak bisa mencapai bagian bawah: ${JSON.stringify(sidebarScroll)}`);

  await command('Emulation.setDeviceMetricsOverride', { width: 1672, height: 941, deviceScaleFactor: 1, mobile: false });

  await clickNav('Booking');
  const rowChanged = await evaluate(`(() => {
    const rows = [...document.querySelectorAll('tbody tr')];
    if (rows.length < 2) return false;
    rows[1].click();
    return true;
  })()`);
  if (!rowChanged) throw new Error('Baris booking kedua tidak tersedia.');
  await waitForText('Salsa Putri');

  await clickNav('Pengaturan');
  const toggleBefore = await evaluate(`(() => {
    const toggle = [...document.querySelectorAll('button')].find((item) => item.firstElementChild?.tagName === 'I' && item.parentElement?.textContent.includes('Notifikasi booking baru'));
    if (!toggle) return null;
    const className = toggle.className;
    toggle.click();
    return className;
  })()`);
  await delay(120);
  const toggleAfter = await evaluate(`([...document.querySelectorAll('button')].find((item) => item.firstElementChild?.tagName === 'I' && item.parentElement?.textContent.includes('Notifikasi booking baru')))?.className ?? null`);
  if (!toggleBefore || toggleBefore === toggleAfter) throw new Error('Toggle notifikasi tidak merespons.');

  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: `${baseUrl}/owner` });
  await waitForText('Selamat datang, Andi!', 5000);
  await delay(800);
  const mobileBefore = await evaluate(`({ viewportWidth: document.documentElement.clientWidth, documentWidth: document.documentElement.scrollWidth })`);
  if (mobileBefore.documentWidth > mobileBefore.viewportWidth) throw new Error(`Body mobile melebar: ${JSON.stringify(mobileBefore)}`);
  const menuOpened = await evaluate(`(() => {
    const button = document.querySelector('button[aria-label="Buka atau tutup menu"]');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  await delay(300);
  const mobileMenu = await evaluate(`(() => {
    const nav = document.querySelector('nav[aria-label="Navigasi dashboard Owner"]');
    const box = nav?.closest('aside')?.getBoundingClientRect();
    return { left: Math.round(box?.left ?? -999), right: Math.round(box?.right ?? -999), backdrop: Boolean(document.querySelector('button[aria-label="Tutup menu"]')) };
  })()`);
  if (!menuOpened || mobileMenu.left !== 0 || mobileMenu.right > 390 || !mobileMenu.backdrop) throw new Error(`Menu mobile bermasalah: ${JSON.stringify(mobileMenu)}`);

  const relevantConsoleMessages = consoleMessages.filter((message) => !message.includes('Download the React DevTools'));
  if (relevantConsoleMessages.length) throw new Error(`Console dashboard tidak bersih: ${JSON.stringify(relevantConsoleMessages)}`);

  process.stdout.write(`Owner dashboard smoke test passed. Desktop ${JSON.stringify(shell)} Sidebar ${JSON.stringify(sidebarScroll)} Mobile ${JSON.stringify(mobileBefore)} Console errors: 0\n`);
} finally {
  socket.close();
}
