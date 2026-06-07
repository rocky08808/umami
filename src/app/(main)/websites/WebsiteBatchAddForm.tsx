'use client';
import { AlertBanner, Button, Column, Row, Text, TextField, useToast } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [copySuccess, setCopySuccess] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

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

  const copyToClipboard = async (text: string) => {
    if (!text) {
      return false;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (!ok) {
      return;
    }

    setCopySuccess(true);
    toast(t('message.copied'));

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = window.setTimeout(() => {
      setCopySuccess(false);
    }, 2500);
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

        {copySuccess && <AlertBanner variant="success" title={t('message.copied')} />}

        <Row gap="2" wrap="wrap">
          <Button variant="outline" onPress={() => handleCopy(batchCopyText.ids)}>
            {t('message.batch-websites-copy-ids')}
          </Button>
          <Button variant="outline" onPress={() => handleCopy(batchCopyText.shareUrls)}>
            {t('message.batch-websites-copy-share-urls')}
          </Button>
          <Button variant="outline" onPress={() => handleCopy(batchCopyText.all)}>
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
