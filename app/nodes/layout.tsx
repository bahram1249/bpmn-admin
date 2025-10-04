import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Nodes',
};

export default function NodesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
