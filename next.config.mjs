/** @type {import('next').NextConfig} */

// Landing hanya melayani halaman pemasaran. Seluruh rute aplikasi dialihkan ke
// aplikasi React. Secara lokal semuanya menunjuk satu origin Vite; saat di-hosting,
// setiap peran memakai subdomainnya sendiri sehingga tautan lama tetap mendarat
// di tempat yang benar.
const localApp = process.env.APP_URL || 'http://127.0.0.1:5173';
const target = (subdomainEnv) => process.env[subdomainEnv] || localApp;

const ROUTE_TARGETS = {
  login: 'APP_URL_OWNER',
  register: 'APP_URL_OWNER',
  'verify-email': 'APP_URL_OWNER',
  'forgot-password': 'APP_URL_OWNER',
  'reset-password': 'APP_URL_OWNER',
  onboarding: 'APP_URL_OWNER',
  approval: 'APP_URL_OWNER',
  subscription: 'APP_URL_OWNER',
  owner: 'APP_URL_OWNER',
  kasir: 'APP_URL_CASHIER',
  cashier: 'APP_URL_CASHIER',
  admin: 'APP_URL_ADMIN',
  booking: 'APP_URL_BOOKING',
};

const nextConfig = {
  async redirects() {
    return Object.entries(ROUTE_TARGETS).flatMap(([route, envKey]) => {
      const destination = target(envKey);
      return [
        // Tanpa trailing path, misalnya /register
        { source: `/${route}`, destination: `${destination}/${route}`, permanent: false },
        // Dengan trailing path, misalnya /booking/garasi-barber/tebet
        { source: `/${route}/:path*`, destination: `${destination}/${route}/:path*`, permanent: false },
      ];
    });
  },
};

export default nextConfig;
