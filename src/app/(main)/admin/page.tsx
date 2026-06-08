import type { Metadata } from 'next';
import { AdminOverviewPage } from './overview/AdminOverviewPage';

export default function () {
  return <AdminOverviewPage />;
}

export const metadata: Metadata = {
  title: 'Overview',
};
