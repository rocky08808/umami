'use client';
import { Column, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';

export function UserPlanDisplay({
  subscription,
  bold = false,
}: {
  subscription?: {
    plan?: string;
    expiresAt?: string | Date | null;
  } | null;
  bold?: boolean;
}) {
  const t = useTranslations('billing');
  const plan = subscription?.plan || 'hobby';
  const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
  const expired = plan !== 'hobby' && !!expiresAt && expiresAt < new Date();

  const formatExpiryDate = (value: Date) =>
    value.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <Column gap="1">
      <Text weight={bold ? 'bold' : undefined}>{t(`plan-${plan}`)}</Text>
      {expired && expiresAt && (
        <Text color="red" size="sm">
          {t('expired-at', { date: formatExpiryDate(expiresAt) })}
        </Text>
      )}
      {!expired && expiresAt && (
        <Text color="muted" size="sm">
          {t('expires-at', { date: formatExpiryDate(expiresAt) })}
        </Text>
      )}
    </Column>
  );
}
