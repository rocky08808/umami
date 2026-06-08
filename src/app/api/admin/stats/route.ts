import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';
import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, unauthorized } from '@/lib/response';
import { canViewUsers } from '@/permissions';
import { getAdminOverviewStats } from '@/queries/prisma/adminStats';

const schema = z.object({
  startAt: z.coerce.number().optional(),
  endAt: z.coerce.number().optional(),
});

function getDefaultPeriod() {
  const now = new Date();

  return {
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
  };
}

export async function GET(request: Request) {
  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  const { startDate, endDate } =
    query.startAt != null && query.endAt != null
      ? {
          startDate: startOfDay(new Date(query.startAt)),
          endDate: endOfDay(new Date(query.endAt)),
        }
      : getDefaultPeriod();

  return json(await getAdminOverviewStats({ startDate, endDate }));
}
