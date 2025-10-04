import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Processes',
};

export default function ProcessesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
