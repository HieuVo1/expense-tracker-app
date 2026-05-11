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
    spending: `${ROOTS.DASHBOARD}/spending`,
    transactions: `${ROOTS.DASHBOARD}/transactions`,
    addTransaction: `${ROOTS.DASHBOARD}/transactions/new`,
    budgets: `${ROOTS.DASHBOARD}/budgets`,
    categories: `${ROOTS.DASHBOARD}/categories`,
    assets: `${ROOTS.DASHBOARD}/assets`,
    notes: `${ROOTS.DASHBOARD}/notes`,
    plans: `${ROOTS.DASHBOARD}/plans`,
    planDetail: (id: string) => `${ROOTS.DASHBOARD}/plans/${id}`,
    subscriptions: `${ROOTS.DASHBOARD}/subscriptions`,
    settings: `${ROOTS.DASHBOARD}/settings`,
    aboutMe: `${ROOTS.DASHBOARD}/about-me`,
    aboutMeType: (type: string) => `${ROOTS.DASHBOARD}/about-me/${type.toLowerCase()}`,
  },
};
