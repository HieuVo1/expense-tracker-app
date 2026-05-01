import type { MetadataRoute } from 'next';

// Web App Manifest — picked up by Next.js at /manifest.webmanifest. Drives
// "Add to Home Screen" install on Android/Chrome and the icon shown there.
// iOS uses apple-touch-icon + apple-mobile-web-app-* meta tags from the
// root layout; this file is mostly for Android.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Expense Tracker',
    short_name: 'Chi tiêu',
    description: 'Theo dõi chi tiêu cá nhân — quét hoá đơn / lịch sử ngân hàng bằng AI.',
    // Standalone hides the browser chrome so the app feels native after install.
    display: 'standalone',
    // Skip the marketing landing on launch — installed users want their dashboard.
    start_url: '/dashboard',
    scope: '/',
    orientation: 'portrait',
    lang: 'vi',
    background_color: '#fdf8f8',
    theme_color: '#1a1a1a',
    // Maskable variant lets Android crop a circle/rounded-square without
    // chopping the logo edges. Solid bg added with sharp at generation time.
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
