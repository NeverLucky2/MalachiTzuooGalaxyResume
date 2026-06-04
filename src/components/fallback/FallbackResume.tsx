import {ResumeSections} from './ResumeSections';

/** Stable id for the résumé's main heading; the galaxy "skip to resume" control
 *  moves keyboard focus here when switching to the 2D view. */
export const RESUME_HEADING_ID = 'resume-heading';

export function FallbackResume() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-[#e7f6ff]">
      <header className="mb-8">
        {/* tabIndex={-1} makes the heading programmatically focusable so the skip
            control can move focus here without adding it to the tab order. */}
        <h1
          id={RESUME_HEADING_ID}
          tabIndex={-1}
          className="font-display text-3xl font-black outline-none"
        >
          Malachi Tzuoo
        </h1>
        <p className="opacity-70">Software Engineer · Chicago, IL · AWS Certified Developer</p>
      </header>
      <ResumeSections />
    </main>
  );
}
