import { Column, Label, Text, TextField } from '@umami/react-zen';
import { useConfig, useMessages } from '@/components/hooks';

const SCRIPT_NAME = 'script.js';

export function buildWebsiteTrackingScript(
  websiteId: string,
  options?: {
    config?: {
      cloudMode?: boolean;
      trackerScriptName?: string;
    };
    hostUrl?: string;
  },
) {
  const config = options?.config;
  const hostUrl = options?.hostUrl;
  const trackerScriptName =
    config?.trackerScriptName?.split(',')?.map((n: string) => n.trim())?.[0] || SCRIPT_NAME;

  const getUrl = (scriptName: string) => {
    if (config?.cloudMode) {
      return `${process.env.cloudUrl}/${scriptName}`;
    }

    const origin =
      hostUrl || (typeof window !== 'undefined' ? window.location.origin : '');

    return `${origin}${process.env.basePath || ''}/${scriptName}`;
  };

  const url = trackerScriptName?.startsWith('http') ? trackerScriptName : getUrl(trackerScriptName);

  return `<script defer src="${url}" data-website-id="${websiteId}"></script>`;
}

export function WebsiteTrackingCode({
  websiteId,
  hostUrl,
}: {
  websiteId: string;
  hostUrl?: string;
}) {
  const { t, messages, labels } = useMessages();
  const config = useConfig();
  const code = buildWebsiteTrackingScript(websiteId, { config, hostUrl });

  return (
    <Column gap>
      <Label>{t(labels.trackingCode)}</Label>
      <Text color="muted">{t(messages.trackingCode)}</Text>
      <TextField value={code} isReadOnly allowCopy asTextArea resize="none" className="code-textarea" />
    </Column>
  );
}
