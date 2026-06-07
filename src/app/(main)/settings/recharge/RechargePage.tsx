'use client';
import {
  Button,
  Column,
  Grid,
  Label,
  Row,
  Text,
  TextField,
  useToast,
} from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useApi, useConfig, useLoginQuery, useModified, useRechargeOrdersQuery } from '@/components/hooks';
import {
  RECHARGE_MAX_PENDING_ORDERS_PER_USER,
  RECHARGE_OPTIONS,
  RECHARGE_ORDER_STATUS,
  getRechargeOption,
  normalizeTxId,
} from '@/lib/recharge';
import { RechargeOrdersList } from './RechargeOrdersList';
import { WalletAddressQrCode } from './WalletAddressQrCode';

export function RechargePage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const config = useConfig();
  const { user } = useLoginQuery();
  const { post } = useApi();
  const { toast } = useToast();
  const { touch } = useModified('recharge-orders');
  const { data: orders = [] } = useRechargeOrdersQuery();
  const [selectedPlan, setSelectedPlan] = useState(RECHARGE_OPTIONS[0].plan);
  const [txId, setTxId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan && getRechargeOption(plan)) {
      setSelectedPlan(plan as typeof selectedPlan);
    }
  }, [searchParams]);

  const option = getRechargeOption(selectedPlan) || RECHARGE_OPTIONS[0];
  const walletAddress = config?.usdtWalletAddress || '';
  const network = config?.usdtNetwork || 'TRC20';
  const pendingOrderCount = orders.filter(
    (order: any) => order.status === RECHARGE_ORDER_STATUS.pending,
  ).length;
  const orderLimitReached = pendingOrderCount >= RECHARGE_MAX_PENDING_ORDERS_PER_USER;

  const handleConfirmPayment = async () => {
    const normalizedTxId = normalizeTxId(txId);

    if (!normalizedTxId) {
      return;
    }

    setSubmitting(true);

    try {
      await post('/recharge/orders', {
        plan: selectedPlan,
        txId: normalizedTxId,
        network,
      });
      toast(t('recharge.order-submitted'));
      setTxId('');
      touch('recharge-orders');
    } catch (e: any) {
      toast(
        (e.code && t(`recharge.${e.code}`)) || e.message || t('recharge.order-error'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader
          title={t('recharge.title')}
          description={t('recharge.description')}
          showBorder={false}
        />

        <Grid columns={{ base: '1fr', lg: '1fr 1.2fr' }} gap="4" alignItems="start">
          <Panel title={t('recharge.select-plan')}>
            <Column gap="3">
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
                      <Text color="muted">{t('recharge.valid-days', { days: 30 })}</Text>
                    </Column>
                    <Text size="xl" weight="bold">
                      {item.amount} USDT
                    </Text>
                  </Row>
                );
              })}
            </Column>
          </Panel>

          <Panel title={t('recharge.payment-info')}>
            <Column gap="4">
              <Column gap="1">
                <Label>{t('recharge.amount')}</Label>
                <Text size="2xl" weight="bold">
                  {option.amount} USDT
                </Text>
              </Column>

              <Column gap="1">
                <Label>{t('recharge.network')}</Label>
                <Text weight="bold">{network}</Text>
              </Column>

              <Column gap="2">
                <Label>{t('recharge.wallet-address')}</Label>
                {walletAddress ? (
                  <Column gap="3">
                    <WalletAddressQrCode address={walletAddress} />
                    <TextField value={walletAddress} isReadOnly allowCopy />
                  </Column>
                ) : (
                  <Text color="muted">{t('recharge.wallet-not-configured')}</Text>
                )}
              </Column>

              {user?.username && (
                <Column gap="1">
                  <Label>{t('recharge.account')}</Label>
                  <TextField value={user.username} isReadOnly allowCopy />
                </Column>
              )}

              <Column gap="2">
                <Text color="muted">{t('recharge.step-1')}</Text>
                <Text color="muted">{t('recharge.step-2')}</Text>
                <Text color="muted">{t('recharge.step-3')}</Text>
              </Column>

              <Column gap="1">
                <Label>{t('recharge.tx-id')}</Label>
                <TextField
                  value={txId}
                  onChange={setTxId}
                  placeholder={t('recharge.tx-id-placeholder')}
                />
              </Column>

              {orderLimitReached && (
                <Text color="muted" size="sm">
                  {t('recharge.order-limit-reached', { limit: RECHARGE_MAX_PENDING_ORDERS_PER_USER })}
                </Text>
              )}

              <Button
                variant="primary"
                onPress={handleConfirmPayment}
                isDisabled={!walletAddress || !txId.trim() || submitting || orderLimitReached}
              >
                {t('recharge.submit-payment')}
              </Button>
            </Column>
          </Panel>
        </Grid>

        <RechargeOrdersList />
      </Column>
    </PageBody>
  );
}
