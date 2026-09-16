import { readFile } from 'node:fs/promises';
const file = process.argv[2] === 'mail' ? '.local/mail.jsonl' : '.local/accounts.json';
try {
  console.log(await readFile(file, 'utf8'));
} catch {
  console.log('Belum ada data lokal. Jalankan npm run dev terlebih dahulu.');
}
