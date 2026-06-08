import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';

export async function createUserLoginEvent(userId: string) {
  const id = uuid();

  if (prisma.client.userLoginEvent) {
    return prisma.client.userLoginEvent.create({
      data: {
        id,
        userId,
      },
    });
  }

  return prisma.rawQuery(
    `
    insert into user_login_event (user_login_event_id, user_id, created_at)
    values ({{id}}, {{userId}}, now())
    `,
    { id, userId },
  );
}
