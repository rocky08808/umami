'use client';
import {
  Button,
  Column,
  Grid,
  Loading,
  Row,
  Text,
  useToast,
} from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from '@/components/common/Link';
import { DateDistance } from '@/components/common/DateDistance';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import {
  useApi,
  useBillingUsageQuery,
  useModified,
  useNavigation,
  useWalletQuery,
} from '@/components/hooks';
import { canSubscribeToPlan, type PlanId } from '@/lib/billing';
import {
  RECHARGE_OPTIONS,
  RECHARGE_SUBSCRIPTION_DAYS,
  formatAmountDisplay,
  getRechargeOption,
} from '@/lib/recharge';
import { WALLET_TRANSACTION_TYPE } from '@/lib/wallet-constants';

type SubscribePlan = (typeof RECHARGE_OPTIONS)[number]['plan'];

export function BalancePage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { renderUrl } = useNavigation();
  const { post } = useApi();
  const { toast } = useToast();
  const { touch } = useModified('wallet');
  const { data, isLoading } = useWalletQuery();
  const { data: usage } = useBillingUsageQuery();
  const [selectedPlan, setSelectedPlan] = useState<SubscribePlan>(RECHARGE_OPTIONS[0].plan);
  const [submitting, setSubmitting] = useState(false);

  const subscription = usage?.subscription ?? { plan: 'hobby' as PlanId, expired: false };
  const isPlanAllowed = (plan: PlanId) => canSubscribeToPlan(subscription, plan);

  useEffect(() => {
    const plan = searchParams.get('plan');
    const requestedPlan = plan && getRechargeOption(plan) ? (plan as SubscribePlan) : null;

    if (requestedPlan && isPlanAllowed(requestedPlan)) {
      setSelectedPlan(requestedPlan);
      return;
    }

    if (!isPlanAllowed(selectedPlan)) {
      const fallback = RECHARGE_OPTIONS.find(item => isPlanAllowed(item.plan));
      if (fallback) {
        setSelectedPlan(fallback.plan);
      }
    }
  }, [searchParams, subscription.plan, subscription.expired, selectedPlan]);

  const option = getRechargeOption(selectedPlan) || RECHARGE_OPTIONS[0];
  const balance = data?.balance ?? 0;
  const currency = data?.currency ?? 'USDT';
  const transactions = data?.transactions ?? [];
  const insufficientBalance = balance < option.amount;
  const planNotAllowed = !isPlanAllowed(selectedPlan);

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
        <Column position="relative" height="100%" width="100%">
          <Loading />
        </Column>
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
                  {formatAmountDisplay(balance)}
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
                const allowed = isPlanAllowed(item.plan);

                return (
                  <Row
                    key={item.plan}
                    padding="4"
                    border
                    borderRadius
                    alignItems="center"
                    justifyContent="space-between"
                    backgroundColor={isSelected ? 'surface-sunken' : undefined}
                    style={{ cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed ? 1 : 0.5 }}
                    onClick={() => allowed && setSelectedPlan(item.plan)}
                  >
                    <Column gap="1">
                      <Text weight="bold">{t(item.nameKey)}</Text>
                      <Text color="muted">
                        {t('recharge.valid-days', { days: RECHARGE_SUBSCRIPTION_DAYS })}
                      </Text>
                      {!allowed && (
                        <Text color="red" size="sm">
                          {t('balance.business-active')}
                        </Text>
                      )}
                    </Column>
                    <Text size="xl" weight="bold">
                      {formatAmountDisplay(item.amount)} {currency}
                    </Text>
                  </Row>
                );
              })}

              {insufficientBalance && (
                <Text color="red" size="sm">
                  {t('balance.insufficient-balance')}
                </Text>
              )}

              {planNotAllowed && (
                <Text color="red" size="sm">
                  {t('balance.business-active')}
                </Text>
              )}

              <Button
                variant="primary"
                onPress={handleSubscribe}
                isDisabled={submitting || insufficientBalance || planNotAllowed}
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
                        {t('balance.balance-after', { amount: formatAmountDisplay(transaction.balanceAfter) })}
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
