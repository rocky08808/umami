import { z } from 'zod';
import { getTeamMemberUsage, isSelfHostedBilling } from '@/lib/billing-limits';
import { ROLES } from '@/lib/constants';
import { parseRequest } from '@/lib/request';
import { badRequest, json, notFound } from '@/lib/response';
import { createTeamUser, findTeam, getTeamUser } from '@/queries/prisma';

export async function GET(request: Request) {
  const schema = z.object({
    accessCode: z.string().max(50),
  });

  const { query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!isSelfHostedBilling()) {
    return json({ limited: false, limit: null, count: 0 });
  }

  const team = await findTeam({
    where: {
      accessCode: query.accessCode,
    },
  });

  if (!team) {
    return notFound({ message: 'Team not found.', code: 'team-not-found' });
  }

  const usage = await getTeamMemberUsage(team.id);

  return json(usage);
}

export async function POST(request: Request) {
  const schema = z.object({
    accessCode: z.string().max(50),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { accessCode } = body;

  const team = await findTeam({
    where: {
      accessCode,
    },
  });

  if (!team) {
    return notFound({ message: 'Team not found.', code: 'team-not-found' });
  }

  const teamUser = await getTeamUser(team.id, auth.user.id);

  if (teamUser) {
    return badRequest({ message: 'User is already a team member.' });
  }

  const user = await createTeamUser(auth.user.id, team.id, ROLES.teamMember);

  return json(user);
}
