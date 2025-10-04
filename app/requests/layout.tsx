import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Requests',
};

export default function RequestsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
