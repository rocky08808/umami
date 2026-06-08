'use client';
import { Button, Column, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import Link from '@/components/common/Link';
import { CopyButton } from '@/components/common/CopyButton';
import { useConfig } from '@/components/hooks';

export function CustomerServiceNotice({
  variant = 'default',
}: {
  variant?: 'default' | 'compact';
}) {
  const t = useTranslations();
  const config = useConfig();
  const customerService = config?.customerService;

  if (!customerService?.contact) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Text color="red" size="sm" weight="bold">
        {t('recharge.customer-service-compact', {
          label: customerService.label,
          contact: customerService.contact,
        })}
        {customerService.link && (
          <>
            {' '}
            <Link href={customerService.link} target="_blank">
              <Text color="primary">{t('recharge.customer-service-contact')}</Text>
            </Link>
          </>
        )}
      </Text>
    );
  }

  return (
    <Column
      gap="2"
      padding="3"
      borderRadius="md"
      style={{
        background: 'var(--gray2, #f8fafc)',
        border: '1px solid var(--gray6, #e2e8f0)',
      }}
    >
      <Text weight="bold">{t('recharge.customer-service-title')}</Text>
      <Text color="muted" size="sm">
        {t('recharge.customer-service-desc')}
      </Text>

      <Row alignItems="center" gap="2" wrap="wrap">
        <Text weight="bold">{customerService.label}:</Text>
        <Text weight="bold">{customerService.contact}</Text>
        <CopyButton
          value={customerService.contact}
          label={t('recharge.customer-service-copy')}
        />
      </Row>

      {customerService.link && (
        <Link href={customerService.link} target="_blank">
          <Button variant="outline" size="sm">
            {t('recharge.customer-service-contact')}
          </Button>
        </Link>
      )}
    </Column>
  );
}
