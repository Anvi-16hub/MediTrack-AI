import { useContext } from 'react';

import { AppStateContext } from '@/providers/app-state-context';

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider.');
  return context;
}