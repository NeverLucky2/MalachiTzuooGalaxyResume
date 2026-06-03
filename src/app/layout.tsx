import type {Metadata} from 'next';
import {Orbitron, Inter} from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Malachi Tzuoo — Software Engineer',
  description: 'Software Engineer based in Chicago, IL. AWS Certified Developer. Python, TypeScript, React, cloud-native CI/CD, and generative-AI tooling.',
  openGraph: {
    title: 'Malachi Tzuoo — Software Engineer',
    description: 'Software Engineer based in Chicago, IL. AWS Certified Developer.',
    type: 'website',
  },
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable} h-full`}>
      <body className="bg-[#05030f] text-[#e7f6ff] min-h-full">{children}</body>
    </html>
  );
}
