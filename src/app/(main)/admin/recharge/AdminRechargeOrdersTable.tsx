'use client';
import {
  Button,
  Column,
  DataColumn,
  DataTable,
  Row,
  Text,
  TextField,
  useToast,
} from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DateDistance } from '@/components/common/DateDistance';
import { useApi, useModified } from '@/components/hooks';
import { RechargeOrderStatusBadge } from '@/app/(main)/settings/recharge/RechargeOrderStatusBadge';
import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';

export function AdminRechargeOrdersTable({ data = [] }: { data: any[] }) {
  const t = useTranslations();
  const { post } = useApi();
  const { toast } = useToast();
  const { touch } = useModified('admin-recharge-orders');
  const [note, setNote] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function reviewOrder(orderId: string, action: 'approve' | 'reject') {
    setLoadingId(orderId);

    try {
      await post(`/admin/recharge/orders/${orderId}/${action}`, {
        adminNote: note[orderId],
      });
      toast(t(action === 'approve' ? 'recharge.order-approved' : 'recharge.order-rejected'));
      touch('admin-recharge-orders');
      setNote(current => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
    } catch (e: any) {
      toast(e.message || t('recharge.order-error'));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <DataTable data={data}>
      <DataColumn id="orderNo" label={t('recharge.order-no')} width="1.2fr">
        {(row: any) => <Text weight="bold">{row.orderNo}</Text>}
      </DataColumn>
      <DataColumn id="user" label={t('label.username')}>
        {(row: any) => row.user?.username}
      </DataColumn>
      <DataColumn id="plan" label={t('recharge.plan')}>
        {(row: any) => t(`billing.plan-${row.plan}`)}
      </DataColumn>
      <DataColumn id="amount" label={t('recharge.amount')}>
        {(row: any) => `${row.amount} ${row.currency}`}
      </DataColumn>
      <DataColumn id="txId" label={t('recharge.tx-id')} width="1.5fr">
        {(row: any) => (
          <Text truncate title={row.txId}>
            {row.txId}
          </Text>
        )}
      </DataColumn>
      <DataColumn id="status" label={t('recharge.status')}>
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
      <DataColumn id="created" label={t('label.created')}>
        {(row: any) => <DateDistance date={new Date(row.createdAt)} />}
      </DataColumn>
      <DataColumn id="action" align="end" width="2fr">
        {(row: any) => {
          if (row.status !== RECHARGE_ORDER_STATUS.pending) {
            return null;
          }

          return (
            <Column gap="2" alignItems="stretch">
              <TextField
                value={note[row.id] || ''}
                onChange={value => setNote(current => ({ ...current, [row.id]: value }))}
                placeholder={t('recharge.admin-note')}
              />
              <Row gap="2" justifyContent="flex-end">
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => reviewOrder(row.id, 'approve')}
                  isDisabled={loadingId === row.id}
                >
                  {t('recharge.approve')}
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  onPress={() => reviewOrder(row.id, 'reject')}
                  isDisabled={loadingId === row.id}
                >
                  {t('recharge.reject')}
                </Button>
              </Row>
            </Column>
          );
        }}
      </DataColumn>
    </DataTable>
  );
}
