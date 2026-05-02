import 'src/global.css';

import type { Metadata, Viewport } from 'next';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import { themeConfig, ThemeProvider, primary as primaryColor } from 'src/theme';

import { Snackbar } from 'src/components/snackbar';
import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { detectSettings } from 'src/components/settings/server';
import { LocalizationProvider } from 'src/components/localization/localization-provider';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/supabase';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // viewportFit: cover lets standalone PWA paint into the iOS notch / safe area.
  viewportFit: 'cover',
  themeColor: primaryColor.main,
};

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Theo dõi chi tiêu cá nhân',
  applicationName: 'Chi tiêu',
  manifest: '/manifest.webmanifest',
  icons: [
    // PNG favicons override the old .ico — browsers pick the highest-res
    // matching one. Keep .ico as legacy fallback for tools that don't read PNG.
    { rel: 'icon', url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { rel: 'icon', url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
    { rel: 'shortcut icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png', sizes: '180x180' },
  ],
  // iOS-specific: enables "Add to Home Screen" → standalone launch + native
  // splash / status bar styling. Without these, iOS opens the URL in Safari.
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chi tiêu',
  },
  formatDetection: { telephone: false },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieSettings = await detectSettings();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript
          modeStorageKey={themeConfig.modeStorageKey}
          attribute={themeConfig.cssVariables.colorSchemeSelector}
          defaultMode={themeConfig.defaultMode}
        />

        <AuthProvider>
          <SettingsProvider defaultSettings={defaultSettings} cookieSettings={cookieSettings}>
            <AppRouterCacheProvider options={{ key: 'css' }}>
              <ThemeProvider
                modeStorageKey={themeConfig.modeStorageKey}
                defaultMode={themeConfig.defaultMode}
              >
                <LocalizationProvider>
                  <MotionLazy>
                    <Snackbar />
                    <ProgressBar />
                    <SettingsDrawer defaultSettings={defaultSettings} />
                    {children}
                  </MotionLazy>
                </LocalizationProvider>
              </ThemeProvider>
            </AppRouterCacheProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
