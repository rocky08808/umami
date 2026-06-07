import type { Metadata } from 'next';
import { IntegrationPage } from './IntegrationPage';

export default function () {
  return <IntegrationPage />;
}

export const metadata: Metadata = {
  title: 'Integration',
};
