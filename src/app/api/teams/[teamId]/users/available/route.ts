import { z } from 'zod';
import { getQueryFilters, parseRequest } from '@/lib/request';
import { json, unauthorized } from '@/lib/response';
import { pagingParams, searchParams } from '@/lib/schema';
import { canUpdateTeam } from '@/permissions';
import { getUsers } from '@/queries/prisma/user';

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const schema = z.object({
    ...pagingParams,
    ...searchParams,
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { teamId } = await params;

  if (!(await canUpdateTeam(auth, teamId))) {
    return unauthorized({ message: 'You must be the owner/manager of this team.' });
  }

  const filters = await getQueryFilters(query);

  const users = await getUsers(
    {
      where: {
        teams: {
          none: {
            teamId,
          },
        },
      },
      select: {
        id: true,
        username: true,
      },
    },
    filters,
  );

  return json(users);
}
