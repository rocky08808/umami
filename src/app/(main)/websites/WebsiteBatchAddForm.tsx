'use client';
import { Button, Column, Row, Text, TextField, useToast } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { BillingLimitNotice } from '@/components/common/BillingLimitNotice';
import { useApi, useConfig, useMessages, useModified, useWebsiteLimitStatus } from '@/components/hooks';
import { isValidDomain, parseBatchDomains } from '@/lib/websites';

type CreatedWebsite = {
  id: string;
  name: string;
  domain: string;
  shareId: string | null;
};

export function WebsiteBatchAddForm({
  teamId,
  onSave,
  onClose,
}: {
  teamId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const t = useTranslations();
  const { t: tm, labels } = useMessages();
  const { cloudMode } = useConfig();
  const { post } = useApi();
  const { toast } = useToast();
  const { touch } = useModified('websites');
  const { limited, limit, count } = useWebsiteLimitStatus(teamId);
  const [domainsText, setDomainsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResults, setCreatedResults] = useState<CreatedWebsite[] | null>(null);

  const domains = useMemo(() => parseBatchDomains(domainsText), [domainsText]);
  const invalidDomains = domains.filter(domain => !isValidDomain(domain));
  const remaining = limit === null ? null : Math.max(0, limit - count);
  const exceedsLimit = remaining !== null && domains.length > remaining;

  const getShareUrl = (slug: string) => {
    const origin = cloudMode ? process.env.cloudUrl : window?.location.origin;
    return `${origin}${process.env.basePath || ''}/share/${slug}`;
  };

  const batchCopyText = useMemo(() => {
    if (!createdResults?.length) {
      return { ids: '', shareUrls: '', all: '' };
    }

    const header = `${tm(labels.domain)}\t${tm(labels.websiteId)}\t${tm(labels.shareUrl)}`;
    const rows = createdResults.map(website => {
      const shareUrl = website.shareId ? getShareUrl(website.shareId) : '';
      return `${website.domain}\t${website.id}\t${shareUrl}`;
    });

    return {
      ids: createdResults.map(website => website.id).join('\n'),
      shareUrls: createdResults
        .filter(website => website.shareId)
        .map(website => getShareUrl(website.shareId!))
        .join('\n'),
      all: [header, ...rows].join('\n'),
    };
  }, [cloudMode, createdResults, labels, tm]);

  const copyText = async (text: string) => {
    if (!text || !navigator?.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(text);
  };

  const handleSubmit = async () => {
    if (!domains.length || limited || exceedsLimit || invalidDomains.length) {
      return;
    }

    const payloadDomains = remaining === null ? domains : domains.slice(0, remaining);

    setSubmitting(true);
    setError(null);

    try {
      const result = await post('/websites/batch', {
        domains: payloadDomains,
        ...(teamId ? { teamId } : {}),
      });

      const createdCount = result.created?.length ?? 0;
      const failedCount = result.failed?.length ?? 0;

      if (createdCount) {
        toast(t('message.batch-websites-created', { count: createdCount }));
        touch('websites');
        onSave?.();
        setCreatedResults(result.created);
      }

      if (failedCount && !createdCount) {
        setError(t('message.batch-websites-failed', { count: failedCount }));
      } else if (failedCount) {
        toast(t('message.batch-websites-partial-failed', { count: failedCount }));
      }
    } catch (e: any) {
      setError((e.code && t(`message.${e.code}`)) || e.message || t('message.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (createdResults?.length) {
    return (
      <Column gap="4">
        <Text weight="bold">{t('message.batch-websites-created', { count: createdResults.length })}</Text>

        <Row gap="2" wrap="wrap">
          <Button variant="outline" onPress={() => copyText(batchCopyText.ids)}>
            {t('message.batch-websites-copy-ids')}
          </Button>
          <Button variant="outline" onPress={() => copyText(batchCopyText.shareUrls)}>
            {t('message.batch-websites-copy-share-urls')}
          </Button>
          <Button variant="outline" onPress={() => copyText(batchCopyText.all)}>
            {t('message.batch-websites-copy-all')}
          </Button>
        </Row>

        <TextField
          asTextArea
          className="batch-results-textarea"
          value={batchCopyText.all}
          isReadOnly
          allowCopy
          resize="vertical"
        />

        <Row justifyContent="flex-end">
          {onClose && (
            <Button variant="primary" onPress={onClose}>
              {tm(labels.ok)}
            </Button>
          )}
        </Row>
      </Column>
    );
  }

  return (
    <Column gap="4">
      {limited && limit !== null && (
        <BillingLimitNotice message={t('billing.website-limit-reached', { limit })} />
      )}

      <Column gap="2">
        <Text color="muted" size="sm">
          {t('message.batch-websites-hint')}
        </Text>
        <TextField
          asTextArea
          className="batch-domains-textarea"
          value={domainsText}
          onChange={setDomainsText}
          resize="vertical"
          isDisabled={limited}
          placeholder={'example.com\nblog.example.com'}
        />
      </Column>

      {domains.length > 0 && (
        <Text size="sm">{t('message.batch-websites-count', { count: domains.length })}</Text>
      )}

      {invalidDomains.length > 0 && (
        <Text color="red" size="sm">
          {t('message.batch-websites-invalid-domain', { count: invalidDomains.length })}
        </Text>
      )}

      {exceedsLimit && remaining !== null && (
        <Text color="red" size="sm">
          {t('message.batch-websites-limit-exceeded', { remaining })}
        </Text>
      )}

      {error && (
        <Text color="red" size="sm">
          {error}
        </Text>
      )}

      <Row justifyContent="flex-end" gap="3">
        {onClose && (
          <Button isDisabled={submitting} onPress={onClose}>
            {tm(labels.cancel)}
          </Button>
        )}
        <Button
          variant="primary"
          onPress={handleSubmit}
          isDisabled={
            limited || submitting || !domains.length || exceedsLimit || invalidDomains.length > 0
          }
        >
          {tm(labels.create)}
        </Button>
      </Row>
    </Column>
  );
}
