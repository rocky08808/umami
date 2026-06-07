import {
  Button,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  ListItem,
  Select,
} from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { BillingLimitNotice } from '@/components/common/BillingLimitNotice';
import { useMessages, useTeamMemberLimitStatus, useUpdateQuery } from '@/components/hooks';
import { UserSelect } from '@/components/input/UserSelect';
import { ROLES } from '@/lib/constants';

const roles = [ROLES.teamManager, ROLES.teamMember, ROLES.teamViewOnly];

export function TeamMemberAddForm({
  teamId,
  onSave,
  onClose,
}: {
  teamId: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const t = useTranslations();
  const { t: tm, labels, getErrorMessage } = useMessages();
  const { limited, limit } = useTeamMemberLimitStatus(teamId);
  const { mutateAsync, error, isPending } = useUpdateQuery(`/teams/${teamId}/users`);

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        onSave?.();
        onClose?.();
      },
    });
  };

  const renderRole = role => {
    switch (role) {
      case ROLES.teamManager:
        return tm(labels.manager);
      case ROLES.teamMember:
        return tm(labels.member);
      case ROLES.teamViewOnly:
        return tm(labels.viewOnly);
    }
  };

  return (
    <Form onSubmit={handleSubmit} error={getErrorMessage(error)}>
      {limited && limit !== null && (
        <BillingLimitNotice message={t('billing.team-member-limit-reached', { limit })} />
      )}

      <FormField name="userId" label={tm(labels.username)} rules={{ required: 'Required' }}>
        <UserSelect teamId={teamId} />
      </FormField>
      <FormField name="role" label={tm(labels.role)} rules={{ required: 'Required' }}>
        <Select renderValue={value => renderRole(value as any)} isDisabled={limited}>
          {roles.map(value => (
            <ListItem key={value} id={value}>
              {renderRole(value)}
            </ListItem>
          ))}
        </Select>
      </FormField>
      <FormButtons>
        <Button isDisabled={isPending} onPress={onClose}>
          {tm(labels.cancel)}
        </Button>
        <FormSubmitButton variant="primary" isDisabled={limited || isPending}>
          {tm(labels.save)}
        </FormSubmitButton>
      </FormButtons>
    </Form>
  );
}
