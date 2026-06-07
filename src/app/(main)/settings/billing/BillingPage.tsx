'use client';
import { Button, Column, Grid, Icon, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { useSubscription } from '@/components/hooks';
import { Check } from '@/components/icons';
import { getCurrentPlanId, PLANS, type PlanId } from '@/lib/billing';

function PlanCard({
  planId,
  isCurrent,
  onAction,
}: {
  planId: PlanId;
  isCurrent: boolean;
  onAction?: () => void;
}) {
  const t = useTranslations();
  const plan = PLANS.find(item => item.id === planId);

  if (!plan) {
    return null;
  }

  const price = plan.price.startsWith('billing.') ? t(plan.price) : plan.price;

  return (
    <Column
      gap="4"
      padding="6"
      border
      borderRadius
      backgroundColor="surface-base"
      flexGrow="1"
      style={{
        minWidth: 0,
        borderColor: isCurrent ? 'var(--border-color-strong, currentColor)' : undefined,
        boxShadow: isCurrent ? 'inset 0 0 0 1px var(--border-color-strong, currentColor)' : undefined,
      }}
    >
      <Row alignItems="center" gap="2">
        <Text size="lg" weight="bold">
          {t(plan.nameKey)}
        </Text>
        {isCurrent && (
          <Row
            paddingX="2"
            paddingY="1"
            borderRadius
            backgroundColor="primary"
            alignItems="center"
          >
            <Text size="sm" weight="bold" style={{ color: 'white' }}>
              {t('billing.current-plan')}
            </Text>
          </Row>
        )}
      </Row>

      <Row alignItems="baseline" gap="1">
        <Text size="3xl" weight="bold">
          {price}
        </Text>
        {plan.priceSuffixKey && (
          <Text color="muted">{t(plan.priceSuffixKey)}</Text>
        )}
      </Row>

      {plan.actionKey && !isCurrent && (
        <Column gap="1">
          <Button variant="primary" onPress={onAction}>
            {t(plan.actionKey)}
          </Button>
          {plan.trialKey && (
            <Text size="sm" color="muted">
              {t(plan.trialKey)}
            </Text>
          )}
        </Column>
      )}

      {plan.introKey && (
        <Text color="muted">{t(plan.introKey)}</Text>
      )}

      <Column gap="2">
        {plan.featureKeys.map(key => (
          <Row key={key} alignItems="flex-start" gap="2">
            <Icon color="success" size="sm" style={{ marginTop: 2, flexShrink: 0 }}>
              <Check />
            </Icon>
            <Text>{t(key)}</Text>
          </Row>
        ))}
      </Column>
    </Column>
  );
}

export function BillingPage() {
  const t = useTranslations();
  const subscription = useSubscription();
  const currentPlanId = getCurrentPlanId(subscription);

  const handleUpgrade = (planId: PlanId) => {
    if (planId === 'enterprise') {
      window.open('mailto:timmy088088@gmail.com', '_blank');
      return;
    }

    window.open('mailto:timmy088088@gmail.com?subject=Plan%20upgrade', '_blank');
  };

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader title={t('billing.title')} showBorder={false} />

        <Grid
          columns={{ base: '1fr', md: '1fr 1fr', xl: 'repeat(4, 1fr)' }}
          gap="4"
          alignItems="stretch"
        >
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              planId={plan.id}
              isCurrent={currentPlanId === plan.id}
              onAction={
                plan.actionKey ? () => handleUpgrade(plan.id) : undefined
              }
            />
          ))}
        </Grid>
      </Column>
    </PageBody>
  );
}
