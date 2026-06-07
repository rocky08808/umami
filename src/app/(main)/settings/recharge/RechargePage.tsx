'use client';
import {
  Button,
  Column,
  Grid,
  Label,
  Row,
  Text,
  TextField,
} from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useConfig, useLoginQuery } from '@/components/hooks';
import { RECHARGE_OPTIONS, getRechargeOption } from '@/lib/recharge';

const SUPPORT_EMAIL = 'timmy088088@gmail.com';

export function RechargePage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const config = useConfig();
  const { user } = useLoginQuery();
  const [selectedPlan, setSelectedPlan] = useState(RECHARGE_OPTIONS[0].plan);
  const [txId, setTxId] = useState('');

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan && getRechargeOption(plan)) {
      setSelectedPlan(plan as typeof selectedPlan);
    }
  }, [searchParams]);

  const option = getRechargeOption(selectedPlan) || RECHARGE_OPTIONS[0];
  const walletAddress = config?.usdtWalletAddress || '';
  const network = config?.usdtNetwork || 'TRC20';

  const handleConfirmPayment = () => {
    const trimmedTxId = txId.trim();

    if (!trimmedTxId) {
      return;
    }

    const subject = encodeURIComponent(`Recharge ${selectedPlan} - ${user?.username || ''}`);
    const body = encodeURIComponent(
      [
        `Plan: ${selectedPlan}`,
        `Amount: ${option.amount} USDT`,
        `Network: ${network}`,
        `Username: ${user?.username || ''}`,
        `User ID: ${user?.id || ''}`,
        `Transaction ID: ${trimmedTxId}`,
      ].join('\n'),
    );

    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
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

              <Column gap="1">
                <Label>{t('recharge.wallet-address')}</Label>
                {walletAddress ? (
                  <TextField value={walletAddress} isReadOnly allowCopy />
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

              <Button
                variant="primary"
                onPress={handleConfirmPayment}
                isDisabled={!walletAddress || !txId.trim()}
              >
                {t('recharge.submit-payment')}
              </Button>
            </Column>
          </Panel>
        </Grid>
      </Column>
    </PageBody>
  );
}
