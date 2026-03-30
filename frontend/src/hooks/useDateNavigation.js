import { useState, useCallback } from 'react';

/**
 * Date navigation hook for day, month, and year modes
 */
export function useDateNavigation(mode = 'day') {
  const [date, setDate] = useState(new Date());

  const formatDate = useCallback((d) => {
    return d.toISOString().split('T')[0];
  }, []);

  const goToday = useCallback(() => setDate(new Date()), []);

  const goPrev = useCallback(() => {
    setDate(prev => {
      const d = new Date(prev);
      if (mode === 'day') d.setDate(d.getDate() - 1);
      else if (mode === 'month') d.setMonth(d.getMonth() - 1);
      else if (mode === 'year') d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  }, [mode]);

  const goNext = useCallback(() => {
    setDate(prev => {
      const d = new Date(prev);
      if (mode === 'day') d.setDate(d.getDate() + 1);
      else if (mode === 'month') d.setMonth(d.getMonth() + 1);
      else if (mode === 'year') d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  }, [mode]);

  const dateStr = formatDate(date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const displayLabel = mode === 'day'
    ? date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : mode === 'month'
      ? date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : String(year);

  return { date, dateStr, year, month, displayLabel, setDate, goPrev, goNext, goToday };
}

export default useDateNavigation;
