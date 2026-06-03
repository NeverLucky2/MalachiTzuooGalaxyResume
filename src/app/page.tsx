import {FallbackResume} from '@/components/fallback/FallbackResume';
import {GalaxyExperience} from '@/components/GalaxyExperience';

export default function Page() {
  return (
    <>
      {/* SSR, crawlable, works without JS. Hidden via [data-mode="galaxy"] CSS
          while the 3D scene is up, so its text never bleeds through the canvas. */}
      <div id="resume-2d">
        <FallbackResume />
      </div>
      <GalaxyExperience />
    </>
  );
}
