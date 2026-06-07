import type { Metadata } from 'next';
import { AdminRechargePage } from './AdminRechargePage';

export default function () {
  return <AdminRechargePage />;
}

export const metadata: Metadata = {
  title: 'Recharge Orders',
};
