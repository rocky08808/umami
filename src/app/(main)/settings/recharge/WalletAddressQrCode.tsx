'use client';
import { Column, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import QRCode from 'react-qr-code';

export function WalletAddressQrCode({ address }: { address: string }) {
  const t = useTranslations();

  if (!address) {
    return null;
  }

  return (
    <Column gap="2" alignItems="flex-start">
      <div
        style={{
          padding: 12,
          background: '#fff',
          borderRadius: 8,
          border: '1px solid var(--border-color, #e5e7eb)',
          lineHeight: 0,
        }}
      >
        <QRCode value={address} size={160} />
      </div>
      <Text color="muted" size="sm">
        {t('recharge.wallet-qr-hint')}
      </Text>
    </Column>
  );
}
