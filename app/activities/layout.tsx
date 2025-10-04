import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Activities',
};

export default function ActivitiesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
