'use client';
import { Column, DataColumn, DataTable, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/common/CopyButton';
import { DateDistance } from '@/components/common/DateDistance';
import { RechargeOrderStatusBadge } from '@/app/(main)/settings/recharge/RechargeOrderStatusBadge';
import { truncateMiddle } from './rechargeOrderUtils';

export function AdminRechargeOrdersTable({ data = [] }: { data: any[] }) {
  const t = useTranslations();

  return (
    <DataTable data={data}>
      <DataColumn id="order" label={t('recharge.order-no')} width="1.4fr">
        {(row: any) => (
          <Column gap="1">
            <Text weight="bold">{row.orderNo}</Text>
            <Text color="muted" size="sm">
              {row.user?.username}
            </Text>
          </Column>
        )}
      </DataColumn>
      <DataColumn id="plan" label={t('recharge.plan')} width="1fr">
        {(row: any) => (
          <Column gap="1">
            <Text>{t(`billing.plan-${row.plan}`)}</Text>
            <Text color="muted" size="sm">
              {row.amount} {row.currency}
            </Text>
          </Column>
        )}
      </DataColumn>
      <DataColumn id="txId" label={t('recharge.tx-id')} width="1.6fr">
        {(row: any) => (
          <Row alignItems="center" gap="1" overflow="hidden">
            <Text truncate title={row.txId}>
              {truncateMiddle(row.txId)}
            </Text>
            <CopyButton value={row.txId} />
          </Row>
        )}
      </DataColumn>
      <DataColumn id="status" label={t('recharge.status')} width="0.8fr">
        {(row: any) => <RechargeOrderStatusBadge status={row.status} />}
      </DataColumn>
      <DataColumn id="adminNote" label={t('recharge.admin-note-label')} width="1.2fr">
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
