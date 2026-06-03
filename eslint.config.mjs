import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // --- React Three Fiber: scoped relaxation of the React Compiler hooks rules ---
  // R3F's render loop is imperative by design. Every frame, `useFrame` callbacks
  // mutate `ref.current` (Object3D transforms) and a shared `motion` object, and
  // scene seeds (starfields, galaxies, comets) are generated ONCE with
  // `Math.random()` in the component body / a `useMemo`. The new `react-hooks`
  // purity/immutability/refs rules flag these idiomatic patterns as impure, but
  // they are correct and intentional here. We turn them OFF only for the files
  // that legitimately need it — NOT project-wide. Pure logic elsewhere (data,
  // reducers, camera math) keeps the full rule set.
  {
    files: [
      "src/components/three/**/*.{ts,tsx}",
      "src/hooks/useGalaxyControls.ts",
      "src/lib/procedural.ts",
    ],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },

  // GalaxyExperience detects browser capabilities (WebGL / reduced-motion) on
  // mount — values that cannot be known during render or SSR — and sets state
  // from that one-time detection. This is the legitimate "synchronize with an
  // external system" effect pattern; the synchronous setState is intentional.
  {
    files: ["src/components/GalaxyExperience.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
