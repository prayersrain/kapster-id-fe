const debugPort = process.env.CHROME_DEBUG_PORT ?? '9223';
const baseUrl = process.env.BOOKING_BASE_URL ?? 'http://127.0.0.1:3101';

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
let commandId = 0;

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
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

async function waitForText(text, timeout = 3000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const found = await evaluate(`document.body?.innerText.includes(${JSON.stringify(text)}) ?? false`);
    if (found) return;
    await delay(100);
  }
  throw new Error(`Teks tidak ditemukan: ${text}`);
}

async function clickButton(text) {
  const clicked = await evaluate(`(() => {
    const matches = [...document.querySelectorAll('button')].filter((item) => !item.disabled && item.textContent.includes(${JSON.stringify(text)}));
    const button = matches.at(-1);
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Button tidak ditemukan: ${text}`);
  await delay(80);
}

async function clickAriaLabel(label) {
  const clicked = await evaluate(`(() => {
    const button = document.querySelector('button[aria-label=${JSON.stringify(label)}]');
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Button berlabel tidak ditemukan: ${label}`);
  await delay(80);
}

async function setInput(labelText, value) {
  const updated = await evaluate(`(() => {
    const label = [...document.querySelectorAll('label')].find((item) => item.textContent.includes(${JSON.stringify(labelText)}));
    const input = label?.querySelector('input');
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  if (!updated) throw new Error(`Input tidak ditemukan: ${labelText}`);
  await delay(80);
}

try {
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Page.navigate', { url: `${baseUrl}/booking` });
  await waitForText('Pilih outlet', 5000);
  await delay(600);

  const initialLayout = await evaluate(`(() => {
    const card = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Garasi Barber Tebet'));
    const action = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Lanjut di Garasi Barber'));
    const shell = document.querySelector('main > section');
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      shellWidth: Math.round(shell.getBoundingClientRect().width),
      cardRight: Math.round(card.getBoundingClientRect().right),
      actionTop: Math.round(action.getBoundingClientRect().top),
      actionBottom: Math.round(action.getBoundingClientRect().bottom),
      viewportHeight: window.innerHeight,
    };
  })()`);
  if (initialLayout.documentWidth > initialLayout.viewportWidth || initialLayout.cardRight > initialLayout.viewportWidth || initialLayout.actionBottom > initialLayout.viewportHeight) {
    throw new Error(`Layout mobile bermasalah: ${JSON.stringify(initialLayout)}`);
  }

  await clickButton('Lanjut di Garasi Barber');
  await waitForText('Mau treatment apa?');
  await clickButton('Haircut + Wash');
  await clickButton('Pilih Kapster');
  await waitForText('Pilih yang paling cocok.');
  await clickButton('Dimas');
  await clickButton('Pilih Jadwal');
  await waitForText('Kapan Anda datang?');
  await clickAriaLabel('Min, 13 Sep 2026');
  await clickButton('18.15');
  await clickButton('Isi Data Booking');
  await waitForText('Detail customer');

  await setInput('Nama lengkap', '');
  await setInput('Nomor WhatsApp', '123');
  await clickButton('Review Booking');
  await waitForText('Masukkan nama lengkap minimal 3 karakter.');
  await waitForText('Gunakan nomor WhatsApp Indonesia yang valid.');

  await setInput('Nama lengkap', 'Sinta Rahma');
  await setInput('Nomor WhatsApp', '081234567890');
  await clickButton('Review Booking');
  await waitForText('Cek sekali lagi.');

  const review = await evaluate(`document.body.innerText`);
  for (const expected of ['Haircut + Wash', 'Dimas', 'Min, 13 Sep 2026 · 18.15', 'Sinta Rahma', 'Rp85.000']) {
    if (!review.includes(expected)) throw new Error(`Review tidak memuat: ${expected}`);
  }

  await clickButton('Bayar Rp85.000');
  await waitForText('Pilih metode bayar');
  await clickButton('Virtual Account');
  await clickButton('Bayar Rp85.000');
  await waitForText('Booking berhasil.', 4000);

  const success = await evaluate(`document.body.innerText`);
  for (const expected of ['BOOKING #GB-0912-1055', 'Haircut + Wash', 'Dimas', 'Confirmed · Paid']) {
    if (!success.includes(expected)) throw new Error(`Halaman sukses tidak memuat: ${expected}`);
  }

  process.stdout.write(`Booking smoke test passed. ${JSON.stringify(initialLayout)}\n`);
} finally {
  socket.close();
}
