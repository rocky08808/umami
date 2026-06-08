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
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import Link from '@/components/common/Link';
import {
  useApi,
  useConfig,
  useLoginQuery,
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
  isAutoRechargeTxId,
  parseRechargeAmount,
  planToRechargeAmount,
  sanitizeRechargeAmountInput,
} from '@/lib/recharge';
import { touch } from '@/components/hooks/useModified';
import { CustomerServiceNotice } from './CustomerServiceNotice';
import { RechargeOrderCountdown } from './RechargeOrderCountdown';
import { RechargeOrdersList } from './RechargeOrdersList';
import { RechargePayAmountHighlight } from './RechargePayAmountHighlight';
import { WalletAddressQrCode } from './WalletAddressQrCode';

export function RechargePage() {
  const t = useTranslations();
  const { renderUrl } = useNavigation();
  const searchParams = useSearchParams();
  const config = useConfig();
  const { user } = useLoginQuery();
  const { post } = useApi();
  const { toast } = useToast();
  const { data: orders = [], refetch: refetchOrders } = useRechargeOrdersQuery();
  const { data: wallet, refetch: refetchWallet } = useWalletQuery();
  const [amountInput, setAmountInput] = useState(String(RECHARGE_AMOUNT_OPTIONS[0].amount));
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

  const activeOrder = useMemo(() => {
    return orders.find((order: any) => {
      return (
        order.status === RECHARGE_ORDER_STATUS.pending
        && isAutoRechargeTxId(order.txId)
        && order.expiresAt
        && new Date(order.expiresAt) > new Date()
      );
    });
  }, [orders]);

  const activeOrderId = activeOrder?.id;
  const approvedToastShown = useRef(false);

  useEffect(() => {
    approvedToastShown.current = false;
  }, [activeOrderId]);

  useEffect(() => {
    if (!activeOrderId) {
      return undefined;
    }

    let cancelled = false;

    const syncOrder = async () => {
      try {
        await post('/recharge/monitor');
        if (cancelled) {
          return;
        }

        const { data: nextOrders } = await refetchOrders();
        await refetchWallet();

        const updated = nextOrders?.find((order: any) => order.id === activeOrderId);

        if (
          updated?.status === RECHARGE_ORDER_STATUS.approved
          && !approvedToastShown.current
        ) {
          approvedToastShown.current = true;
          toast(t('recharge.order-approved'));
        }
      } catch {
        // Ignore polling errors.
      }
    };

    const interval = window.setInterval(syncOrder, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeOrderId, post, refetchOrders, refetchWallet, t, toast]);

  const handleCreateOrder = async () => {
    if (rechargeAmount == null) {
      return;
    }

    setSubmitting(true);

    try {
      await post('/recharge/orders', {
        amount: rechargeAmount,
        network,
      });
      toast(t('recharge.order-created'));
      touch('recharge-orders');
      await refetchOrders();
    } catch (e: any) {
      toast(
        (e.code && t(`recharge.${e.code}`)) || e.message || t('recharge.order-error'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const payAmount = activeOrder?.payAmount ?? activeOrder?.amount;
  const expiresAt = activeOrder?.expiresAt ? new Date(activeOrder.expiresAt) : null;

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader
          title={t('recharge.title')}
          description={t('recharge.description-auto')}
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
                <Label>{t('recharge.credit-amount')}</Label>
                <TextField
                  value={amountInput}
                  onChange={value => setAmountInput(sanitizeRechargeAmountInput(value))}
                  placeholder={t('recharge.amount-placeholder')}
                  isDisabled={!!activeOrder}
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
                        isDisabled={!!activeOrder}
                      >
                        {item.amount} USDT
                      </Button>
                    );
                  })}
                </Row>
              </Column>

              {!activeOrder && (
                <Button
                  variant="primary"
                  onPress={handleCreateOrder}
                  isDisabled={
                    !walletAddress
                    || submitting
                    || orderLimitReached
                    || rechargeAmount == null
                  }
                >
                  {t('recharge.create-order')}
                </Button>
              )}

              {orderLimitReached && !activeOrder && (
                <Text color="red" size="sm">
                  {t('recharge.order-limit-reached', { limit: RECHARGE_MAX_PENDING_ORDERS_PER_USER })}
                </Text>
              )}
            </Column>
          </Panel>

          <Panel title={t('recharge.payment-info')}>
            <Column gap="4">
              {activeOrder ? (
                <>
                  <RechargePayAmountHighlight
                    creditAmount={activeOrder.amount}
                    payAmount={payAmount}
                  />

                  {expiresAt && (
                    <RechargeOrderCountdown
                      expiresAt={expiresAt}
                      onExpire={() => {
                        void refetchOrders();
                      }}
                    />
                  )}

                  <Column gap="1">
                    <Label>{t('recharge.order-no')}</Label>
                    <Text weight="bold">{activeOrder.orderNo}</Text>
                  </Column>

                  <Column gap="1">
                    <Label>{t('recharge.credit-amount')}</Label>
                    <Text size="lg" color="muted">
                      {formatAmountDisplay(activeOrder.amount)} USDT
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

                  <Text weight="bold">{t('recharge.auto-waiting')}</Text>
                </>
              ) : (
                <>
                  <Column gap="1">
                    <Label>{t('recharge.credit-amount')}</Label>
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

                  <Text color="muted">{t('recharge.auto-steps')}</Text>
                </>
              )}
            </Column>
          </Panel>
        </Grid>

        <CustomerServiceNotice />

        <RechargeOrdersList />
      </Column>
    </PageBody>
  );
}
