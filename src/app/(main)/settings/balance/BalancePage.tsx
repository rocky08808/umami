'use client';
import {
  Button,
  Column,
  Grid,
  Row,
  Text,
  useToast,
} from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Link from '@/components/common/Link';
import { DateDistance } from '@/components/common/DateDistance';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useApi, useModified, useNavigation, useWalletQuery } from '@/components/hooks';
import {
  RECHARGE_OPTIONS,
  RECHARGE_SUBSCRIPTION_DAYS,
  getRechargeOption,
} from '@/lib/recharge';
import { WALLET_TRANSACTION_TYPE } from '@/lib/wallet-constants';

export function BalancePage() {
  const t = useTranslations();
  const { renderUrl } = useNavigation();
  const { post } = useApi();
  const { toast } = useToast();
  const { touch } = useModified('wallet');
  const { data, isLoading } = useWalletQuery();
  const [selectedPlan, setSelectedPlan] = useState(RECHARGE_OPTIONS[0].plan);
  const [submitting, setSubmitting] = useState(false);

  const option = getRechargeOption(selectedPlan) || RECHARGE_OPTIONS[0];
  const balance = data?.balance ?? 0;
  const currency = data?.currency ?? 'USDT';
  const transactions = data?.transactions ?? [];
  const insufficientBalance = balance < option.amount;

  const handleSubscribe = async () => {
    setSubmitting(true);

    try {
      await post('/wallet/subscribe', { plan: selectedPlan });
      toast(t('balance.subscribe-success'));
      touch('wallet');
    } catch (e: any) {
      toast(
        (e.code && t(`balance.${e.code}`)) || e.message || t('balance.subscribe-error'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageBody>
        <LoadingPanel />
      </PageBody>
    );
  }

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader
          title={t('balance.title')}
          description={t('balance.description')}
          showBorder={false}
        />

        <Grid columns={{ base: '1fr', lg: '1fr 1.2fr' }} gap="4" alignItems="start">
          <Panel title={t('balance.current-balance')}>
            <Column gap="4">
              <Row alignItems="baseline" gap="2">
                <Text size="3xl" weight="bold">
                  {balance}
                </Text>
                <Text size="xl" color="muted">
                  {currency}
                </Text>
              </Row>
              <Text color="muted">{t('balance.balance-hint')}</Text>
              <Link href={renderUrl('/settings/recharge', false)}>
                <Text color="primary">{t('balance.recharge-link')}</Text>
              </Link>
            </Column>
          </Panel>

          <Panel title={t('balance.subscribe-with-balance')}>
            <Column gap="3">
              <Text color="muted">{t('balance.subscribe-description')}</Text>
              {RECHARGE_OPTIONS.map(item => {
                const isSelected = item.plan === selectedPlan;

                return (
                  <Row
                    key={item.plan}
                    padding="4"
                    border
                    borderRadius
                    alignItems="center"
                    justifyContent="space-between"
                    backgroundColor={isSelected ? 'surface-sunken' : undefined}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPlan(item.plan)}
                  >
                    <Column gap="1">
                      <Text weight="bold">{t(item.nameKey)}</Text>
                      <Text color="muted">
                        {t('recharge.valid-days', { days: RECHARGE_SUBSCRIPTION_DAYS })}
                      </Text>
                    </Column>
                    <Text size="xl" weight="bold">
                      {item.amount} {currency}
                    </Text>
                  </Row>
                );
              })}

              {insufficientBalance && (
                <Text color="red" size="sm">
                  {t('balance.insufficient-balance')}
                </Text>
              )}

              <Button
                variant="primary"
                onPress={handleSubscribe}
                isDisabled={submitting || insufficientBalance}
              >
                {t('balance.subscribe-button')}
              </Button>
            </Column>
          </Panel>
        </Grid>

        <Panel title={t('balance.transactions')}>
          {!transactions.length ? (
            <Text color="muted">{t('balance.no-transactions')}</Text>
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
                        {transaction.description || t(`balance.type-${transaction.type}`)}
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
                        {t('balance.balance-after', { amount: transaction.balanceAfter })}
                      </Text>
                    </Column>
                  </Row>
                );
              })}
            </Column>
          )}
        </Panel>
      </Column>
    </PageBody>
  );
}
