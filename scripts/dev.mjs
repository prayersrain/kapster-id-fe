import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
const commands = [
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1'],
  ['node_modules/vite/bin/vite.js', '--config', 'apps/web/vite.config.ts'],
  ['apps/api/dist/main.js'],
];
for (const port of [3000, 4000, 5173]) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () =>
      reject(new Error(`Port ${port} sedang dipakai. Tutup server sebelumnya sebelum npm run dev.`)),
    );
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'apps/api/tsconfig.json'], {
    stdio: 'inherit',
  });
  child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('Build API gagal'))));
});
const children = commands.map((args) => spawn(process.execPath, args, { stdio: 'inherit' }));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => {
    if (!child.pid || child.exitCode !== null) return;
    if (process.platform === 'win32')
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill();
  });
  process.exitCode = code;
}
children.forEach((child) => {
  child.on('error', () => stop(1));
  child.on('exit', (code) => stop(code ?? 0));
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
console.log(
  '\nLanding: http://127.0.0.1:3000\nAplikasi: http://127.0.0.1:5173\nBooking publik: http://127.0.0.1:5173/booking\nAkun lokal: npm run local:accounts\n',
);
