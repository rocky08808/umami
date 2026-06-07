import {
  Button,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  Text,
  TextField,
} from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useMessages, useTeamJoinLimitStatus, useUpdateQuery } from '@/components/hooks';

function TeamJoinFields({
  onClose,
  limited,
  limit,
}: {
  onClose: () => void;
  limited: boolean;
  limit: number | null;
}) {
  const t = useTranslations();
  const { t: tm, labels } = useMessages();

  return (
    <>
      {limited && limit !== null && (
        <Text color="red" size="sm">
          {t('billing.team-join-limit-reached', { limit })}
        </Text>
      )}

      <FormField
        label={tm(labels.accessCode)}
        name="accessCode"
        rules={{ required: tm(labels.required) }}
      >
        <TextField autoComplete="off" />
      </FormField>
      <FormButtons>
        <Button onPress={onClose}>{tm(labels.cancel)}</Button>
        <FormSubmitButton variant="primary" isDisabled={limited}>
          {tm(labels.join)}
        </FormSubmitButton>
      </FormButtons>
    </>
  );
}

function TeamJoinFormContent({
  onClose,
  watch,
}: {
  onClose: () => void;
  watch: (name: string) => string;
}) {
  const accessCode = watch('accessCode') || '';
  const { limited, limit } = useTeamJoinLimitStatus(accessCode);

  return (
    <TeamJoinFields onClose={onClose} limited={limited} limit={limit} />
  );
}

export function TeamJoinForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const { getErrorMessage } = useMessages();
  const { mutateAsync, error, touch } = useUpdateQuery('/teams/join');

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        touch('teams:members');
        onSave?.();
        onClose?.();
      },
    });
  };

  return (
    <Form onSubmit={handleSubmit} error={getErrorMessage(error)}>
      {({ watch }) => <TeamJoinFormContent onClose={onClose} watch={watch} />}
    </Form>
  );
}
