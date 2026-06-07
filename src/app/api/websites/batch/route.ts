import { z } from 'zod';
import { ENTITY_TYPE } from '@/lib/constants';
import { uuid } from '@/lib/crypto';
import { getRandomChars } from '@/lib/generate';
import { fetchAccount } from '@/lib/load';
import { parseRequest } from '@/lib/request';
import { badRequest, json, serverError, unauthorized } from '@/lib/response';
import { isValidDomain } from '@/lib/websites';
import { canCreateTeamWebsite, canCreateWebsite } from '@/permissions';
import { createShare, createWebsite, getWebsiteCount } from '@/queries/prisma';

const CLOUD_WEBSITE_LIMIT = 3;
const MAX_BATCH_SIZE = 50;

export async function POST(request: Request) {
  try {
    const schema = z.object({
      domains: z.array(z.string().max(500)).min(1).max(MAX_BATCH_SIZE),
      teamId: z.preprocess(
        value => (value === '' || value === null ? undefined : value),
        z.uuid().optional(),
      ),
    });

    const { auth, body, error } = await parseRequest(request, schema);

    if (error) {
      return error();
    }

    const { domains, teamId } = body;

    if ((teamId && !(await canCreateTeamWebsite(auth, teamId))) || !(await canCreateWebsite(auth))) {
      return unauthorized();
    }

    if (process.env.CLOUD_MODE && !teamId) {
      const account = await fetchAccount(auth.user.id);

      if (!account?.hasSubscription) {
        const count = await getWebsiteCount(auth.user.id);

        if (count + domains.length > CLOUD_WEBSITE_LIMIT) {
          return unauthorized({ message: 'Website limit reached.' });
        }
      }
    }

    const created: { id: string; name: string; domain: string; shareId: string | null }[] = [];
    const failed: { domain: string; reason: string }[] = [];

    for (const domain of domains) {
      if (!isValidDomain(domain)) {
        failed.push({ domain, reason: 'invalid-domain' });
        continue;
      }

      try {
        const data: Record<string, unknown> = {
          id: uuid(),
          createdBy: auth.user.id,
          name: domain.slice(0, 100),
          domain,
        };

        if (teamId) {
          data.teamId = teamId;
        } else {
          data.userId = auth.user.id;
        }

        const website = await createWebsite(data as any);

        let shareId: string | null = null;

        try {
          const share = await createShare({
            id: uuid(),
            entityId: website.id,
            shareType: ENTITY_TYPE.website,
            name: website.name,
            slug: getRandomChars(16),
            parameters: { overview: true, events: true },
          });
          shareId = share.slug;
        } catch {
          shareId = null;
        }

        created.push({
          id: website.id,
          name: website.name,
          domain: website.domain,
          shareId,
        });
      } catch {
        failed.push({ domain, reason: 'create-failed' });
      }
    }

    if (!created.length && failed.length) {
      return badRequest({
        message: 'No websites were created.',
        code: 'batch-create-failed',
      });
    }

    return json({ created, failed });
  } catch (e) {
    console.error('Batch website create failed:', e);
    return serverError({ message: 'Batch website create failed.' });
  }
}
