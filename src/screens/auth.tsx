// Welcome, log-in, sign-up, verify and reset screens.
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Btn, Card, Check, Field, LinkBtn, Screen, T, Tabs } from '../components/ui';
import { SCENES } from '../data/photos';
import { Icon, IconName } from '../components/Icon';
import { BrandMark, Logo, Wordmark } from '../components/Brand';
import { useApp, DEMO_CODE, resetDemoData } from '../store/AppStore';
import { useBP } from '../components/responsive';
import { useNav, useParams } from '../navigation/nav';
import { colors, shadow, space, type, FONT } from '../theme';
import { isEmail, isPhone } from '../utils/format';

export { Logo };

const DEMO: [string, string, string, IconName][] = [
  ['u1', 'Pet Owner',      'Maria Santos',      'paw'],
  ['u2', 'Clinic Staff',   'Lea Ramirez',       'steth'],
  ['u3', 'Administrator',  'Dr. Elena Ybañez',  'shield'],
];

/* ─── Left brand panel: cinematic pet photo + dark navy overlay ─── */
function AuthLeftPanel() {
  return (
    <View style={a.panel}>
      {/* Full-bleed pet photo */}
      <Image
        source={SCENES.welcomePets}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {/* Primary dark overlay */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#091729', opacity: 0.62 }} />
      {/* Bottom darkening so headline text pops */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: '#091729', opacity: 0.38 }} />

      {/* Content layer */}
      <View style={{ flex: 1, zIndex: 1, justifyContent: 'space-between' }}>
        {/* Brand top-left */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BrandMark size={28} white />
          <Wordmark size={17} light />
        </View>

        {/* Headline + trust bottom */}
        <View style={{ gap: 22 }}>
          <View style={{ gap: 12 }}>
            <Text style={a.panelH1}>
              {'Every visit.\nA '}
              <Text style={{ color: colors.teal }}>healthier</Text>
              {'\ntomorrow.'}
            </Text>
            <Text style={a.panelSub}>
              Quality veterinary care for your beloved pets, all in one place.
            </Text>
          </View>

          {/* Trust badges */}
          <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
            {(['Trusted Care', 'Pet Wellness', 'Modern Clinic'] as const).map(label => (
              <View key={label} style={a.trust}>
                <View style={a.trustDot} />
                <Text style={a.trustText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

/* ─── AuthFrame wraps Login / SignUp / VerifyCode / ResetPassword ─── */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const { bp } = useBP();
  if (bp === 'mobile') return <>{children}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff' }}>
      {bp === 'desktop' && <AuthLeftPanel />}
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
          {children}
        </View>
      </View>
    </View>
  );
}

/* ─── Welcome ─── */
export function Welcome() {
  const { desktop, bp } = useBP();
  const nav = useNav(); const { db, act } = useApp();
  const insets = useSafeAreaInsets();
  const [demo, setDemo] = useState(false);

  /* Desktop: cinematic 2-panel */
  if (desktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <AuthLeftPanel />

        {/* Right: clean sign-in panel */}
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <ScrollView
            contentContainerStyle={a.rightScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* Brand tile */}
            <View style={a.rightMark}>
              <BrandMark size={28} />
            </View>

            {/* Headline */}
            <View style={{ gap: 8 }}>
              <Text style={a.rightH1} accessibilityRole="header">
                Your pets' care,{'\n'}all in one place.
              </Text>
              <Text style={a.rightSub}>
                Book visits, view health records, and message {db.clinic.name}.
              </Text>
            </View>

            {/* CTA buttons */}
            <View style={{ gap: 10, width: '100%' }}>
              <Pressable onPress={() => nav.navigate('Login')} accessibilityRole="button" accessibilityLabel="Log in"
                style={({ pressed }) => [a.ctaPrimary, pressed && { opacity: 0.88 }]}>
                <Icon name="login" size={18} color="#fff" strokeWidth={2} />
                <Text style={a.ctaPrimaryText}>Log in</Text>
              </Pressable>
              <Pressable onPress={() => nav.navigate('SignUp')} accessibilityRole="button" accessibilityLabel="Create an account"
                style={({ pressed }) => [a.ctaOutline, pressed && { opacity: 0.88 }]}>
                <Icon name="userplus" size={18} color={colors.teal} strokeWidth={2} />
                <Text style={a.ctaOutlineText}>Create an account</Text>
              </Pressable>
            </View>

            {/* Demo accounts */}
            <DemoAccounts demo={demo} setDemo={setDemo} act={act} />

            {/* Footer trust */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="shield" size={13} color={colors.ink3} />
              <Text style={{ fontFamily: FONT, fontSize: 12.5, color: colors.ink3 }}>
                Your information is safe with us.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  /* Tablet: centered card */
  if (bp === 'tablet') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: '100%', maxWidth: 420, gap: 28 }}>
          <Logo size={32} />
          <View style={{ gap: 8 }}>
            <Text style={a.h1} accessibilityRole="header">Your pets' care,{'\n'}all in one place.</Text>
            <Text style={a.lede}>Book visits, view records and reminders, message {db.clinic.name}.</Text>
          </View>
          <WelcomeButtons nav={nav} />
          <DemoAccounts demo={demo} setDemo={setDemo} act={act} />
        </View>
      </ScrollView>
    );
  }

  /* Phone: logo → photo hero → content */
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={[a.phonePage, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>

      <Logo size={28} />

      {/* Photo hero card */}
      <View style={a.phonePhoto}>
        <Image source={SCENES.welcomePets} resizeMode="cover"
          style={{ width: '100%', height: '100%' }} accessibilityLabel="A cat and a dog" />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#091729', opacity: 0.08 }} />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={a.h1} accessibilityRole="header">Your pets' care,{'\n'}all in one place.</Text>
        <Text style={a.lede}>{db.clinic.name} · Talisay City</Text>
      </View>

      <WelcomeButtons nav={nav} />
      <DemoAccounts demo={demo} setDemo={setDemo} act={act} />
    </ScrollView>
  );
}

function WelcomeButtons({ nav }: { nav: ReturnType<typeof useNav> }) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={() => nav.navigate('Login')} accessibilityRole="button" accessibilityLabel="Log in"
        style={({ pressed }) => [a.ctaPrimary, pressed && { opacity: 0.88 }]}>
        <Icon name="login" size={18} color="#fff" strokeWidth={2} />
        <Text style={a.ctaPrimaryText}>Log in</Text>
      </Pressable>
      <Pressable onPress={() => nav.navigate('SignUp')} accessibilityRole="button" accessibilityLabel="Create an account"
        style={({ pressed }) => [a.ctaOutline, pressed && { opacity: 0.88 }]}>
        <Icon name="userplus" size={18} color={colors.teal} strokeWidth={2} />
        <Text style={a.ctaOutlineText}>Create an account</Text>
      </Pressable>
    </View>
  );
}

function DemoAccounts({ demo, setDemo, act }: { demo: boolean; setDemo: (v: boolean) => void; act: ReturnType<typeof useApp>['act'] }) {
  return (
    <View style={a.demo}>
      <Pressable onPress={() => setDemo(!demo)} accessibilityRole="button"
        accessibilityState={{ expanded: demo }} style={a.demoToggle}>
        <View style={a.demoIconWrap}>
          <Icon name="users" size={14} color={colors.teal} />
        </View>
        <Text style={a.demoTitle}>Explore demo accounts</Text>
        <Icon name={demo ? 'chevU' : 'chevD'} size={15} color={colors.ink3} />
      </Pressable>
      {demo && (
        <>
          {DEMO.map(([id, role, name, icon]) => (
            <Pressable key={id} onPress={() => act.demoLogin(id)} accessibilityRole="button"
              accessibilityLabel={`Sign in as ${role}`}
              style={({ pressed }) => [a.demoRow, pressed && { backgroundColor: colors.subtle }]}>
              <View style={a.demoIcon}><Icon name={icon} size={14} color={colors.teal} /></View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={a.demoRole}>{role}</Text>
                <Text style={a.demoName} numberOfLines={1}>{name}</Text>
              </View>
              <Icon name="chevR" size={13} color={colors.ink3} />
            </Pressable>
          ))}
          <Pressable onPress={resetDemoData} accessibilityRole="button" style={a.demoReset}>
            <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.ink3 }}>Reset demo data</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

/* ─── Login ─── */
export function Login() {
  const nav = useNav(); const { act } = useApp();
  const [mode, setMode] = useState<'email' | 'mobile'>('email');
  const [f, setF] = useState({ email: '', pw: '', phone: '', code: '' });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => { setF({ ...f, [k]: v }); setErr({}); };
  const submit = () => {
    const e: Record<string, string> = {};
    if (mode === 'email') {
      if (!isEmail(f.email)) e.email = 'Enter the email on your account';
      if (!f.pw) e.pw = 'Enter your password';
      if (Object.keys(e).length) return setErr(e);
      const m = act.loginEmail(f.email, f.pw); if (m) setErr({ form: m });
      return;
    }
    if (!isPhone(f.phone)) return setErr({ phone: 'Use a PH mobile number, e.g. 0917 555 0142' });
    if (!sent) { const m = act.requestCode(f.phone); if (m) return setErr({ form: m }); setSent(true); return; }
    if (f.code.length !== 6) return setErr({ code: 'Enter the 6-digit code' });
    const m = act.loginCode(f.phone, f.code); if (m) setErr({ code: m });
  };
  return (
    <Screen title="Log in" footer={<Btn label={mode === 'mobile' && !sent ? 'Send code' : 'Log in'} full style={{ flex: 1 }} onPress={submit} />}>
      <View style={{ gap: 6 }}>
        <BrandMark size={32} />
        <View style={{ height: 8 }} />
        <Text style={{ fontFamily: FONT, fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 }}>Welcome back</Text>
        <Text style={[type.small, { fontSize: 14, color: colors.ink2, lineHeight: 20 }]}>
          Log in with your email and password, or with a code sent to your mobile number.
        </Text>
      </View>
      <Tabs options={[['email', 'Email'], ['mobile', 'Mobile number']]} value={mode} onChange={m => { setMode(m as 'email' | 'mobile'); setErr({}); }} />
      {err.form && <Banner tone="bad" icon="alert" title="Can't log in" sub={err.form} />}
      {mode === 'email' ? <>
        <Field label="Email" icon="mail" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={v => set('email', v)} error={err.email} />
        <Field label="Password" icon="lock" placeholder="Your password" secure value={f.pw} onChangeText={v => set('pw', v)} error={err.pw} onSubmitEditing={submit} />
        <LinkBtn label="Forgot password?" icon={false} onPress={() => nav.navigate('ResetPassword')} />
      </> : <>
        <Field label="Mobile number" icon="phone" placeholder="0917 555 0142" keyboardType="phone-pad" value={f.phone} editable={!sent} onChangeText={v => set('phone', v)} error={err.phone} />
        {sent && <>
          <Field label="6-digit code" icon="shield" placeholder="••••••" keyboardType="number-pad" maxLength={6} value={f.code} onChangeText={v => set('code', v)} error={err.code} hint={`Demo code: ${DEMO_CODE}. No real SMS is sent.`} />
          <LinkBtn label="Use a different number" icon={false} onPress={() => { setSent(false); set('code', ''); }} />
        </>}
      </>}
      <View style={a.loginDemoCreds}>
        <Text style={[type.label, { marginBottom: 10 }]}>Demo credentials</Text>
        {[
          ['Owner', 'maria.santos@example.com'],
          ['Staff', 'lea@sugbopetcare.example'],
          ['Admin', 'elena@sugbopetcare.example'],
          ['Password', 'demo1234'],
          ['Mobile', `0917 555 0142, code ${DEMO_CODE}`],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
            <Text style={[type.small, { width: 72, color: colors.ink3, flexShrink: 0 }]}>{k}</Text>
            <Text style={[type.small, { flex: 1, color: colors.ink2, fontWeight: '500' }]} numberOfLines={1}>{v}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

/* ─── Sign up ─── */
export function SignUp() {
  const nav = useNav(); const { act } = useApp();
  const [f, setF] = useState({ name: '', phone: '', email: '', pw: '', consent: false });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string | boolean) => { setF({ ...f, [k]: v }); setErr({ ...err, [k]: '' }); };
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter your full name';
    if (!isPhone(f.phone)) e.phone = 'Use a PH mobile number, e.g. 0917 555 0142';
    if (!isEmail(f.email)) e.email = 'Enter a valid email address';
    if (f.pw.length < 8) e.pw = 'Use at least 8 characters';
    if (!f.consent) e.consent = 'Accept the privacy notice to continue';
    if (Object.values(e).some(Boolean)) return setErr(e);
    const r = act.checkSignup(f);
    if (r.error) return setErr({ [r.field!]: r.error });
    nav.navigate('VerifyCode', { name: f.name, email: f.email, pw: f.pw, phone: f.phone });
  };
  return (
    <Screen title="Create account" footer={<Btn label="Continue" full style={{ flex: 1 }} onPress={submit} />}>
      <View style={{ gap: 6 }}>
        <BrandMark size={32} />
        <View style={{ height: 8 }} />
        <Text style={{ fontFamily: FONT, fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 }}>Sign up as a pet owner</Text>
        <Text style={[type.small, { fontSize: 14, color: colors.ink2 }]}>We will send a code to your mobile number to confirm it.</Text>
      </View>
      <Field label="Full name" icon="user" placeholder="Maria Santos" value={f.name} onChangeText={v => set('name', v)} error={err.name} />
      <Field label="Mobile number" icon="phone" placeholder="0917 555 0142" keyboardType="phone-pad" value={f.phone} onChangeText={v => set('phone', v)} error={err.phone} hint="You can log in with a code sent to this number." />
      <Field label="Email" icon="mail" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={f.email} onChangeText={v => set('email', v)} error={err.email} />
      <Field label="Password" icon="lock" placeholder="At least 8 characters" secure value={f.pw} onChangeText={v => set('pw', v)} error={err.pw} />
      <Check value={f.consent} onChange={() => set('consent', !f.consent)} error={err.consent}
        label="I agree to the privacy notice. The clinic keeps my details and my pets' records for clinic use only (Data Privacy Act, RA 10173)." />
    </Screen>
  );
}

/* ─── Verify code ─── */
export function VerifyCode() {
  const { act, toast } = useApp(); const p = useParams<{ name: string; email: string; pw: string; phone: string }>();
  const [code, setCode] = useState(''); const [err, setErr] = useState('');
  const submit = () => { if (code.trim() !== DEMO_CODE) return setErr('That code is not right. Check and try again.'); act.signup({ name: p.name!, email: p.email!, pw: p.pw!, phone: p.phone! }); };
  return (
    <Screen title="Verify your number" footer={<Btn label="Verify and create account" full style={{ flex: 1 }} onPress={submit} />}>
      <Banner icon="shield" title="Enter the code we sent" sub={`A 6-digit code was sent to ${p.phone}.`} />
      <Field label="6-digit code" placeholder="••••••" keyboardType="number-pad" maxLength={6} value={code} onChangeText={v => { setCode(v); setErr(''); }} error={err} hint={`Demo code: ${DEMO_CODE}. No real SMS is sent.`} />
      <LinkBtn label="Send a new code" icon={false} onPress={() => toast(`A new code was sent (demo: ${DEMO_CODE})`)} />
    </Screen>
  );
}

/* ─── Reset password ─── */
export function ResetPassword() {
  const nav = useNav(); const { act } = useApp();
  const [step, setStep] = useState(0); const [phone, setPhone] = useState(''); const [code, setCode] = useState(''); const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const next = () => {
    if (step === 0) { if (!isPhone(phone)) return setErr('Use a PH mobile number, e.g. 0917 555 0142'); setErr(''); setStep(1); return; }
    if (step === 1) { if (code !== DEMO_CODE) return setErr('That code is not right'); setErr(''); setStep(2); return; }
    if (pw.length < 8) return setErr('Use at least 8 characters');
    const m = act.resetPassword(phone, pw); if (m) return setErr(m);
    nav.goBack();
  };
  return (
    <Screen title="Reset password" footer={<Btn label={['Send code', 'Check code', 'Save new password'][step]} full style={{ flex: 1 }} onPress={next} />}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.teal : colors.line }} />)}
      </View>
      {step === 0 && <><T.Body muted>Enter the mobile number on your account. We will send a 6-digit code.</T.Body>
        <Field label="Mobile number" icon="phone" keyboardType="phone-pad" placeholder="0917 555 0142" value={phone} onChangeText={v => { setPhone(v); setErr(''); }} error={err} /></>}
      {step === 1 && <><T.Body muted>Enter the code sent to {phone}.</T.Body>
        <Field label="6-digit code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={v => { setCode(v); setErr(''); }} error={err} hint={`Demo code: ${DEMO_CODE}`} /></>}
      {step === 2 && <Field label="New password" icon="lock" secure placeholder="At least 8 characters" value={pw} onChangeText={v => { setPw(v); setErr(''); }} error={err} />}
    </Screen>
  );
}

/* ─── Styles ─── */
const a = StyleSheet.create({
  /* ── Left panel ── */
  panel: {
    width: '50%',
    flexShrink: 0,
    backgroundColor: '#091729',
    padding: 48,
    overflow: 'hidden',
  },
  panelH1: {
    fontFamily: FONT,
    fontSize: 38,
    lineHeight: 50,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  panelSub: {
    fontFamily: FONT,
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.58)',
  },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.teal },
  trustText: { fontFamily: FONT, fontSize: 12.5, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },

  /* ── Right panel (desktop Welcome) ── */
  rightScroll: {
    flexGrow: 1,
    padding: 56,
    gap: 32,
    justifyContent: 'center',
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  rightMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.tileTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightH1: {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.6,
  },
  rightSub: {
    fontFamily: FONT,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.ink2,
  },

  /* ── CTA buttons (shared Welcome + WelcomeButtons) ── */
  ctaPrimary: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaPrimaryText: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  ctaOutline: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaOutlineText: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },

  /* ── Demo accounts accordion ── */
  demo: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  demoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.tileTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTitle: {
    flex: 1,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink2,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  demoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.tileTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoRole: { fontFamily: FONT, fontSize: 13.5, fontWeight: '600', color: colors.ink },
  demoName: { fontFamily: FONT, fontSize: 12, color: colors.ink2 },
  demoReset: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },

  /* ── Phone welcome ── */
  phonePage: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 24,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  phonePhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.tileTeal,
  },
  h1: {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.7,
  },
  lede: {
    fontFamily: FONT,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink2,
  },

  /* ── Login demo credentials table ── */
  loginDemoCreds: {
    backgroundColor: colors.subtle,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
