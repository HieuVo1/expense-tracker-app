import { DashboardContent } from 'src/layouts/dashboard';

import { listAssets } from '../actions/asset-actions';
import { AssetListClient } from './asset-list-client';
import { getUserRiskProfile } from '../actions/risk-profile-actions';

// Server component — fetches data + user's risk profile, then hands off to
// the client wrapper which owns dialog/delete state.
export async function AssetListView() {
  const [assets, riskProfile] = await Promise.all([listAssets(), getUserRiskProfile()]);

  return (
    <DashboardContent>
      <AssetListClient assets={assets} initialRiskProfile={riskProfile} />
    </DashboardContent>
  );
}
