export type CustomerServiceConfig = {
  label: string;
  contact: string;
  link?: string;
};

export function getCustomerServiceConfig(): CustomerServiceConfig | null {
  const label = process.env.CUSTOMER_SERVICE_LABEL?.trim();
  const contact = process.env.CUSTOMER_SERVICE_CONTACT?.trim();
  const link = (
    process.env.CUSTOMER_SERVICE_URL
    || process.env.CUSTOMER_SERVICE_LINK
    || ''
  ).trim();

  if (!contact && !link) {
    return null;
  }

  return {
    label: label || 'Customer Service',
    contact: contact || link,
    link: link || undefined,
  };
}
