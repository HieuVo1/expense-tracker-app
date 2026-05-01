'use client';

import { paths } from 'src/routes/paths';

import { EmailInboxIcon } from 'src/assets/icons';

import { FormHead } from '../../components/form-head';
import { FormReturnLink } from '../../components/form-return-link';

// ----------------------------------------------------------------------

export function SupabaseVerifyView() {
  return (
    <>
      <FormHead
        icon={<EmailInboxIcon />}
        title="Vui lòng kiểm tra email!"
        description="Chúng tôi đã gửi link xác nhận tới email của bạn. Mở email và bấm vào link để hoàn tất."
      />

      <FormReturnLink href={paths.auth.signIn} sx={{ mt: 0 }} />
    </>
  );
}
