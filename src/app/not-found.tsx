'use client';
import { Flexbox } from '@umami/react-zen';
import { useTranslations } from 'next-intl';

export default function () {
  const t = useTranslations('message');

  return (
    <Flexbox alignItems="center" justifyContent="center" flexGrow="1" minHeight="600px">
      <h1>{t('page-not-found')}</h1>
    </Flexbox>
  );
}
