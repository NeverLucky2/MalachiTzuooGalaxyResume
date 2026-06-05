/** Small 2D Interceptor silhouette for the locked teaser (color via currentColor). */
export function InterceptorIcon({className = ''}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 150" className={className} fill="currentColor" aria-hidden="true">
      <polygon points="56,66 18,118 44,116 56,96" />
      <polygon points="64,66 102,118 76,116 64,96" />
      <polygon points="60,12 52,60 52,116 68,116 68,60" />
      <rect x="51" y="114" width="8" height="17" rx="3" />
      <rect x="61" y="114" width="8" height="17" rx="3" />
    </svg>
  );
}
