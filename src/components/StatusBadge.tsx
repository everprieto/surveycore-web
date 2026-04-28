import { Chip } from '@mui/material';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'primary' | 'error' | 'warning' | 'info'> = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  ACTIVE: 'primary',
  CLOSED: 'error',
  PENDING: 'warning',
  OPENED: 'info',
  COMPLETED: 'success',
  SENT: 'primary',
};

interface Props {
  status: string;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, size = 'small' }: Props) {
  return (
    <Chip
      label={status}
      color={STATUS_COLORS[status] ?? 'default'}
      size={size}
    />
  );
}
