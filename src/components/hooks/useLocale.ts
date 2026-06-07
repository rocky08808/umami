import { useEffect } from 'react';
import { DEFAULT_LOCALE, LOCALE_CONFIG } from '@/lib/constants';
import { httpGet } from '@/lib/fetch';
import { getBrowserLocale, getDateLocale, getTextDirection } from '@/lib/lang';
import { getItem, setItem } from '@/lib/storage';
import { setLocale, useApp } from '@/store/app';
import enUS from '../../../public/intl/messages/en-US.json';
import { useForceUpdate } from './useForceUpdate';

const messages = {
  'en-US': enUS,
};

const selector = (state: { locale: string }) => state.locale;

export function useLocale() {
  const locale = useApp(selector);
  const forceUpdate = useForceUpdate();
  const dir = getTextDirection(locale);
  const dateLocale = getDateLocale(locale);

  async function loadMessages(locale: string) {
    const { data } = await httpGet(`${process.env.basePath || ''}/intl/messages/${locale}.json`);

    messages[locale] = data;
  }

  async function saveLocale(value: string) {
    if (!messages[value]) {
      await loadMessages(value);
    }

    setItem(LOCALE_CONFIG, value);

    document.getElementById('__next')?.setAttribute('dir', getTextDirection(value));

    if (locale !== value) {
      setLocale(value);
    } else {
      forceUpdate();
    }
  }

  useEffect(() => {
    if (!messages[locale]) {
      saveLocale(locale);
    }
  }, [locale]);

  useEffect(() => {
    const url = new URL(window?.location?.href);
    const urlLocale = url.searchParams.get('locale');

    if (urlLocale) {
      saveLocale(urlLocale);
      return;
    }

    if (!getItem(LOCALE_CONFIG) && !process.env.defaultLocale) {
      const browserLocale = getBrowserLocale(DEFAULT_LOCALE);
      if (browserLocale !== locale) {
        saveLocale(browserLocale);
      }
    }
  }, []);

  return { locale, saveLocale, messages, dir, dateLocale };
}
