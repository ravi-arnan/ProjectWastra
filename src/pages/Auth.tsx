import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { appOrigin } from '../lib/platform';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import PageLoader from '../components/PageLoader';
import BlurText from '../components/reactbits/BlurText';
import GradientText from '../components/reactbits/GradientText';
import ShinyText from '../components/reactbits/ShinyText';
import Magnet from '../components/reactbits/Magnet';
import StarBorder from '../components/reactbits/StarBorder';

type Tab = 'login' | 'signup';

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/** Official multicolor Google "G" mark (Material Symbols has no brand glyph). */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [needsResend, setNeedsResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const captchaRequired = Boolean(turnstileSiteKey);

  // Only auto-bounce when we just landed here from an email-verification
  // link (Supabase appends #access_token=… on the redirect). Without this
  // guard the effect re-fires on every auth-state change and can race with
  // explicit user navigation (e.g. clicking the Back button).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.hash.includes('access_token')) return;
    if (authLoading || !user || user.is_anonymous) return;
    navigate('/app', { replace: true });
  }, [authLoading, user, navigate]);

  const resetCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  const ensureCaptcha = (): boolean => {
    if (captchaRequired && !captchaToken) {
      setError(t('auth.errors.captchaRequired'));
      return false;
    }
    return true;
  };

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setNeedsResend(false);
  };

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    resetFields();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsResend(false);
    if (!ensureCaptcha()) return;
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      if (authError) throw authError;

      // Check roles before navigating
      if (data.user) {
        const [{ data: adminData }, { data: managerData }] = await Promise.all([
          supabase.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle(),
          supabase.from('local_managers').select('destination_id').eq('user_id', data.user.id).maybeSingle()
        ]);
        
        if (adminData) {
          navigate('/app/admin');
          return;
        }
        
        if (managerData) {
          navigate('/dashboard');
          return;
        }
      }
      
      navigate('/app');
    } catch (err: any) {
      const code: string | undefined = err?.code;
      const msg: string = err?.message || '';
      const isUnconfirmed =
        code === 'email_not_confirmed' || /email not confirmed/i.test(msg);
      if (isUnconfirmed) {
        setError(t('auth.errors.emailNotConfirmed'));
        setNeedsResend(true);
      } else {
        setError(msg || t('auth.errors.loginFailed'));
      }
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError(t('auth.errors.emailFirst'));
      return;
    }
    setResending(true);
    setError('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${appOrigin()}/auth`,
          ...(captchaToken ? { captchaToken } : {}),
        },
      });
      if (resendError) throw resendError;
      setSuccess(t('auth.messages.confirmationResent'));
      setNeedsResend(false);
    } catch (err: any) {
      setError(err?.message || t('auth.errors.resendFailed'));
    } finally {
      setResending(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }
    if (!ensureCaptcha()) return;
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${appOrigin()}/auth`,
          ...(captchaToken ? { captchaToken } : {}),
        },
      });
      if (authError) throw authError;
      setSuccess(t('auth.messages.signupSuccess'));
      handleTabSwitch('login');
    } catch (err: any) {
      setError(err.message || t('auth.errors.signupFailed'));
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    if (!ensureCaptcha()) return;
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInAnonymously({
        options: captchaToken ? { captchaToken } : undefined,
      });
      if (authError) throw authError;
      navigate('/app');
    } catch (err: any) {
      setError(err.message || t('auth.errors.guestFailed'));
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // OAuth performs a full-page redirect to Google, then back to /app where
      // the Supabase client exchanges the code for a session (PKCE,
      // detectSessionInUrl). No captcha — Turnstile only gates password/guest.
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${appOrigin()}/app`,
        },
      });
      if (authError) throw authError;
      // On success the browser navigates away; keep the spinner until unload.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : undefined;
      setError(msg || t('auth.errors.googleFailed'));
      setLoading(false);
    }
  };

  const inputGroupClass =
    'bg-white/70 border border-white/60 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-primary/60 focus-within:bg-white transition-colors';
  const inputClass =
    'bg-transparent flex-1 text-sm outline-none placeholder:text-on-surface-variant/60 text-on-surface font-body';
  const guestButtonClass = `w-full bg-white/60 hover:bg-white/85 border border-white/70 text-on-surface rounded-xl py-3 font-headline text-sm tracking-wide flex items-center justify-center gap-2 transition-colors ${
    loading ? 'opacity-70 pointer-events-none' : ''
  }`;

  const googleButton = (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className={`w-full bg-white hover:bg-white/90 border border-white/70 text-on-surface rounded-xl py-3 font-headline text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-sm transition-colors ${
        loading ? 'opacity-70 pointer-events-none' : ''
      }`}
    >
      <GoogleIcon />
      {t('auth.actions.google', { defaultValue: 'Lanjutkan dengan Google' })}
    </button>
  );

  return (
    <div className="relative min-h-dvh overflow-hidden flex items-center justify-center p-4 md:p-6">
      {/* Branded loader shown the moment Back is clicked, so the user gets
          immediate feedback while Landing's lazy chunk + heavy components
          load. Suspense fallback (also PageLoader) takes over after Auth
          unmounts, so the visual stays seamless. */}
      {navigatingBack && <PageLoader />}
      {/* Static image background — swapped from a 1.6MB looping video to a
          127KB still for faster load and lower data/CPU on the auth screen. */}
      <img
        src="/TanahLot-poster.jpg"
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover bg-on-surface"
      />
      {/* Gradient + tint overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-primary/40 pointer-events-none" />
      <div className="absolute inset-0 bg-on-surface/30 pointer-events-none" />

      {/* Back to landing */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-20"
      >
        <button
          type="button"
          onClick={() => {
            // Show the branded loader immediately, then navigate after the
            // next paint so the user gets visual feedback while Landing's
            // heavy lazy chunk + WebGL components mount.
            setNavigatingBack(true)
            requestAnimationFrame(() => navigate('/', { replace: true }))
          }}
          disabled={navigatingBack}
          className="group inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors shadow-lg cursor-pointer"
        >
          <Icon
            name="arrow_back"
            size="18px"
            className="transition-transform group-hover:-translate-x-0.5"
          />
          <span className="hidden sm:inline">{t('common.back')}</span>
        </button>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.005 }}
        className="group relative w-full max-w-[440px] bg-white/70 hover:bg-white/95 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 transition-colors duration-500"
      >
        {/* Branding */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="flex items-center gap-2">
            <Logo size={38} eager />
            <BlurText
              text={t('auth.brand')}
              as="span"
              animateBy="letters"
              direction="top"
              delay={60}
              className="font-headline text-[28px] font-extrabold !flex !flex-row text-on-surface"
            />
          </div>
          <GradientText
            colors={['#00647c', '#007f9d', '#6cd3f7', '#007f9d', '#00647c']}
            animationSpeed={5}
            className="!font-body !text-[10px] !tracking-[0.25em] !uppercase !font-bold"
          >
            <ShinyText
              text={t('auth.subtitle')}
              color="#00647c"
              shineColor="#6cd3f7"
              speed={3}
            />
          </GradientText>
        </div>

        {/* Tab Toggle */}
        <div className="relative bg-surface-container-low/80 rounded-xl p-1 flex">
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-lg shadow-md shadow-primary/20"
            style={{ left: activeTab === 'login' ? '4px' : 'calc(50% + 0px)' }}
          />
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`relative z-10 flex-1 py-2.5 text-sm font-headline font-semibold rounded-lg transition-colors ${
              activeTab === 'login' ? 'text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            {t('auth.tabs.login')}
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('signup')}
            className={`relative z-10 flex-1 py-2.5 text-sm font-headline font-semibold rounded-lg transition-colors ${
              activeTab === 'signup' ? 'text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            {t('auth.tabs.signup')}
          </button>
        </div>

        {/* Messages */}
        <AnimatePresence mode="popLayout">
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-emerald-50/95 text-emerald-700 rounded-xl p-3 text-sm font-body border border-emerald-200/60 flex items-start gap-2"
            >
              <Icon name="check_circle" filled size="18px" className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-error-container/95 text-on-error-container rounded-xl p-3 text-sm font-body border border-error/20 flex flex-col gap-2"
            >
              <div className="flex items-start gap-2">
                <Icon name="error" filled size="18px" className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              {needsResend && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="self-start inline-flex items-center gap-1.5 bg-on-error-container/10 hover:bg-on-error-container/15 text-on-error-container text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Icon name={resending ? 'hourglass_top' : 'mail'} size="14px" />
                  {resending
                    ? t('auth.actions.resending')
                    : t('auth.actions.resendConfirmation')}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Captcha */}
        {captchaRequired && (
          <div className="flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey!}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
              options={{ theme: 'light', size: 'flexible' }}
            />
          </div>
        )}

        {/* Forms */}
        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleLogin}
              className="flex flex-col gap-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={inputGroupClass}
              >
                <Icon name="mail" className="text-on-surface-variant" size="20px" />
                <input
                  type="email"
                  placeholder={t('auth.fields.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className={inputGroupClass}
              >
                <Icon name="lock" className="text-on-surface-variant" size="20px" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.fields.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="20px" />
                </button>
              </motion.div>

              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError(t('auth.errors.emailFirst'));
                    return;
                  }
                  setLoading(true);
                  try {
                    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${appOrigin()}/auth`,
                    });
                    if (resetError) throw resetError;
                    setResetSent(true);
                    setError('');
                  } catch (err: any) {
                    setError(err.message || t('auth.errors.resetFailed'));
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-primary text-xs font-body font-semibold self-end -mt-1 hover:underline"
              >
                {resetSent ? t('auth.actions.resetSent') : t('auth.actions.forgotPassword')}
              </button>

              <Magnet padding={50} magnetStrength={5} wrapperClassName="!block w-full">
                <StarBorder
                  type="submit"
                  color="#6cd3f7"
                  speed="3.5s"
                  className="!w-full !block"
                  innerClassName={`bg-primary text-on-primary py-3.5 font-bold font-headline text-sm tracking-wide cursor-pointer hover:bg-primary-container transition-colors ${
                    loading ? 'opacity-70 pointer-events-none' : ''
                  }`}
                  disabled={loading}
                >
                  {loading ? t('common.processing') : t('auth.actions.login')}
                </StarBorder>
              </Magnet>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-outline-variant/40" />
                <span className="text-xs text-on-surface-variant/60 font-body">{t('common.or')}</span>
                <div className="flex-1 h-px bg-outline-variant/40" />
              </div>

              {googleButton}

              <button type="button" onClick={handleGuestLogin} className={guestButtonClass}>
                <Icon name="person_outline" size="20px" />
                {t('auth.actions.guest')}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSignup}
              className="flex flex-col gap-4"
            >
              {[
                { icon: 'person', type: 'text', placeholder: t('auth.fields.fullName'), value: name, setter: setName },
                { icon: 'mail', type: 'email', placeholder: t('auth.fields.email'), value: email, setter: setEmail },
              ].map((field, i) => (
                <motion.div
                  key={field.placeholder}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.07 }}
                  className={inputGroupClass}
                >
                  <Icon name={field.icon} className="text-on-surface-variant" size="20px" />
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    required
                    className={inputClass}
                  />
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.19 }}
                className={inputGroupClass}
              >
                <Icon name="lock" className="text-on-surface-variant" size="20px" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.fields.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="20px" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26 }}
                className={inputGroupClass}
              >
                <Icon name="lock" className="text-on-surface-variant" size="20px" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.fields.confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} size="20px" />
                </button>
              </motion.div>

              <Magnet padding={50} magnetStrength={5} wrapperClassName="!block w-full">
                <StarBorder
                  type="submit"
                  color="#6cd3f7"
                  speed="3.5s"
                  className="!w-full !block"
                  innerClassName={`bg-primary text-on-primary py-3.5 font-bold font-headline text-sm tracking-wide cursor-pointer hover:bg-primary-container transition-colors ${
                    loading ? 'opacity-70 pointer-events-none' : ''
                  }`}
                  disabled={loading}
                >
                  {loading ? t('common.processing') : t('auth.actions.signup')}
                </StarBorder>
              </Magnet>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-outline-variant/40" />
                <span className="text-xs text-on-surface-variant/60 font-body">{t('common.or')}</span>
                <div className="flex-1 h-px bg-outline-variant/40" />
              </div>

              {googleButton}

              <button type="button" onClick={handleGuestLogin} className={guestButtonClass}>
                <Icon name="person_outline" size="20px" />
                {t('auth.actions.guest')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Bottom legal text */}
        <p className="text-[11px] text-on-surface-variant/70 text-center font-body">
          {t('auth.legal')}
        </p>
      </motion.div>
    </div>
  );
}
