import type { Config } from '@/components/hooks/useConfig';
import { ROLES } from '@/lib/constants';

export type AdminNavItemId = 'overview' | 'users' | 'websites' | 'teams' | 'recharge' | 'wallet';

export type AdminNavUser = {
  isAdmin: boolean;
  role: string;
};

export function canAccessAdminNavItem(
  item: AdminNavItemId,
  user?: AdminNavUser | null,
  config?: Config | null,
): boolean {
  if (!user?.isAdmin) {
    return false;
  }

  switch (item) {
    case 'overview':
    case 'users':
    case 'websites':
    case 'teams':
      return true;
    case 'recharge':
      return !!config?.usdtWalletAddress;
    case 'wallet':
      return true;
    default:
      return false;
  }
}

export function canAccessSettingsBilling(user?: AdminNavUser | null) {
  return !!user && user.role !== ROLES.viewOnly;
}

export function getFirstAdminNavPath(items: { path: string }[]) {
  return items[0]?.path ?? '/admin';
}
