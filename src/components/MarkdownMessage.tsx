import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { Link } from 'react-router-dom'
import Icon from './Icon'

// ── Emoji → Material Symbol mapping ──────────────────────────────────────────
const EMOJI_ICON_MAP: Record<string, { name: string; color: string }> = {
  '🎫': { name: 'local_activity',    color: 'text-violet-500'  },
  '🏨': { name: 'hotel',             color: 'text-blue-500'    },
  '🍽️': { name: 'restaurant',       color: 'text-orange-500'  },
  '🎯': { name: 'sports_esports',    color: 'text-green-500'   },
  '🌿': { name: 'eco',               color: 'text-emerald-500' },
  '🌊': { name: 'waves',             color: 'text-cyan-500'    },
  '🏖️': { name: 'beach_access',     color: 'text-amber-500'   },
  '⛰️': { name: 'landscape',        color: 'text-on-surface-variant'   },
  '🗺️': { name: 'map',              color: 'text-indigo-500'  },
  '📍': { name: 'location_on',       color: 'text-red-500'     },
  '🕐': { name: 'schedule',          color: 'text-slate-500'   },
  '⏰': { name: 'alarm',             color: 'text-slate-500'   },
  '💰': { name: 'payments',          color: 'text-yellow-600'  },
  '💡': { name: 'lightbulb',         color: 'text-yellow-500'  },
  '✅': { name: 'check_circle',      color: 'text-green-500'   },
  '⚠️': { name: 'warning',          color: 'text-amber-500'   },
  '❌': { name: 'cancel',            color: 'text-red-500'     },
  '⭐': { name: 'star',              color: 'text-amber-400'   },
  '🌟': { name: 'auto_awesome',      color: 'text-amber-400'   },
  '📅': { name: 'calendar_month',    color: 'text-blue-500'    },
  '🚗': { name: 'directions_car',    color: 'text-slate-600'   },
  '🚶': { name: 'directions_walk',   color: 'text-slate-600'   },
  '📸': { name: 'photo_camera',      color: 'text-pink-500'    },
  '🎨': { name: 'palette',           color: 'text-purple-500'  },
  '🧘': { name: 'self_improvement',  color: 'text-teal-500'    },
  '🏄': { name: 'surfing',           color: 'text-cyan-600'    },
  '🌺': { name: 'local_florist',     color: 'text-pink-400'    },
  '🍜': { name: 'ramen_dining',      color: 'text-orange-400'  },
  '☕': { name: 'coffee',            color: 'text-yellow-800'  },
  '🎭': { name: 'theater_comedy',    color: 'text-purple-500'  },
  '🌙': { name: 'nights_stay',       color: 'text-indigo-400'  },
  '☀️': { name: 'wb_sunny',         color: 'text-amber-400'   },
  '🌧️': { name: 'rainy',            color: 'text-blue-400'    },
  '🤿': { name: 'scuba_diving',      color: 'text-cyan-500'    },
  '🧗': { name: 'hiking',            color: 'text-on-surface-variant'   },
  '🎪': { name: 'celebration',       color: 'text-violet-500'  },
  '🏛️': { name: 'account_balance',  color: 'text-on-surface-variant'   },
  '🐒': { name: 'pets',              color: 'text-amber-700'   },
}

// ── Replace emoji chars in a string node with Icon components ─────────────────
function renderTextWithIcons(text: string): React.ReactNode[] {
  if (!text) return [text]

  const emojiList = Object.keys(EMOJI_ICON_MAP)
  const emojiPattern = new RegExp(
    emojiList.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'g'
  )

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = emojiPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const emoji = match[0]
    const iconDef = EMOJI_ICON_MAP[emoji]
    if (iconDef) {
      parts.push(
        <Icon
          key={`${emoji}-${match.index}`}
          name={iconDef.name}
          size="17px"
          className={`${iconDef.color} align-middle relative -top-px mx-0.5`}
        />
      )
    } else {
      parts.push(emoji)
    }
    lastIndex = match.index + emoji.length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

// ── Only override the text node renderer to swap emojis → icons ───────────────
const markdownComponents: Components = {
  text: ({ children }) => {
    if (typeof children !== 'string') return <>{children}</>
    return <>{renderTextWithIcons(children)}</>
  },
  // Links stay as-is but open in new tab, EXCEPT internal /app/destinasi/ links which become nice buttons
  a: ({ href, children }) => {
    if (href?.startsWith('/app/destinasi/') || href?.startsWith('/destinasi/')) {
      // normalize to /app/destinasi/...
      const destUrl = href.startsWith('/app/') ? href : `/app${href}`
      
      return (
        <span className="block mt-3 mb-1">
          <Link
            to={destUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-full hover:bg-primary-container hover:text-on-primary-container hover:shadow-md transition-all border border-transparent hover:border-primary/20"
          >
            <Icon name="local_activity" size="16px" />
            {children}
          </Link>
        </span>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
      >
        {children}
      </a>
    )
  },
  p:          ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul:         ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li:         ({ children }) => <li className="text-sm">{children}</li>,
  strong:     ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
  h1:         ({ children }) => <h1 className="text-base font-bold text-on-surface mt-3 mb-1">{children}</h1>,
  h2:         ({ children }) => <h2 className="text-sm font-bold text-on-surface mt-2.5 mb-1">{children}</h2>,
  h3:         ({ children }) => <h3 className="text-sm font-semibold text-on-surface mt-2 mb-0.5">{children}</h3>,
  hr:         () => <hr className="my-3 border-outline-variant/70" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-on-surface-variant italic text-xs">
      {children}
    </blockquote>
  ),
}

// ── Public component ──────────────────────────────────────────────────────────
export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-sm text-on-surface">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  )
}
