import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import BlurText from '../components/reactbits/BlurText'

export default function Admin() {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const tools = [
    {
      to: '/dashboard',
      icon: 'query_stats',
      title: lang === 'en' ? 'Tourism Dashboard' : 'Dashboard Pengelola',
      desc:
        lang === 'en'
          ? 'Real-time density overview, heatmap, forecasts, and export reports.'
          : 'Pantauan kepadatan real-time, heatmap, prediksi, dan export laporan.',
      cta: lang === 'en' ? 'Open Dashboard' : 'Buka Dashboard',
    },
    {
      to: '/app/ai-agent',
      icon: 'smart_toy',
      title: lang === 'en' ? 'AI Agent' : 'AI Agent',
      desc:
        lang === 'en'
          ? 'Configure provider, API key, model, system prompt, and safeguards.'
          : 'Atur provider, API key, model, system prompt, dan safeguard.',
      cta: lang === 'en' ? 'Manage AI Agent' : 'Kelola AI Agent',
    },
    {
      to: '/app/user-management',
      icon: 'manage_accounts',
      title: lang === 'en' ? 'User Management' : 'Manajemen User',
      desc:
        lang === 'en'
          ? 'Browse users and grant or revoke the admin role.'
          : 'Lihat user terdaftar dan beri atau cabut role admin.',
      cta: lang === 'en' ? 'Manage Users' : 'Kelola User',
    },
    {
      to: '/app/audit-logs',
      icon: 'receipt_long',
      title: lang === 'en' ? 'Audit Logs' : 'Audit Logs',
      desc:
        lang === 'en'
          ? 'Trail of every admin action — settings, role grants, AI key rotations.'
          : 'Jejak semua aksi admin — setting, pemberian role, rotasi API key.',
      cta: lang === 'en' ? 'View Logs' : 'Lihat Logs',
    },
  ]

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-4xl">
      {/* Header */}
      <SpotlightCard
        spotlightColor="rgba(0, 100, 124, 0.15)"
        className="bg-gradient-to-br from-surface-container-low via-white to-primary-fixed/30 rounded-[2rem] p-8 border border-stone-200/60"
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {lang === 'en' ? 'Admin Panel' : 'Panel Admin'}
        </span>
        <BlurText
          text={lang === 'en' ? 'Admin Panel' : 'Panel Admin'}
          as="h1"
          animateBy="words"
          delay={80}
          className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline mt-2"
        />
        <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
          {lang === 'en'
            ? 'Runtime configuration tools. Changes apply immediately without redeploy.'
            : 'Konfigurasi runtime. Perubahan langsung berlaku tanpa redeploy.'}
        </p>
      </SpotlightCard>

      {/* Tools grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <SpotlightCard
              spotlightColor="rgba(0, 100, 124, 0.15)"
              className="bg-surface-container-lowest rounded-3xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow h-full"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                  <Icon name={tool.icon} size="24px" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-extrabold font-headline text-on-surface">{tool.title}</h2>
                  <p className="text-sm text-on-surface-variant mt-1">{tool.desc}</p>
                  <Link
                    to={tool.to}
                    className="mt-4 inline-flex items-center gap-1.5 bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-full hover:bg-primary-container transition-colors"
                  >
                    {tool.cta}
                    <Icon name="arrow_forward" size="14px" />
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

    </div>
  )
}
