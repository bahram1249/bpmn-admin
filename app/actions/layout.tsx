import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Actions',
};

export default function ActionsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
