import Icon from './Icon'
import ShinyText from './reactbits/ShinyText'

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
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/25">
            <Icon name="sensors" className="text-white" size="24px" />
          </div>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight">
            <ShinyText text="Wastra" color="#1f1b17" shineColor="#00647c" speed={2.5} />
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
