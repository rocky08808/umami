import type { Metadata } from 'next';
import { isRegistrationEnabled } from '@/lib/register';
import { RegisterPage } from './RegisterPage';

export default async function () {
  if (!isRegistrationEnabled()) {
    return null;
  }

  return <RegisterPage />;
}

export const metadata: Metadata = {
  title: 'Register',
};
