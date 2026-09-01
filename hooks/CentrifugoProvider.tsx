
import { createContext, useContext, type ReactNode } from 'react';
import { useCentrifugo, type UseCentrifugoReturn } from './useCentrifugo';
import { useAuth } from './useAuth';

const CentrifugoContext = createContext<UseCentrifugoReturn | null>(null);

function CentrifugoInner({ children }: { children: ReactNode }) {
  const centrifugo = useCentrifugo();

  return (
    <CentrifugoContext.Provider value={centrifugo}>
      {children}
    </CentrifugoContext.Provider>
  );
}

export function CentrifugoProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return <CentrifugoInner>{children}</CentrifugoInner>;
}

export function useCentrifugoContext(): UseCentrifugoReturn | null {
  return useContext(CentrifugoContext);
}
