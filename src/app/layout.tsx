import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'GraphAnatomy — Anatomy in context', description: 'Explore hand anatomy in 3D, follow anatomical relationships, and retrieve source-backed evidence.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
