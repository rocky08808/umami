'use client';
import { Column, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function RechargeOrderCountdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: Date;
  onExpire?: () => void;
}) {
  const t = useTranslations();
  const [remainingMs, setRemainingMs] = useState(() => expiresAt.getTime() - Date.now());
  const onExpireRef = useRef(onExpire);
  const expiredNotifiedRef = useRef(false);
  const expired = remainingMs <= 0;
  const urgent = remainingMs > 0 && remainingMs <= 5 * 60 * 1000;

  onExpireRef.current = onExpire;

  useEffect(() => {
    expiredNotifiedRef.current = false;
    setRemainingMs(expiresAt.getTime() - Date.now());
  }, [expiresAt]);

  useEffect(() => {
    const notifyExpired = () => {
      if (expiredNotifiedRef.current) {
        return;
      }

      expiredNotifiedRef.current = true;
      onExpireRef.current?.();
    };

    const tick = () => {
      const next = expiresAt.getTime() - Date.now();
      setRemainingMs(next);

      if (next <= 0) {
        notifyExpired();
      }
    };

    tick();

    if (expiresAt.getTime() <= Date.now()) {
      return undefined;
    }

    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  if (expired) {
    return (
      <Text color="red" weight="bold">
        {t('recharge.auto-expired')}
      </Text>
    );
  }

  return (
    <Column
      gap="1"
      padding="3"
      borderRadius="md"
      style={{
        background: urgent ? 'var(--red2, #fef2f2)' : 'var(--gray2, #f8fafc)',
        border: urgent
          ? '1px solid var(--red8, #f87171)'
          : '1px solid var(--gray6, #e2e8f0)',
      }}
    >
      <Text size="sm" color="muted">
        {t('recharge.auto-expires-countdown')}
      </Text>
      <Text
        weight="bold"
        style={{
          fontSize: '2rem',
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
          color: urgent ? 'var(--red11, #dc2626)' : 'var(--gray12, #0f172a)',
        }}
      >
        {formatCountdown(remainingMs)}
      </Text>
      <Text color="muted" size="sm">
        {t('recharge.auto-expires', {
          time: expiresAt.toLocaleString(),
        })}
      </Text>
    </Column>
  );
}
