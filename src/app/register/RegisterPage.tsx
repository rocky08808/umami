'use client';
import { Column, Loading } from '@umami/react-zen';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useConfig, useLoginQuery } from '@/components/hooks';
import { RegisterForm } from './RegisterForm';

export function RegisterPage() {
  const { user, isLoading } = useLoginQuery();
  const config = useConfig();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (config && !config.allowRegistration) {
      router.replace('/login');
    }
  }, [config, router]);

  if (isLoading || user || !config?.allowRegistration) {
    return <Loading placement="absolute" />;
  }

  return (
    <Column
      alignItems="center"
      justifyContent="flex-start"
      height="100vh"
      backgroundColor="surface-raised"
      style={{ paddingTop: '15vh' }}
    >
      <RegisterForm />
    </Column>
  );
}
