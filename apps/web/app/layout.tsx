import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brikx PvE Analyzer',
  description: 'Analyseer Programma van Eisen documenten voor Brikx',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
