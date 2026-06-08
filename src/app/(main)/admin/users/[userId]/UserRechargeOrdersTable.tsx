'use client';
import { Column, DataColumn, DataTable, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/common/CopyButton';
import { DateDistance } from '@/components/common/DateDistance';
import { RechargeOrderStatusBadge } from '@/app/(main)/settings/recharge/RechargeOrderStatusBadge';
import { truncateMiddle } from '@/app/(main)/admin/recharge/rechargeOrderUtils';
import {
  formatAmountDisplay,
  formatPayAmount,
  isAutoRechargeTxId,
} from '@/lib/recharge';

export function UserRechargeOrdersTable({ data = [] }: { data: any[] }) {
  const t = useTranslations();

  return (
    <DataTable data={data}>
      <DataColumn id="order" label={t('recharge.order-no')} width="1.2fr">
        {(row: any) => <Text weight="bold">{row.orderNo}</Text>}
      </DataColumn>
      <DataColumn id="plan" label={t('recharge.credit-amount')} width="1fr">
        {(row: any) => (
          <Column gap="1">
            <Text>{formatAmountDisplay(row.amount)} {row.currency}</Text>
            {row.payAmount != null && Number(row.payAmount) !== Number(row.amount) && (
              <Text color="muted" size="sm">
                {t('recharge.pay-amount-short', { amount: formatPayAmount(row.payAmount) })}
              </Text>
            )}
          </Column>
        )}
      </DataColumn>
      <DataColumn id="txId" label={t('recharge.tx-id')} width="1.4fr">
        {(row: any) => (
          <Row alignItems="center" gap="1" overflow="hidden">
            <Text truncate title={row.txId}>
              {isAutoRechargeTxId(row.txId) && row.status === 'pending'
                ? t('recharge.auto-waiting')
                : truncateMiddle(row.txId)}
            </Text>
            {!isAutoRechargeTxId(row.txId) && <CopyButton value={row.txId} />}
          </Row>
        )}
      </DataColumn>
      <DataColumn id="status" label={t('recharge.status')} width="0.8fr">
        {(row: any) => <RechargeOrderStatusBadge status={row.status} />}
      </DataColumn>
      <DataColumn id="adminNote" label={t('recharge.admin-note-label')} width="1fr">
        {(row: any) =>
          row.adminNote ? (
            <Text truncate title={row.adminNote}>
              {row.adminNote}
            </Text>
          ) : (
            <Text color="muted">—</Text>
          )
        }
      </DataColumn>
      <DataColumn id="created" label={t('label.created')} width="0.8fr" align="end">
        {(row: any) => (
          <Text color="muted" size="sm">
            <DateDistance date={new Date(row.createdAt)} />
          </Text>
        )}
      </DataColumn>
    </DataTable>
  );
}
