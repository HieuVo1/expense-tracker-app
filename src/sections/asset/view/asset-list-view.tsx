import { DashboardContent } from 'src/layouts/dashboard';

import { AssetListClient } from './asset-list-client';
import { getUserRiskProfile } from '../actions/risk-profile-actions';
import { listAssets, getCashTransactionDelta } from '../actions/asset-actions';

// Server component — fetches assets, user's risk profile, and net cash delta
// (income−expense since latest CASH updatedAt). Client owns dialog state.
export async function AssetListView() {
  const [assets, riskProfile, cashDelta] = await Promise.all([
    listAssets(),
    getUserRiskProfile(),
    getCashTransactionDelta(),
  ]);

  return (
    <DashboardContent>
      <AssetListClient
        assets={assets}
        initialRiskProfile={riskProfile}
        cashDelta={cashDelta}
      />
    </DashboardContent>
  );
}
