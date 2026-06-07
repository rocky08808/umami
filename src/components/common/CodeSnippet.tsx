'use client';
import { Row } from '@umami/react-zen';
import { CopyButton } from '@/components/common/CopyButton';

export function CodeSnippet({ value }: { value: string }) {
  return (
    <Row alignItems="flex-start" gap="2" width="100%">
      <textarea
        readOnly
        value={value}
        rows={Math.max(3, value.split('\n').length)}
        className="code-snippet"
      />
      <CopyButton value={value} />
    </Row>
  );
}
