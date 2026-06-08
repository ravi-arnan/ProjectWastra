import { motion } from 'motion/react';
import type { Transition, Easing } from 'motion/react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, string | number>;
  animationTo?: Array<Record<string, string | number>>;
  easing?: Easing | Easing[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
  as?: keyof React.JSX.IntrinsicElements;
};

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);
  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])];
  });
  return keyframes;
};

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.35,
  as = 'p'
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const prefersReducedMotion = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // Reduced motion: render the text immediately, no reveal animation.
    if (prefersReducedMotion) {
      setInView(true);
      return;
    }
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin, prefersReducedMotion]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, y: -50 }
        : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 }
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));

  const Tag = as as React.ElementType;

  return (
    <Tag ref={ref as React.RefObject<HTMLElement>} className={`blur-text ${className} flex flex-wrap`}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
        // Final, fully-visible snapshot (last "to" step) — used as the instant
        // target when the user prefers reduced motion.
        const finalSnapshot = toSnapshots[toSnapshots.length - 1];
        const spanTransition: Transition = prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: totalDuration,
              times,
              delay: (index * delay) / 1000,
              ease: easing
            };
        return (
          <motion.span
            key={index}
            initial={prefersReducedMotion ? false : fromSnapshot}
            animate={prefersReducedMotion ? finalSnapshot : inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
            style={{
              display: 'inline-block',
              willChange: 'transform, filter, opacity'
            }}
          >
            {segment === ' ' ? ' ' : segment}
            {animateBy === 'words' && index < elements.length - 1 && ' '}
          </motion.span>
        );
      })}
    </Tag>
  );
};

export default BlurText;
