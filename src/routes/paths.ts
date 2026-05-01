const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

export const paths = {
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',

  auth: {
    signIn: `${ROOTS.AUTH}/sign-in`,
    signUp: `${ROOTS.AUTH}/sign-up`,
    verify: `${ROOTS.AUTH}/verify`,
    resetPassword: `${ROOTS.AUTH}/reset-password`,
    updatePassword: `${ROOTS.AUTH}/update-password`,
  },

  dashboard: {
    root: ROOTS.DASHBOARD,
    transactions: `${ROOTS.DASHBOARD}/transactions`,
    addTransaction: `${ROOTS.DASHBOARD}/transactions/new`,
    reports: `${ROOTS.DASHBOARD}/reports`,
    budgets: `${ROOTS.DASHBOARD}/budgets`,
    categories: `${ROOTS.DASHBOARD}/categories`,
    settings: `${ROOTS.DASHBOARD}/settings`,
  },
};
