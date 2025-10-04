import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Request States',
};

export default function RequestStatesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
