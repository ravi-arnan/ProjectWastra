import { useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';

interface ScrollRevealProps {
  children: ReactNode;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
}

interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  baseOpacity: number;
  enableBlur: boolean;
  blurStrength: number;
}

// Each word maps a slice of the container's scroll progress to its own
// opacity (and optional blur), which reproduces GSAP's scrubbed stagger reveal.
function Word({ children, progress, range, baseOpacity, enableBlur, blurStrength }: WordProps) {
  const opacity = useTransform(progress, range, [baseOpacity, 1]);
  const filter = useTransform(progress, range, [`blur(${blurStrength}px)`, 'blur(0px)']);
  return (
    <motion.span
      className="inline-block"
      style={{ opacity, willChange: 'opacity, filter', ...(enableBlur ? { filter } : {}) }}
    >
      {children}
    </motion.span>
  );
}

export default function ScrollReveal({
  children,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  // Drive every word + the container rotation from one scroll progress value.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end center'],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [baseRotation, 0]);

  // Pre-compute each token plus its scroll-progress window (null for whitespace).
  // Done in a memo so render stays side-effect free.
  const tokens = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    const parts = text.split(/(\s+)/);
    const wordCount = parts.filter((part) => !/^\s+$/.test(part)).length;
    return parts.reduce<{
      acc: { text: string; range: [number, number] | null }[];
      seen: number;
    }>(
      (state, part) => {
        if (/^\s+$/.test(part)) {
          return { acc: [...state.acc, { text: part, range: null }], seen: state.seen };
        }
        const start = wordCount > 0 ? (state.seen / wordCount) * 0.7 : 0;
        const range: [number, number] = [start, Math.min(start + 0.3, 1)];
        return { acc: [...state.acc, { text: part, range }], seen: state.seen + 1 };
      },
      { acc: [], seen: 0 },
    ).acc;
  }, [children]);

  return (
    <motion.h2
      ref={containerRef}
      className={`my-5 ${containerClassName}`}
      style={{ rotate, transformOrigin: '0% 50%' }}
    >
      <p className={`text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold ${textClassName}`}>
        {tokens.map((token, index) =>
          token.range === null ? (
            token.text
          ) : (
            <Word
              key={index}
              progress={scrollYProgress}
              range={token.range}
              baseOpacity={baseOpacity}
              enableBlur={enableBlur}
              blurStrength={blurStrength}
            >
              {token.text}
            </Word>
          ),
        )}
      </p>
    </motion.h2>
  );
}
