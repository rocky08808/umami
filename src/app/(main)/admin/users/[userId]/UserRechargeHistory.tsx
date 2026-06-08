'use client';
import { Column, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { DateDistance } from '@/components/common/DateDistance';
import { DataGrid } from '@/components/common/DataGrid';
import { Panel } from '@/components/common/Panel';
import {
  useAdminUserRechargeOrdersQuery,
  useAdminUserWalletQuery,
} from '@/components/hooks';
import { formatAmountDisplay } from '@/lib/recharge';
import { WALLET_TRANSACTION_TYPE } from '@/lib/wallet-constants';
import { UserRechargeOrdersTable } from './UserRechargeOrdersTable';

export function UserRechargeHistory({ userId }: { userId: string }) {
  const t = useTranslations();
  const tBalance = useTranslations('balance');
  const ordersQuery = useAdminUserRechargeOrdersQuery(userId);
  const { data: wallet, isFetching } = useAdminUserWalletQuery(userId);
  const transactions = wallet?.transactions ?? [];

  return (
    <Column gap="4">
      <Panel title={tBalance('current-balance')}>
        <Text size="xl" weight="bold">
          {isFetching
            ? '…'
            : `${formatAmountDisplay(wallet?.balance ?? 0)} ${wallet?.currency || 'USDT'}`}
        </Text>
      </Panel>

      <Panel title={t('admin.user-recharge-orders')}>
        <DataGrid query={ordersQuery}>
          {({ data }) =>
            data?.length ? (
              <UserRechargeOrdersTable data={data} />
            ) : (
              <Text color="muted">{t('admin.user-recharge-orders-empty')}</Text>
            )
          }
        </DataGrid>
      </Panel>

      <Panel title={t('admin.user-wallet-credits')}>
        {!transactions.length ? (
          <Text color="muted">{tBalance('no-transactions')}</Text>
        ) : (
          <Column gap="3">
            {transactions.map((transaction: any) => {
              const isCredit = transaction.type === WALLET_TRANSACTION_TYPE.credit;

              return (
                <Row
                  key={transaction.id}
                  justifyContent="space-between"
                  alignItems="center"
                  paddingY="2"
                  border="bottom"
                >
                  <Column gap="1">
                    <Text weight="bold">
                      {transaction.description || tBalance(`type-${transaction.type}`)}
                    </Text>
                    <Text color="muted" size="sm">
                      <DateDistance date={new Date(transaction.createdAt)} />
                    </Text>
                  </Column>
                  <Column gap="1" alignItems="flex-end">
                    <Text weight="bold" color={isCredit ? 'green' : 'red'}>
                      {isCredit ? '+' : '-'}
                      {transaction.amount} {transaction.currency}
                    </Text>
                    <Text color="muted" size="sm">
                      {tBalance('balance-after', {
                        amount: formatAmountDisplay(transaction.balanceAfter),
                      })}
                    </Text>
                  </Column>
                </Row>
              );
            })}
          </Column>
        )}
      </Panel>
    </Column>
  );
}
