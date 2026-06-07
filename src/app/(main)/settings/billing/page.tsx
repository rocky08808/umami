import type { Metadata } from 'next';
import { BillingPage } from './BillingPage';

export default function () {
  return <BillingPage />;
}

export const metadata: Metadata = {
  title: 'Billing',
};
