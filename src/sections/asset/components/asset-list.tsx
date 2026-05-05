import type { AssetRow } from '../types';

import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { AssetListItem } from './asset-list-item';

type Props = {
  assets: AssetRow[];
  onEdit: (asset: AssetRow) => void;
  onDelete: (asset: AssetRow) => void;
};

export function AssetList({ assets, onEdit, onDelete }: Props) {
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Typography variant="subtitle1" sx={{ px: 2.5, py: 2 }}>
        Danh sách
      </Typography>
      {assets.map((asset) => (
        <AssetListItem
          key={asset.id}
          asset={asset}
          onEdit={() => onEdit(asset)}
          onDelete={() => onDelete(asset)}
        />
      ))}
    </Card>
  );
}
