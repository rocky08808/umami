import type { ReactNode } from 'react';
import { Globe, PanelsLeftBottom, User, Users, Wallet } from '@/components/icons';
import { canAccessAdminNavItem } from '@/lib/admin-nav';
import { useConfig } from './useConfig';
import { useLoginQuery } from './queries/useLoginQuery';
import { useMessages } from './useMessages';

export type AdminNavItem = {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
};

export function useAdminNavItems(): AdminNavItem[] {
  const { user } = useLoginQuery();
  const config = useConfig();
  const { t, labels } = useMessages();

  const items: (AdminNavItem & { permission: Parameters<typeof canAccessAdminNavItem>[0] })[] = [
    {
      id: 'overview',
      permission: 'overview',
      label: t('admin.overview'),
      path: '/admin',
      icon: <PanelsLeftBottom />,
    },
    {
      id: 'users',
      permission: 'users',
      label: t(labels.users),
      path: '/admin/users',
      icon: <User />,
    },
    {
      id: 'websites',
      permission: 'websites',
      label: t(labels.websites),
      path: '/admin/websites',
      icon: <Globe />,
    },
    {
      id: 'teams',
      permission: 'teams',
      label: t(labels.teams),
      path: '/admin/teams',
      icon: <Users />,
    },
    {
      id: 'recharge',
      permission: 'recharge',
      label: t(labels.rechargeReview),
      path: '/admin/recharge',
      icon: <Wallet />,
    },
  ];

  return items
    .filter(({ permission }) => canAccessAdminNavItem(permission, user, config))
    .map(({ permission: _permission, ...item }) => item);
}
