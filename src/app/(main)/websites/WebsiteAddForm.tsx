import { Button, Form, FormField, FormSubmitButton, Row, TextField } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { BillingLimitNotice } from '@/components/common/BillingLimitNotice';
import { useMessages, useUpdateQuery, useWebsiteLimitStatus } from '@/components/hooks';
import { DOMAIN_REGEX } from '@/lib/constants';

export function WebsiteAddForm({
  teamId,
  onSave,
  onClose,
}: {
  teamId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const t = useTranslations();
  const { t: tm, labels, messages } = useMessages();
  const { limited, limit } = useWebsiteLimitStatus(teamId);
  const { mutateAsync, error, isPending } = useUpdateQuery('/websites', { teamId });

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        onSave?.();
        onClose?.();
      },
    });
  };

  return (
    <Form onSubmit={handleSubmit} error={error?.message}>
      {limited && limit !== null && (
        <BillingLimitNotice message={t('billing.website-limit-reached', { limit })} />
      )}

      <FormField
        label={tm(labels.name)}
        data-test="input-name"
        name="name"
        rules={{ required: tm(labels.required) }}
      >
        <TextField autoComplete="off" isDisabled={limited} />
      </FormField>

      <FormField
        label={tm(labels.domain)}
        data-test="input-domain"
        name="domain"
        rules={{
          required: tm(labels.required),
          pattern: { value: DOMAIN_REGEX, message: tm(messages.invalidDomain) },
        }}
      >
        <TextField autoComplete="off" isDisabled={limited} />
      </FormField>
      <Row justifyContent="flex-end" paddingTop="3" gap="3">
        {onClose && (
          <Button isDisabled={isPending} onPress={onClose}>
            {tm(labels.cancel)}
          </Button>
        )}
        <FormSubmitButton data-test="button-submit" isDisabled={limited || isPending}>
          {tm(labels.save)}
        </FormSubmitButton>
      </Row>
    </Form>
  );
}
