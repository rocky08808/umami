import { parseRequest } from '@/lib/request';
import { json, unauthorized } from '@/lib/response';
import { canViewUsers } from '@/permissions';
import { getAdminOverviewStats } from '@/queries/prisma/adminStats';

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  return json(await getAdminOverviewStats());
}
