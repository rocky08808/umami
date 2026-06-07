'use client';
import { Button, Column, Grid, Icon, Row, Text } from '@umami/react-zen';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { useBillingUsageQuery, useNavigation, useSubscription } from '@/components/hooks';
import { Check } from '@/components/icons';
import { canUpgradePlan, getCurrentPlanId, PLANS, type PlanId } from '@/lib/billing';

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

      {plan.actionKey && onAction && (
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
  const router = useRouter();
  const { renderUrl } = useNavigation();
  const subscription = useSubscription();
  const { data: usage } = useBillingUsageQuery();
  const currentPlanId = getCurrentPlanId(subscription);
  const subscriptionInfo = usage?.subscription;
  const events = usage?.events;
  const websites = usage?.websites;

  const formatExpiryDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleUpgrade = (planId: PlanId) => {
    if (planId === 'enterprise') {
      window.open('mailto:timmy088088@gmail.com', '_blank');
      return;
    }

    router.push(renderUrl('/settings/recharge', { plan: planId }));
  };

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader title={t('billing.title')} showBorder={false} />

        {(subscriptionInfo?.expiresAt || events || websites) && (
          <Column gap="2">
            {subscriptionInfo?.expiresAt && (
              <Text color={subscriptionInfo.expired ? 'red' : undefined}>
                {subscriptionInfo.expired
                  ? t('billing.expired-at', {
                      date: formatExpiryDate(subscriptionInfo.expiresAt),
                    })
                  : t('billing.expires-at', {
                      date: formatExpiryDate(subscriptionInfo.expiresAt),
                    })}
              </Text>
            )}

            {websites && (
              <Text color={websites.limited ? 'red' : undefined}>
                {websites.limit === null
                  ? t('billing.websites-usage-unlimited', { count: websites.count })
                  : t('billing.websites-usage', { count: websites.count, limit: websites.limit })}
              </Text>
            )}

            {events && (
              <Text color={events.limited ? 'red' : undefined}>
                {events.limit === null
                  ? t('billing.events-usage-unlimited', { count: events.count })
                  : t('billing.events-usage', { count: events.count, limit: events.limit })}
              </Text>
            )}

            {(events?.limited || websites?.limited) && (
              <>
                {websites?.limited && (
                  <Text color="red" size="sm">
                    {t('billing.website-limit-reached', { limit: websites.limit })}
                  </Text>
                )}
                {events?.limited && (
                  <Text color="red" size="sm">
                    {t('billing.event-limit-reached', { limit: events.limit })}
                  </Text>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => router.push(renderUrl('/settings/recharge'))}
                >
                  {t('recharge.title')}
                </Button>
              </>
            )}
          </Column>
        )}

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
                plan.actionKey && canUpgradePlan(currentPlanId, plan.id)
                  ? () => handleUpgrade(plan.id)
                  : undefined
              }
            />
          ))}
        </Grid>
      </Column>
    </PageBody>
  );
}
