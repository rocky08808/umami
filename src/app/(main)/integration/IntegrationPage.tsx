'use client';
import { Column, Label, Loading, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { CodeSnippet } from '@/components/common/CodeSnippet';
import { LinkButton } from '@/components/common/LinkButton';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { buildWebsiteTrackingScript } from '@/app/(main)/websites/[websiteId]/settings/WebsiteTrackingCode';
import { useConfig, useLoginQuery, useMessages, useNavigation, useUserWebsitesQuery } from '@/components/hooks';
import { WebsiteSelect } from '@/components/input/WebsiteSelect';
const TRACKING_EXAMPLE =
  '<script defer src="https://cloud.webscount.com/script.js" data-website-id="your-website-id"></script>';

const EVENT_EXAMPLE = `// Track a custom event
webscount.track('signup-button');

// Track an event with data
webscount.track('purchase', { price: 99, currency: 'USD' });

// Track clicks with HTML attributes
// <button data-webscount-event="signup-button">Sign up</button>`;

export function IntegrationPage() {
  const t = useTranslations();
  const { t: tm, messages } = useMessages();
  const { renderUrl } = useNavigation();
  const config = useConfig();
  const { user } = useLoginQuery();
  const [websiteId, setWebsiteId] = useState<string>();
  const { data, isLoading } = useUserWebsitesQuery({ userId: user?.id });
  const websites = data?.data ?? [];

  useEffect(() => {
    if (!websiteId && websites[0]?.id) {
      setWebsiteId(websites[0].id);
    }
  }, [websiteId, websites]);

  const trackingCode = useMemo(() => {
    if (!websiteId) {
      return '';
    }

    return buildWebsiteTrackingScript(websiteId, { config });
  }, [websiteId, config]);

  const scriptTag = trackingCode || TRACKING_EXAMPLE;

  const installExample = useMemo(
    () => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>My website</title>
    ${scriptTag}
  </head>
  <body>
    ...
  </body>
</html>`,
    [scriptTag],
  );

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader title={t('integration.title')} showBorder={false} />

        <Text color="muted">{t('integration.description')}</Text>

        <Column gap="4">
          <Panel
            title={t('integration.tracking-title')}
            border
            borderRadius
            backgroundColor="surface-base"
            padding="4"
          >
            <Column gap="4">
              <Column gap="2" position="relative">
                <Label>{t('integration.select-website')}</Label>
                {isLoading && !websiteId ? (
                  <Loading icon="dots" placement="inline" />
                ) : websites.length ? (
                  <WebsiteSelect
                    websiteId={websiteId}
                    onChange={setWebsiteId}
                    buttonProps={{ style: { maxWidth: 320 } }}
                  />
                ) : (
                  <Text color="muted">{t('integration.no-website')}</Text>
                )}
              </Column>

              <Column gap="3">
                <Text>1. {t('integration.step-1')}</Text>

                <Column gap="2">
                  <Text>2. {t('integration.step-2')}</Text>
                  <CodeSnippet value={trackingCode || TRACKING_EXAMPLE} />
                  <Text color="muted" size="sm">
                    {tm(messages.trackingCode)}
                  </Text>
                </Column>

                <Column gap="2">
                  <Text>3. {t('integration.step-3')}</Text>
                  <CodeSnippet value={installExample} />
                </Column>

                <Text>4. {t('integration.step-4')}</Text>
              </Column>

              {websiteId && (
                <Row>
                  <LinkButton
                    href={renderUrl(`/websites/${websiteId}/settings`, false)}
                    variant="quiet"
                    size="sm"
                  >
                    {t('integration.website-settings')}
                  </LinkButton>
                </Row>
              )}
            </Column>
          </Panel>

          <Panel
            title={t('integration.events-title')}
            description={t('integration.events-description')}
            border
            borderRadius
            backgroundColor="surface-base"
            padding="4"
          >
            <Column gap="2">
              <Label>{t('integration.events-example')}</Label>
              <CodeSnippet value={EVENT_EXAMPLE} />
            </Column>
          </Panel>
        </Column>
      </Column>
    </PageBody>
  );
}
