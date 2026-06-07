import { DOMAIN_REGEX } from '@/lib/constants';

export function normalizeDomainInput(value: string) {
  let domain = value.trim();

  if (!domain) {
    return '';
  }

  domain = domain.replace(/^https?:\/\//i, '');
  domain = domain.split('/')[0]?.split('?')[0] ?? '';
  domain = domain.replace(/\/+$/, '');

  return domain.toLowerCase();
}

export function parseBatchDomains(input: string) {
  const domains: string[] = [];
  const seen = new Set<string>();

  for (const line of input.split(/\r?\n/)) {
    const domain = normalizeDomainInput(line);

    if (!domain || seen.has(domain)) {
      continue;
    }

    seen.add(domain);
    domains.push(domain);
  }

  return domains;
}

export function isValidDomain(domain: string) {
  return DOMAIN_REGEX.test(domain);
}
