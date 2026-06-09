'use client';
import { Column, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { Panel } from '@/components/common/Panel';

const STEP_KEYS = [
  'tutorial-step-1',
  'tutorial-step-2',
  'tutorial-step-3',
  'tutorial-step-4',
  'tutorial-step-5',
  'tutorial-step-6',
] as const;

const TIP_KEYS = [
  'tutorial-tip-1',
  'tutorial-tip-2',
  'tutorial-tip-3',
  'tutorial-tip-4',
] as const;

export function RechargeTutorial({ network }: { network: string }) {
  const t = useTranslations();

  return (
    <Panel title={t('recharge.tutorial-title')}>
      <Column gap="4">
        <Text color="muted">{t('recharge.tutorial-intro')}</Text>

        <Column gap="3">
          {STEP_KEYS.map((key, index) => (
            <Row key={key} gap="3" alignItems="start">
              <Text
                weight="bold"
                style={{
                  flexShrink: 0,
                  width: '1.5rem',
                  height: '1.5rem',
                  lineHeight: '1.5rem',
                  textAlign: 'center',
                  borderRadius: '9999px',
                  background: 'var(--primary9, #3b82f6)',
                  color: 'white',
                  fontSize: '0.75rem',
                }}
              >
                {index + 1}
              </Text>
              <Text style={{ flex: 1 }}>{t(`recharge.${key}`, { network })}</Text>
            </Row>
          ))}
        </Column>

        <Column gap="2">
          <Text weight="bold" size="sm">
            {t('recharge.tutorial-tips-title')}
          </Text>
          <Column gap="1" style={{ paddingInlineStart: '1rem' }}>
            {TIP_KEYS.map(key => (
              <Text key={key} color="muted" size="sm">
                • {t(`recharge.${key}`)}
              </Text>
            ))}
          </Column>
        </Column>
      </Column>
    </Panel>
  );
}
