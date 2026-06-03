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

const SITE_URL = 'https://malachitzuoo.com';
const TITLE = 'Malachi Tzuoo — Software Engineer';
const DESCRIPTION =
  'Software Engineer based in Chicago, IL. AWS Certified Developer. Python, TypeScript, React, cloud-native CI/CD, and generative-AI tooling. Explore my résumé as an interactive 3D solar system.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Malachi Tzuoo — Galaxy Résumé',
  authors: [{name: 'Malachi Tzuoo'}],
  creator: 'Malachi Tzuoo',
  keywords: [
    'Malachi Tzuoo',
    'Software Engineer',
    'Software Developer',
    'AWS Certified Developer',
    'Python',
    'TypeScript',
    'React',
    'Next.js',
    'Generative AI',
    'LangChain',
    'CI/CD',
    'Chicago',
    'Résumé',
    'Portfolio',
  ],
  alternates: {canonical: '/'},
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Malachi Tzuoo — Galaxy Résumé',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * JSON-LD `Person` structured data for SEO / rich results. Rendered as a native
 * <script type="application/ld+json"> (the recommended approach in Next 16; see
 * docs/01-app/02-guides/json-ld.md). `<` is escaped to < to avoid XSS via
 * JSON.stringify, per the same guide.
 */
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Malachi Tzuoo',
  jobTitle: 'Software Engineer',
  url: SITE_URL,
  email: 'mailto:mtzuoo@gmail.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Chicago',
    addressRegion: 'IL',
    addressCountry: 'US',
  },
  sameAs: [
    'https://github.com/NeverLucky2',
    'https://github.com/NeverLucky2/ClaudeProphetAndFriends',
    'https://www.linkedin.com/in/malachi-tzuoo-depaul/',
  ],
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable} h-full`}>
      <body className="bg-[#05030f] text-[#e7f6ff] min-h-full">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
