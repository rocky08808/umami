'use client';
import { Column, ListItem, Row, Select } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';
import { AdminRechargeOrdersDataTable } from './AdminRechargeOrdersDataTable';

export function AdminRechargePage() {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] = useState(RECHARGE_ORDER_STATUS.pending);

  const statuses = [
    RECHARGE_ORDER_STATUS.pending,
    RECHARGE_ORDER_STATUS.approved,
    RECHARGE_ORDER_STATUS.rejected,
  ];

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader title={t('recharge.admin-title')} showBorder={false} />

        <Panel>
          <Column gap="4">
            <Row>
              <Select
                value={statusFilter}
                onChange={value => setStatusFilter(value as string)}
                style={{ minWidth: 220 }}
              >
                {statuses.map(status => (
                  <ListItem key={status} id={status}>
                    {t(`recharge.status-${status}`)}
                  </ListItem>
                ))}
              </Select>
            </Row>

            <AdminRechargeOrdersDataTable status={statusFilter} />
          </Column>
        </Panel>
      </Column>
    </PageBody>
  );
}
