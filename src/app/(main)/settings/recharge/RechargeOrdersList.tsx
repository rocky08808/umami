'use client';
import { Column, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { DateDistance } from '@/components/common/DateDistance';
import { Panel } from '@/components/common/Panel';
import { useRechargeOrdersQuery } from '@/components/hooks';
import { RechargeOrderStatusBadge } from './RechargeOrderStatusBadge';

export function RechargeOrdersList() {
  const t = useTranslations();
  const { data: orders = [], isLoading } = useRechargeOrdersQuery();

  if (isLoading || !orders.length) {
    return null;
  }

  return (
    <Panel title={t('recharge.my-orders')}>
      <Column gap="3">
        {orders.slice(0, 10).map((order: any) => (
          <Row
            key={order.id}
            justifyContent="space-between"
            alignItems="center"
            paddingY="2"
            border="bottom"
          >
            <Column gap="1">
              <Text weight="bold">{order.orderNo}</Text>
              <Text color="muted" size="sm">
                {t(`billing.plan-${order.plan}`)} · {order.amount} {order.currency}
              </Text>
              <Text color="muted" size="sm" truncate title={order.txId}>
                {order.txId}
              </Text>
              {order.adminNote && (
                <Text color="muted" size="sm">
                  {t('recharge.admin-note-label')}: {order.adminNote}
                </Text>
              )}
            </Column>
            <Column gap="1" alignItems="flex-end">
              <RechargeOrderStatusBadge status={order.status} />
              <Text color="muted" size="sm">
                <DateDistance date={new Date(order.createdAt)} />
              </Text>
            </Column>
          </Row>
        ))}
      </Column>
    </Panel>
  );
}
