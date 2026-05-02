'use server';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';
import { createClient } from 'src/lib/supabase/server';
import { requireUser } from 'src/lib/auth-helpers';

import { RISK_PROFILE_VALUES, type RiskProfile } from '../constants/risk-profiles';

const RISK_KEY = 'risk_profile';

function isValidProfile(value: unknown): value is RiskProfile {
  return typeof value === 'string' && (RISK_PROFILE_VALUES as string[]).includes(value);
}

export async function getUserRiskProfile(): Promise<RiskProfile | null> {
  const user = await requireUser();
  const value = (user.user_metadata as Record<string, unknown> | null)?.[RISK_KEY];
  return isValidProfile(value) ? value : null;
}

export async function setUserRiskProfile(profile: RiskProfile): Promise<void> {
  await requireUser();

  if (!isValidProfile(profile)) {
    throw new Error('Hồ sơ rủi ro không hợp lệ');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { [RISK_KEY]: profile },
  });

  if (error) {
    throw new Error(error.message || 'Cập nhật hồ sơ thất bại');
  }

  revalidatePath(paths.dashboard.assets);
}
