import {FallbackResume} from '@/components/fallback/FallbackResume';
import {GalaxyExperience} from '@/components/GalaxyExperience';

export default function Page() {
  return (
    <>
      {/* SSR, crawlable, works without JS; the 3D scene mounts over it when enabled */}
      <FallbackResume />
      <GalaxyExperience />
    </>
  );
}
