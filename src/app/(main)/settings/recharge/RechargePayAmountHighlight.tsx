'use client';
import { AlertBanner, Column, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/common/CopyButton';
import { formatAmountDisplay, formatPayAmount } from '@/lib/recharge';
import { CustomerServiceNotice } from './CustomerServiceNotice';

export function RechargePayAmountHighlight({
  creditAmount,
  payAmount,
}: {
  creditAmount: unknown;
  payAmount: unknown;
}) {
  const t = useTranslations();
  const payAmountText = formatPayAmount(payAmount);
  const creditText = formatAmountDisplay(creditAmount);
  const payDiffers = payAmountText !== creditText;

  return (
    <Column gap="3">
      <AlertBanner variant="error" title={t('recharge.pay-amount-alert-title')}>
        <Text size="sm">{t('recharge.pay-amount-alert-body')}</Text>
      </AlertBanner>

      <Column
        gap="2"
        padding="4"
        borderRadius="lg"
        style={{
          background: 'var(--orange2, #fff7ed)',
          border: '2px solid var(--orange9, #ea580c)',
          boxShadow: '0 0 0 1px rgba(234, 88, 12, 0.15)',
        }}
      >
        <Text weight="bold" size="sm" style={{ color: 'var(--orange11, #c2410c)' }}>
          {t('recharge.pay-amount-exact-label')}
        </Text>

        <Row alignItems="center" justifyContent="space-between" gap="3" wrap="wrap">
          <Text
            weight="bold"
            style={{
              fontSize: '2.5rem',
              lineHeight: 1.1,
              color: 'var(--orange11, #c2410c)',
              letterSpacing: '0.02em',
            }}
          >
            {payAmountText} USDT
          </Text>
          <CopyButton value={payAmountText} label={t('recharge.pay-amount-copy')} />
        </Row>

        {payDiffers && (
          <Text weight="bold" size="sm" color="red">
            {t('recharge.pay-amount-diff-hint', {
              credit: creditText,
              pay: payAmountText,
            })}
          </Text>
        )}

        {payDiffers && (
          <Text size="sm" style={{ color: 'var(--orange11, #c2410c)' }}>
            {t('recharge.pay-amount-do-not-round', { amount: creditText })}
          </Text>
        )}

        <Text color="muted" size="sm">
          {t('recharge.pay-amount-hint')}
        </Text>

        <Text color="red" size="sm" weight="bold">
          {t('recharge.pay-amount-wrong-warning')}
        </Text>
        <CustomerServiceNotice variant="compact" />
      </Column>
    </Column>
  );
}
