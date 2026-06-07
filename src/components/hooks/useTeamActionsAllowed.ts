import { ROLES } from '@/lib/constants';
import { useLoginQuery } from './queries/useLoginQuery';
import { useTeamQuery } from './queries/useTeamQuery';

export function useTeamActionsAllowed(teamId?: string) {
  const { user } = useLoginQuery();
  const { data: team } = useTeamQuery(teamId || '', { enabled: !!teamId });

  if (!user) {
    return false;
  }

  if (teamId) {
    return (
      team?.members?.some(
        (member: { userId: string; role: string }) =>
          member.userId === user.id && member.role !== ROLES.teamViewOnly,
      ) ?? false
    );
  }

  return user.role !== ROLES.viewOnly;
}
