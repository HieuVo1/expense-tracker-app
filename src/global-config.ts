import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

export type ConfigValue = {
  appName: string;
  appVersion: string;
  assetsDir: string;
  isStaticExport: boolean;
  auth: {
    skip: boolean;
    redirectPath: string;
  };
  supabase: { url: string; anonKey: string };
};

export const CONFIG: ConfigValue = {
  appName: 'Expense Tracker',
  appVersion: packageJson.version,
  assetsDir: process.env.NEXT_PUBLIC_ASSETS_DIR ?? '',
  isStaticExport: JSON.parse(process.env.BUILD_STATIC_EXPORT ?? 'false'),
  auth: {
    skip: false,
    redirectPath: paths.dashboard.root,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};
