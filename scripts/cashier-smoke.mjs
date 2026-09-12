import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const debugPort = process.env.CHROME_DEBUG_PORT ?? '9226';
const baseUrl = process.env.CASHIER_BASE_URL ?? 'http://127.0.0.1:3100';
const captureDir = process.env.CASHIER_CAPTURE_DIR;
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
  throw new Error('Chrome DevTools endpoint dashboard kasir tidak tersedia.');
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

async function clickButton(label, exact = true) {
  const clicked = await evaluate(`(() => {
    const label = ${JSON.stringify(label)};
    const button = [...document.querySelectorAll('button')].find((item) => ${exact ? 'item.textContent.trim() === label' : 'item.textContent.includes(label)'});
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Tombol tidak ditemukan: ${label}`);
  await delay(180);
}

async function clickNav(label) {
  const clicked = await evaluate(`(() => {
    const nav = document.querySelector('nav[aria-label="Navigasi kasir"]');
    const button = [...(nav?.querySelectorAll('button') ?? [])].find((item) => item.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Menu kasir tidak ditemukan: ${label}`);
  await delay(180);
}

async function viewportInfo() {
  return evaluate(`(() => {
    const workspace = document.querySelector('section[class*="workspace"]');
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      workspaceWidth: workspace?.clientWidth ?? 0,
      workspaceScrollWidth: workspace?.scrollWidth ?? 0
    };
  })()`);
}

async function capture(name) {
  if (!captureDir) return;
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(captureDir, `cashier-${name}.png`), Buffer.from(result.data, 'base64'));
}

const views = [
  ['Kasir', 'Antrean Hari Ini'],
  ['Antrean', 'Kelola urutan customer'],
  ['Booking', 'Kelola jadwal booking pelanggan'],
  ['Transaksi', 'Riwayat transaksi pembayaran pelanggan'],
  ['Pelanggan', 'Data pelanggan di outlet Anda'],
  ['Shift Kasir', 'Ringkasan Shift'],
  ['Pengaturan', 'Informasi Outlet (Terkunci)'],
];

