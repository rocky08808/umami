'use client';
import { Column } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { AdminWalletCreditForm } from './AdminWalletCreditForm';

export function AdminWalletPage() {
  const t = useTranslations();

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader
          title={t('admin.wallet-credit')}
          description={t('admin.wallet-credit-desc')}
          showBorder={false}
        />

        <Panel>
          <AdminWalletCreditForm />
        </Panel>
      </Column>
    </PageBody>
  );
}
