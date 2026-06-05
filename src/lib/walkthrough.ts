/** A single walkthrough step. `target` is the `data-tour` value of the control to
 *  spotlight, or null for a centered card (the ship is a 3D object, not a DOM node). */
export interface TourStep {
  key: 'land' | 'fly' | 'menu' | 'name' | 'ship';
  target: 'land' | 'fly' | 'menu' | 'name' | null;
  title: string;
  body: string;
}

/** The opening tour's steps, adapted to touch (`compact`) vs desktop controls. */
export function tourSteps(compact: boolean): TourStep[] {
  return [
    {
      key: 'land',
      target: 'land',
      title: 'Land on a planet',
      body: compact
        ? 'Tap any planet to land on it and read that section. Drag anywhere to look around first.'
        : 'Click any planet to land on it (or press Enter). Drag to look around first.',
    },
    {
      key: 'fly',
      target: 'fly',
      title: 'Fly between planets',
      body: compact
        ? 'Use ◀ and ▶ to fly to the other planets.'
        : 'Use ◀ and ▶ (or the arrow keys) to fly between planets.',
    },
    {
      key: 'menu',
      target: 'menu',
      title: 'Jump anywhere',
      body: compact
        ? 'Open the ☰ menu to jump straight to any section.'
        : 'Use the starmap to jump straight to any section.',
    },
    {
      key: 'name',
      target: 'name',
      title: 'Open the résumé',
      body: 'Tap your name tag in the corner to jump to the full résumé view any time.',
    },
    {
      key: 'ship',
      target: null,
      title: 'Hidden mini-game',
      body: compact
        ? 'See the little ship orbiting your planet? Tap it for a hidden asteroid game — you can turn this off in the ☰ menu.'
        : 'See the little ship orbiting your planet? Click it for a hidden asteroid game — you can turn this off in Settings.',
    },
  ];
}