try {
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: `${baseUrl}/cashier` });
  await waitForText('Antrean Hari Ini');
  await delay(450);

  const shell = await evaluate(`(() => {
    const sidebar = document.querySelector('nav[aria-label="Navigasi kasir"]')?.closest('aside');
    const topbar = document.querySelector('header');
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      sidebarWidth: Math.round(sidebar?.getBoundingClientRect().width ?? 0),
      topbarHeight: Math.round(topbar?.getBoundingClientRect().height ?? 0),
      navCount: document.querySelectorAll('nav[aria-label="Navigasi kasir"] button').length,
    };
  })()`);
  if (shell.documentWidth > shell.viewportWidth || shell.navCount !== views.length || shell.sidebarWidth !== 220 || shell.topbarHeight !== 68) {
    throw new Error(`Shell kasir desktop tidak sesuai: ${JSON.stringify(shell)}`);
  }

  for (const [label, expected] of views) {
    await clickNav(label);
    await waitForText(expected);
  }

  await clickNav('Booking');
  const bookingOpened = await evaluate(`(() => { const row = document.querySelector('tbody tr'); if (!row) return false; row.click(); return true; })()`);
  if (!bookingOpened) throw new Error('Baris booking tidak tersedia.');
  await waitForText('Detail Booking');
  await clickButton('Ubah Jadwal');
  await waitForText('Pilih Waktu Tersedia');
  await clickButton('14:30');
  await clickButton('Simpan Jadwal Baru');
  await waitForText('Jadwal baru 14:30 tersimpan');

  await clickNav('Kasir');
  await clickButton('Tambah Walk-in');
  await waitForText('Pilih Layanan');
  await clickButton('Haircut + Hair Wash', false);
  await clickButton('Lanjut ke Kapster');
  await waitForText('Pilih Kapster');
  await clickButton('Andi Kurniawan', false);
  await clickButton('Lanjut ke Checkout');
  await waitForText('Metode Pembayaran');
  await clickButton('QRIS');
  await clickButton('Selesaikan Transaksi');
  await waitForText('Transaksi QRIS berhasil dicatat');

  await clickNav('Pengaturan');
  const toggleChanged = await evaluate(`(() => {
    const toggle = document.querySelector('button[role="switch"]');
    if (!toggle) return false;
    const before = toggle.getAttribute('aria-checked');
    toggle.click();
    return new Promise((resolve) => setTimeout(() => resolve(before !== toggle.getAttribute('aria-checked')), 100));
  })()`);
  if (!toggleChanged) throw new Error('Toggle pengaturan tidak merespons.');
  await clickButton('Keluar dari Aplikasi');
  await waitForText('Tutup shift terlebih dahulu sebelum keluar dari aplikasi');

  await clickNav('Shift Kasir');
  await clickButton('Tutup Shift');
  await waitForText('Konfirmasi Tutup Shift');
  await clickButton('Konfirmasi Tutup Shift');
  await waitForText('Shift Belum Dibuka');
  await clickButton('Buka Shift Kasir');
  await waitForText('Saldo awal laci kas');
  const shiftOpened = await evaluate(`(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const button = [...(dialog?.querySelectorAll('button') ?? [])].find((item) => item.textContent.trim() === 'Mulai Shift');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!shiftOpened) throw new Error('Tombol konfirmasi buka shift tidak ditemukan.');
  await waitForText('Shift pagi dibuka dengan saldo');

  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: `${baseUrl}/cashier` });
  await waitForText('Antrean Hari Ini');
  await delay(500);
  const mobile = await viewportInfo();
  if (mobile.documentWidth > mobile.viewportWidth || mobile.bodyWidth > mobile.viewportWidth || mobile.workspaceScrollWidth > mobile.workspaceWidth) {
    const widest = await evaluate(`(() => [...document.querySelectorAll('body *')].map((node) => {
      const box = node.getBoundingClientRect();
      return { tag: node.tagName, className: String(node.className).slice(0, 90), left: Math.round(box.left), right: Math.round(box.right), width: Math.round(box.width) };
    }).filter((item) => item.right > window.innerWidth + 1 || item.left < -1).sort((a, b) => b.right - a.right).slice(0, 8))()`);
    throw new Error(`Body mobile melebar: ${JSON.stringify(mobile)} Elemen: ${JSON.stringify(widest)}`);
  }
  await capture('mobile-390');
  const menuButton = await evaluate(`document.querySelector('button[aria-label="Buka menu"]')?.click() ?? false`);
  await delay(250);
  const drawer = await evaluate(`(() => { const aside = document.querySelector('nav[aria-label="Navigasi kasir"]')?.closest('aside'); const box = aside?.getBoundingClientRect(); return { left: Math.round(box?.left ?? -999), right: Math.round(box?.right ?? -999), backdrop: Boolean(document.querySelector('button[aria-label="Tutup menu"]')) }; })()`);
  if (drawer.left !== 0 || drawer.right > 390 || !drawer.backdrop) throw new Error(`Drawer mobile bermasalah: ${JSON.stringify(drawer)} ${menuButton}`);

  for (const [label, expected] of views) {
    await clickNav(label);
    await waitForText(expected);
    const size = await viewportInfo();
    if (size.workspaceScrollWidth > size.workspaceWidth) {
      throw new Error(`Area kerja mobile melebar pada ${label}: ${JSON.stringify(size)}`);
    }
  }

  await clickNav('Booking');
  await evaluate(`document.querySelector('tbody tr')?.click()`);
  await waitForText('Detail Booking');
  const bookingDetailMobile = await viewportInfo();
  if (bookingDetailMobile.workspaceScrollWidth > bookingDetailMobile.workspaceWidth) {
    throw new Error(`Detail booking mobile melebar: ${JSON.stringify(bookingDetailMobile)}`);
  }

  await clickNav('Kasir');
  await evaluate(`document.querySelector('tbody tr')?.click()`);
  await waitForText('Informasi Booking');
  const customerDetailMobile = await viewportInfo();
  if (customerDetailMobile.workspaceScrollWidth > customerDetailMobile.workspaceWidth) {
    throw new Error(`Detail customer mobile melebar: ${JSON.stringify(customerDetailMobile)}`);
  }

  const relevantConsoleMessages = consoleMessages.filter((message) => !message.includes('Download the React DevTools'));
  if (relevantConsoleMessages.length) throw new Error(`Console dashboard kasir tidak bersih: ${JSON.stringify(relevantConsoleMessages)}`);
  process.stdout.write(`Cashier dashboard smoke test passed. Desktop ${JSON.stringify(shell)} Mobile ${JSON.stringify(mobile)} Console errors: 0\n`);
} finally {
  socket.close();
}
