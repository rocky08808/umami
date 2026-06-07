import { z } from 'zod';
import { saveAuth } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { secret, uuid } from '@/lib/crypto';
import { createSecureToken } from '@/lib/jwt';
import { hashPassword } from '@/lib/password';
import { isRegistrationEnabled } from '@/lib/register';
import redis from '@/lib/redis';
import { parseRequest } from '@/lib/request';
import { badRequest, json, unauthorized } from '@/lib/response';
import { createUser, getAllUserTeams, getUserByUsername } from '@/queries/prisma';

export async function POST(request: Request) {
  if (!isRegistrationEnabled()) {
    return unauthorized({ message: 'Registration is disabled.', code: 'registration-disabled' });
  }

  const schema = z.object({
    username: z.string().trim().min(1).max(255),
    password: z.string().min(8).max(255),
  });

  const { body, error } = await parseRequest(request, schema, { skipAuth: true });

  if (error) {
    return error();
  }

  const { username, password } = body;

  const existingUser = await getUserByUsername(username, { showDeleted: true });

  if (existingUser) {
    return badRequest({ message: 'User already exists.', code: 'user-already-exists' });
  }

  const user = await createUser({
    id: uuid(),
    username,
    password: hashPassword(password),
    role: ROLES.user,
  });

  let token: string;

  if (redis.enabled) {
    token = await saveAuth({ userId: user.id, role: user.role });
  } else {
    token = createSecureToken({ userId: user.id, role: user.role }, secret());
  }

  const teams = await getAllUserTeams(user.id);

  return json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      isAdmin: user.role === ROLES.admin,
      teams,
    },
  });
}
