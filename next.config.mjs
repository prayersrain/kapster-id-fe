/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    const appUrl = process.env.APP_URL || 'http://127.0.0.1:5173';
    return ['login', 'register', 'verify-email', 'forgot-password', 'reset-password', 'booking', 'owner', 'kasir', 'cashier', 'admin', 'onboarding', 'approval', 'subscription'].map(route => ({
      source: `/${route}/:path*`, destination: `${appUrl}/${route}/:path*`, permanent: false
    }));
  }
};
export default nextConfig;
