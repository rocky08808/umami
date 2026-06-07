'use client';
import { Button, Column, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/components/hooks';

export function BillingLimitNotice({ message }: { message: string }) {
  const t = useTranslations();
  const router = useRouter();
  const { renderUrl } = useNavigation();

  return (
    <Column gap="2">
      <Text color="red" size="sm">
        {message}
      </Text>
      <Button
        variant="primary"
        size="sm"
        onPress={() => router.push(renderUrl('/settings/billing'))}
      >
        {t('billing.view-plans')}
      </Button>
    </Column>
  );
}
