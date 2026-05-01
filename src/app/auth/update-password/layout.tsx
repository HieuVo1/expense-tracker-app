import { AuthCenteredLayout } from 'src/layouts/auth-centered';

type Props = {
  children: React.ReactNode;
};

// No GuestGuard — this page handles BOTH flows:
//   1. Forgot-password recovery (anonymous, token in URL).
//   2. Logged-in user changing their own password from Settings.
export default function Layout({ children }: Props) {
  return <AuthCenteredLayout>{children}</AuthCenteredLayout>;
}
