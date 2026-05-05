import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

// ----------------------------------------------------------------------

type PlanProgressBarProps = {
  doneCount: number;
  totalCount: number;
  progress: number;
};

export function PlanProgressBar({ doneCount, totalCount, progress }: PlanProgressBarProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" className="tabular">
          {doneCount}/{totalCount} nhiệm vụ
        </Typography>
        <Typography variant="caption" color="text.secondary" className="tabular">
          {progress}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}
