'use client';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/common/Badge';
import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';

const STATUS_VARIANT = {
  [RECHARGE_ORDER_STATUS.pending]: 'warning',
  [RECHARGE_ORDER_STATUS.approved]: 'good',
  [RECHARGE_ORDER_STATUS.rejected]: 'danger',
} as const;

export function RechargeOrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const variant = STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? 'gray';

  return <Badge variant={variant}>{t(`recharge.status-${status}`)}</Badge>;
}
