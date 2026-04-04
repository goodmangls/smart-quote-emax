import { useEffect, useRef } from 'react';

/**
 * Syncs derived data into QuoteInput via onFieldChange,
 * only when the serialized value changes (avoids infinite re-renders).
 *
 * @param data - source data to watch
 * @param fieldKey - QuoteInput field name to update
 * @param onFieldChange - field setter (typically from QuoteInput state)
 * @param options.transform - optional mapping before storing
 * @param options.skip - when true, skip syncing entirely
 */
export function useSyncToInput<TIn, TOut = TIn>(
  data: TIn,
  fieldKey: string,
  onFieldChange: (key: string, value: TOut) => void,
  options?: {
    transform?: (data: TIn) => TOut;
    skip?: boolean;
  },
): void {
  const prevRef = useRef<string>('');
  const { transform, skip } = options ?? {};

  useEffect(() => {
    if (skip) return;
    const mapped = transform ? transform(data) : (data as unknown as TOut);
    const serialized = JSON.stringify(mapped);
    if (serialized !== prevRef.current) {
      prevRef.current = serialized;
      onFieldChange(fieldKey, mapped);
    }
  }, [data, fieldKey, onFieldChange, transform, skip]);
}
