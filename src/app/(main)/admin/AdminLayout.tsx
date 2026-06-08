'use client';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { PageBody } from '@/components/common/PageBody';
import { useAdminNavItems } from '@/components/hooks/useAdminNavItems';
import { useLoginQuery, useNavigation } from '@/components/hooks';
import { getFirstAdminNavPath } from '@/lib/admin-nav';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useLoginQuery();
  const { pathname, router } = useNavigation();
  const navItems = useAdminNavItems();

  const isAllowed =
    navItems.length === 0 ||
    navItems.some(({ path }) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (!user?.isAdmin || process.env.cloudMode) {
      return;
    }

    if (!isAllowed && navItems.length > 0) {
      router.replace(getFirstAdminNavPath(navItems));
    }
  }, [isAllowed, navItems, pathname, router, user?.isAdmin]);

  if (!user?.isAdmin || process.env.cloudMode) {
    return null;
  }

  if (!isAllowed) {
    return null;
  }

  return <PageBody>{children}</PageBody>;
}
