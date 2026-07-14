import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { buildSeedClaims, seedFacilities } from '../data/seed';
import { appReducer, type AppAction, type AppState } from './reducer';

function initialState(): AppState {
  return {
    facilities: seedFacilities,
    claims: buildSeedClaims(),
  };
}

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({
  children,
  preloadedState,
}: {
  children: React.ReactNode;
  preloadedState?: AppState;
}) {
  const [state, dispatch] = useReducer(appReducer, preloadedState ?? initialState());
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return value;
}
