export function isRegistrationEnabled() {
  if (process.env.CLOUD_MODE || process.env.DISABLE_LOGIN) {
    return false;
  }

  return process.env.ALLOW_REGISTRATION !== 'false';
}
