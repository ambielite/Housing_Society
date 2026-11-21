import { useCallback, useRef, useState } from 'react';
import { dispatchActionToast } from './actionToastEvents';

/** Keep existing message state APIs while presenting feedback as dashboard popups. */
export function useDashboardFeedback(initialValue = '', type = 'error') {
  const [value, setValue] = useState(initialValue);
  const valueRef = useRef(initialValue);

  const update = useCallback((nextValue) => {
    const next = typeof nextValue === 'function' ? nextValue(valueRef.current) : nextValue;
    valueRef.current = next;
    setValue(next);
    const messages = typeof next === 'string'
      ? [next.trim()]
      : next && typeof next === 'object'
        ? Object.values(next).flatMap((item) => Array.isArray(item) ? item : [item])
          .filter((item) => typeof item === 'string' && item.trim())
          .map((item) => item.trim())
        : [];
    if (messages.length) dispatchActionToast(type, [...new Set(messages)].join(' '));
  }, [type]);

  return [value, update];
}
