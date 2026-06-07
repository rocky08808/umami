import {
  Button,
  Column,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  Heading,
  Icon,
  PasswordField,
  Row,
  Text,
  TextField,
} from '@umami/react-zen';
import { useRouter } from 'next/navigation';
import { useMessages, useUpdateQuery } from '@/components/hooks';
import { Logo } from '@/components/svg';
import { setClientAuthToken } from '@/lib/client';
import { setUser } from '@/store/app';

export function RegisterForm() {
  const { t, labels, messages, getErrorMessage } = useMessages();
  const router = useRouter();
  const { mutateAsync, error } = useUpdateQuery('/auth/register');

  const samePassword = (value: string, values: Record<string, any>) => {
    if (value !== values.password) {
      return t(messages.noMatchPassword);
    }
  };

  const handleSubmit = async (data: any) => {
    await mutateAsync(
      {
        username: data.username,
        password: data.password,
      },
      {
        onSuccess: async ({ token, user }) => {
          setClientAuthToken(token);
          setUser(user);
          router.push('/');
        },
      },
    );
  };

  return (
    <Column justifyContent="center" alignItems="center" gap="6">
      <Icon size="lg">
        <Logo />
      </Icon>
      <Heading>statistics</Heading>
      <Form onSubmit={handleSubmit} error={getErrorMessage(error)} style={{ minWidth: 300 }}>
        <FormField
          label={t(labels.username)}
          data-test="input-username"
          name="username"
          rules={{ required: t(labels.required) }}
        >
          <TextField autoComplete="username" />
        </FormField>

        <FormField
          label={t(labels.password)}
          data-test="input-password"
          name="password"
          rules={{
            required: t(labels.required),
            minLength: { value: 8, message: t(messages.minPasswordLength, { n: '8' }) },
          }}
        >
          <PasswordField autoComplete="new-password" />
        </FormField>

        <FormField
          label={t(labels.confirmPassword)}
          data-test="input-confirm-password"
          name="confirmPassword"
          rules={{
            required: t(labels.required),
            validate: samePassword,
          }}
        >
          <PasswordField autoComplete="new-password" />
        </FormField>

        <FormButtons>
          <FormSubmitButton
            data-test="button-submit"
            variant="primary"
            style={{ flex: 1 }}
            isDisabled={false}
          >
            {t(labels.register)}
          </FormSubmitButton>
        </FormButtons>
      </Form>

      <Row gap="1" alignItems="center">
        <Text color="muted" size="sm">
          {t(messages.haveAccount)}
        </Text>
        <Button variant="quiet" size="sm" onPress={() => router.push('/login')}>
          {t(labels.login)}
        </Button>
      </Row>
    </Column>
  );
}
