import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export const useDebounce = <T,>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

export const useDocumentTitle = (title?: string): void => {
  useEffect(() => {
    document.title = title ? `${title} – EstateHub` : 'EstateHub – Modern Real Estate Platform';
  }, [title]);
};

export const useInfiniteScroll = (
  hasMore: boolean,
  loading: boolean,
  onLoadMore: () => void
): void => {
  useEffect(() => {
    if (!hasMore || loading) return undefined;
    const handler = (): void => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
        onLoadMore();
      }
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, [hasMore, loading, onLoadMore]);
};