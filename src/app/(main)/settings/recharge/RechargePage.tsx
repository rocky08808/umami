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
import Link from '@/components/common/Link';
import {
  useApi,
  useConfig,
  useLoginQuery,
  useModified,
  useNavigation,
  useRechargeOrdersQuery,
  useWalletQuery,
} from '@/components/hooks';
import {
  RECHARGE_AMOUNT_OPTIONS,
  RECHARGE_MAX_AMOUNT,
  RECHARGE_MAX_PENDING_ORDERS_PER_USER,
  RECHARGE_MIN_AMOUNT,
  RECHARGE_ORDER_STATUS,
  formatAmountDisplay,
  normalizeTxId,
  parseRechargeAmount,
  planToRechargeAmount,
  sanitizeRechargeAmountInput,
} from '@/lib/recharge';
import { RechargeOrdersList } from './RechargeOrdersList';
import { WalletAddressQrCode } from './WalletAddressQrCode';

export function RechargePage() {
  const t = useTranslations();
  const { renderUrl } = useNavigation();
  const searchParams = useSearchParams();
  const config = useConfig();
  const { user } = useLoginQuery();
  const { post } = useApi();
  const { toast } = useToast();
  const { touch } = useModified('recharge-orders');
  const { data: orders = [] } = useRechargeOrdersQuery();
  const { data: wallet } = useWalletQuery();
  const [amountInput, setAmountInput] = useState(String(RECHARGE_AMOUNT_OPTIONS[0].amount));
  const [txId, setTxId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const amountParam = searchParams.get('amount');
    const planParam = searchParams.get('plan');
    const amount = amountParam
      ? parseRechargeAmount(amountParam)
      : planParam
        ? planToRechargeAmount(planParam)
        : null;

    if (amount != null) {
      setAmountInput(String(amount));
    }
  }, [searchParams]);

  const rechargeAmount = parseRechargeAmount(amountInput);
  const amountInvalid = amountInput.trim() !== '' && rechargeAmount == null;
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
      if (rechargeAmount == null) {
        return;
      }

      await post('/recharge/orders', {
        amount: rechargeAmount,
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

        {wallet && (
          <Row alignItems="center" gap="2">
            <Text color="muted">
              {t('balance.current-balance')}: {formatAmountDisplay(wallet.balance)} {wallet.currency}
            </Text>
            <Link href={renderUrl('/settings/balance', false)}>
              <Text color="primary">{t('balance.title')}</Text>
            </Link>
          </Row>
        )}

        <Grid columns={{ base: '1fr', lg: '1fr 1.2fr' }} gap="4" alignItems="start">
          <Panel title={t('recharge.select-amount')}>
            <Column gap="4">
              <Column gap="1">
                <Label>{t('recharge.amount')}</Label>
                <TextField
                  value={amountInput}
                  onChange={value => setAmountInput(sanitizeRechargeAmountInput(value))}
                  placeholder={t('recharge.amount-placeholder')}
                />
                <Text color="muted" size="sm">
                  {t('recharge.amount-range', {
                    min: RECHARGE_MIN_AMOUNT,
                    max: RECHARGE_MAX_AMOUNT,
                  })}
                </Text>
                {amountInvalid && (
                  <Text color="red" size="sm">
                    {t('recharge.invalid-amount')}
                  </Text>
                )}
              </Column>

              <Column gap="2">
                <Text color="muted" size="sm">
                  {t('recharge.quick-amounts')}
                </Text>
                <Row gap="2" style={{ flexWrap: 'wrap' }}>
                  {RECHARGE_AMOUNT_OPTIONS.map(item => {
                    const isSelected = rechargeAmount === item.amount;

                    return (
                      <Button
                        key={item.amount}
                        variant={isSelected ? 'primary' : 'outline'}
                        onPress={() => setAmountInput(String(item.amount))}
                      >
                        {item.amount} USDT
                      </Button>
                    );
                  })}
                </Row>
              </Column>
            </Column>
          </Panel>

          <Panel title={t('recharge.payment-info')}>
            <Column gap="4">
              <Column gap="1">
                <Label>{t('recharge.amount')}</Label>
                <Text size="2xl" weight="bold">
                  {rechargeAmount != null ? `${formatAmountDisplay(rechargeAmount)} USDT` : '—'}
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
                <Text color="red" size="sm">
                  {t('recharge.order-limit-reached', { limit: RECHARGE_MAX_PENDING_ORDERS_PER_USER })}
                </Text>
              )}

              <Button
                variant="primary"
                onPress={handleConfirmPayment}
                isDisabled={
                  !walletAddress
                  || !txId.trim()
                  || submitting
                  || orderLimitReached
                  || rechargeAmount == null
                }
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
