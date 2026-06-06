import Logo from './Logo'

/**
 * Full-viewport branded loader shown while a lazy route loads.
 * Wired into <Suspense fallback> in App.tsx.
 */
export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-surface via-white to-primary-fixed/20">
      {/* Decorative gradient blobs */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center gap-5">
        <div className="flex items-center gap-3">
          <Logo size={48} eager />
          <h1 className="text-3xl font-extrabold font-headline tracking-tight bg-gradient-to-r from-[#1f1b17] via-[#00647c] to-[#1f1b17] bg-clip-text text-transparent">
            Wastra
          </h1>
        </div>

        <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant font-bold">
          Smart Tourism Platform
        </p>

        {/* Three pulsing dots */}
        <div className="flex items-center gap-2 mt-2" role="status" aria-label="Loading">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
