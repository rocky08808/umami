'use client';
import { Button, Column, Row, Text, TextField } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/common/CopyButton';
import { DateDistance } from '@/components/common/DateDistance';
import { RechargeOrderStatusBadge } from '@/app/(main)/settings/recharge/RechargeOrderStatusBadge';
import { truncateMiddle } from './rechargeOrderUtils';
import { useRechargeOrderReview } from './useRechargeOrderReview';

export function AdminRechargeOrdersCards({ data = [] }: { data: any[] }) {
  const t = useTranslations();
  const { note, setNote, loadingId, reviewOrder } = useRechargeOrderReview();

  return (
    <Column gap="3">
      {data.map((row: any) => (
        <Column
          key={row.id}
          gap="3"
          padding="4"
          border
          borderRadius
          backgroundColor="surface-base"
        >
          <Row justifyContent="space-between" alignItems="flex-start" gap="3" wrap="wrap">
            <Column gap="1" style={{ minWidth: 0, flex: 1 }}>
              <Text weight="bold">{row.orderNo}</Text>
              <Text color="muted" size="sm">
                {row.user?.username}
              </Text>
            </Column>

            <Column gap="1" alignItems="flex-end">
              <RechargeOrderStatusBadge status={row.status} />
              <Text color="muted" size="sm">
                <DateDistance date={new Date(row.createdAt)} />
              </Text>
            </Column>
          </Row>

          <Row gap="4" wrap="wrap">
            <Column gap="1" style={{ minWidth: 140 }}>
              <Text color="muted" size="sm">
                {t('recharge.plan')}
              </Text>
              <Text>{t(`billing.plan-${row.plan}`)}</Text>
            </Column>

            <Column gap="1" style={{ minWidth: 120 }}>
              <Text color="muted" size="sm">
                {t('recharge.amount')}
              </Text>
              <Text>
                {row.amount} {row.currency}
              </Text>
            </Column>

            <Column gap="1" style={{ minWidth: 0, flex: 1 }}>
              <Text color="muted" size="sm">
                {t('recharge.tx-id')}
              </Text>
              <Row alignItems="center" gap="1" overflow="hidden">
                <Text truncate title={row.txId}>
                  {truncateMiddle(row.txId)}
                </Text>
                <CopyButton value={row.txId} />
              </Row>
            </Column>
          </Row>

          <TextField
            value={note[row.id] || ''}
            onChange={value => setNote(current => ({ ...current, [row.id]: value }))}
            placeholder={t('recharge.admin-note')}
          />

          <Row justifyContent="flex-end" gap="2">
            <Button
              variant="quiet"
              onPress={() => reviewOrder(row.id, 'reject')}
              isDisabled={loadingId === row.id}
            >
              {t('recharge.reject')}
            </Button>
            <Button
              variant="primary"
              onPress={() => reviewOrder(row.id, 'approve')}
              isDisabled={loadingId === row.id}
            >
              {t('recharge.approve')}
            </Button>
          </Row>
        </Column>
      ))}
    </Column>
  );
}
