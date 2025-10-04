import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Conditions',
};

export default function ConditionsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
