import { create } from 'zustand';

const store = create(() => ({}));

export function touch(key: string) {
  store.setState({ [key]: Date.now() });
}

export function useModified(key?: string) {
  const modified = store(state => (key ? state?.[key] : undefined));

  return {
    modified,
    touch: (touchKey?: string) => touch(touchKey ?? key),
  };
}
