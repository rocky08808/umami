import { ROLES } from '@/lib/constants';
import prisma from '@/lib/prisma';

function getOwnerWebsitesWhere(userId: string) {
  return {
    deletedAt: null,
    OR: [
      { userId, teamId: null },
      {
        team: {
          members: {
            some: {
              userId,
              role: ROLES.teamOwner,
            },
          },
        },
      },
    ],
  };
}

export async function getOwnerWebsiteCount(userId: string) {
  return prisma.client.website.count({
    where: getOwnerWebsitesWhere(userId),
  });
}

export async function getOwnerWebsiteIds(userId: string) {
  const websites = await prisma.client.website.findMany({
    where: getOwnerWebsitesWhere(userId),
    select: { id: true },
  });

  return websites.map(website => website.id);
}
