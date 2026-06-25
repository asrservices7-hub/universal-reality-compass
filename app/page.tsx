'use client';

import dynamic from 'next/dynamic';

const UniversalCompassContainer = dynamic(
  () => import('@/components/UniversalCompassContainer'),
  { ssr: false }
);

export default function Home() {
  return <UniversalCompassContainer />;
}
