// Welcome, log-in, sign-up, verify and reset screens.
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Btn, Card, Check, Field, Group, LinkBtn, Screen, Stack, T, Tabs } from '../components/ui';
import { SCENES } from '../data/photos';
import { Icon, IconName } from '../components/Icon';
import { BrandMark, Logo, Wordmark } from '../components/Brand';
import { useApp, DEMO_CODE, resetDemoData } from '../store/AppStore';
import { useBP } from '../components/responsive';
import { useNav, useParams } from '../navigation/nav';
import { colors, radius, shadow, space, type, FONT } from '../theme';
import { isEmail, isPhone } from '../utils/format';

export { Logo };

const PANEL_BG  = '#C8DFFF';   // soft sky-blue left panel
const PANEL_INK = '#0F2A5A';   // dark navy text on light panel

const DEMO: [string, string, string, IconName][] = [
  ['u1', 'Pet Owner',      'Maria Santos',      'paw'],
  ['u2', 'Clinic Staff',   'Lea Ramirez',       'steth'],
  ['u3', 'Administrator',  'Dr. Elena Ybañez',  'shield'],
];

/* ─── Left brand panel (shared by Welcome and AuthFrame) ─── */
function AuthLeftPanel() {
  return (
    <View style={a.panel}>
      {/* Scattered paw watermarks */}
      <View style={{ position: 'absolute', right: 24, top: 48, opacity: 0.09, transform: [{ rotate: '20deg' }] }}>
        <Icon name="paw" size={130} color={colors.accent} />
      </View>
      <View style={{ position: 'absolute', left: -16, bottom: 200, opacity: 0.06, transform: [{ rotate: '-18deg' }] }}>
        <Icon name="paw" size={80} color={colors.accent} />
      </View>
      <View style={{ position: 'absolute', right: 48, bottom: 100, opacity: 0.05, transform: [{ rotate: '10deg' }] }}>
        <Icon name="paw" size={60} color={colors.accent} />
      </View>

      {/* Logo */}
      <Logo size={30} />

      {/* Headline + sub */}
      <View style={{ flex: 1, justifyContent: 'center', gap: 14, zIndex: 1 }}>
        <Text style={a.panelH1}>
          {'Every visit.\na '}
          <Text style={{ color: colors.accent, fontStyle: 'italic' }}>healthier</Text>
          {' tomorrow.'}
        </Text>
        <Text style={a.panelSub}>
          Quality veterinary care for your beloved pets, all in one place.
        </Text>

        {/* Dog + cat photo — overflows right edge naturally */}
        <Image
          source={SCENES.welcomePets}
          resizeMode="contain"
          style={{ width: '110%', aspectRatio: 560 / 480, marginTop: 8, alignSelf: 'flex-end' }}
          accessibilityLabel="A cat and a dog"
        />
      </View>

      {/* Trust badges */}
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {([
          ['shield', 'Trusted Care'],
          ['paw',    'Pet Wellness'],
          ['steth',  'Modern Clinic'],
        ] as [IconName, string][]).map(([icon, label]) => (
          <View key={label} style={a.trust}>
            <View style={a.trustIcon}>
              <Icon name={icon} size={11} color={colors.accent} strokeWidth={2.2} />
            </View>
            <Text style={a.trustText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ─── Right-side paw watermarks (decorative) ─── */
function RightPaws() {
  return (
    <>
      <View style={{ position: 'absolute', right: 20, top: 30, opacity: 0.035, zIndex: 0 }}>
        <Icon name="paw" size={200} color={colors.accentDeep} />
      </View>
      <View style={{ position: 'absolute', left: 10, bottom: 60, opacity: 0.025, zIndex: 0, transform: [{ rotate: '-30deg' }] }}>
        <Icon name="paw" size={120} color={colors.accentDeep} />
      </View>
    </>
  );
}

/* ─── AuthFrame wraps Login / SignUp / VerifyCode / ResetPassword ─── */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const { bp } = useBP();
  if (bp === 'mobile') return <>{children}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff' }}>
      {bp === 'desktop' && <AuthLeftPanel />}
      <View style={{ flex: 1, backgroundColor: '#fff', position: 'relative', overflow: 'hidden' }}>
        <RightPaws />
        <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', zIndex: 1 }}>
          {children}
        </View>
      </View>
    </View>
  );
}

/* ─── Welcome ─── */
export function Welcome() {
  const { desktop, bp } = useBP();
  const nav = useNav(); const { db, act, toast } = useApp();
  const insets = useSafeAreaInsets(); const { height } = useWindowDimensions();
  const [demo, setDemo] = useState(false);

  /* Desktop: full 2-column layout matching the reference */
  if (desktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff' }}>
        <AuthLeftPanel />

        {/* Right panel */}
        <View style={{ flex: 1, backgroundColor: '#fff', position: 'relative', overflow: 'hidden' }}>
          <RightPaws />
          <ScrollView
            contentContainerStyle={a.rightScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* Logo icon */}
            <View style={a.rightMark}>
              <BrandMark size={34} />
            </View>

            {/* Headline */}
            <View style={{ gap: 10 }}>
              <Text style={a.rightH1} accessibilityRole="header">
                Your pets' care,{'\n'}all in one place.
              </Text>
              <Text style={a.rightSub}>
                Book visits, view health records and reminders, message {db.clinic.name}, and so much more.
              </Text>
            </View>

            {/* CTA buttons */}
            <View style={{ gap: 10, width: '100%' }}>
              <Pressable onPress={() => nav.navigate('Login')} accessibilityRole="button" accessibilityLabel="Log in"
                style={({ pressed }) => [a.pillPrimary, pressed && { opacity: 0.88 }]}>
                <Icon name="login" size={18} color="#fff" strokeWidth={2} />
                <Text style={a.pillPrimaryText}>Log in</Text>
              </Pressable>
              <Pressable onPress={() => nav.navigate('SignUp')} accessibilityRole="button" accessibilityLabel="Create an account"
                style={({ pressed }) => [a.pillLine, pressed && { opacity: 0.88 }]}>
                <Icon name="userplus" size={18} color={colors.teal} strokeWidth={2} />
                <Text style={a.pillLineText}>Create an account</Text>
              </Pressable>
              {/* Google — visual only for the prototype */}
              <Pressable onPress={() => toast('Google login is not available in the demo.')} accessibilityRole="button"
                style={({ pressed }) => [a.pillLine, { borderColor: colors.line }, pressed && { opacity: 0.88 }]}>
                <Text style={{ fontFamily: FONT, fontSize: 15.5, fontWeight: '700', color: '#4285F4' }}>G</Text>
                <Text style={a.pillLineText}>Continue with Google</Text>
              </Pressable>
            </View>

            {/* Demo accounts */}
            <View style={a.demo}>
              <Pressable onPress={() => setDemo(x => !x)} accessibilityRole="button"
                accessibilityState={{ expanded: demo }} style={a.demoHead}>
                <View style={a.demoIconWrap}>
                  <Icon name="users" size={15} color={colors.accentDeep} />
                </View>
                <Text style={a.demoTitle}>Explore demo accounts</Text>
                <Icon name={demo ? 'chevU' : 'chevD'} size={16} color={colors.ink2} />
              </Pressable>
              {demo && DEMO.map(([id, role, name, icon]) => (
                <Pressable key={id} onPress={() => act.demoLogin(id)} accessibilityRole="button"
                  accessibilityLabel={`Sign in as ${role}`}
                  style={({ pressed }) => [a.demoRow, pressed && { backgroundColor: colors.subtle }]}>
                  <View style={a.demoIcon}><Icon name={icon} size={15} color={colors.accentDeep} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={a.demoRole}>{role}</Text>
                    <Text style={a.demoName} numberOfLines={1}>{name}</Text>
                  </View>
                  <Icon name="chevR" size={14} color={colors.ink3} />
                </Pressable>
              ))}
              {demo && (
                <Pressable onPress={resetDemoData} accessibilityRole="button" style={a.reset}>
                  <Text style={{ fontFamily: FONT, fontSize: 12.5, color: colors.ink3 }}>Reset demo data</Text>
                </Pressable>
              )}
            </View>

            {/* Trust line */}
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

  /* Tablet — centered card */
  if (bp === 'tablet') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: '100%', maxWidth: 440, gap: 24 }}>
          <Logo size={32} />
          <View style={{ gap: 8 }}>
            <Text style={a.h1} accessibilityRole="header">Your pets' care,{'\n'}all in one place.</Text>
            <Text style={a.lede}>Book visits, view records and reminders, message {db.clinic.name}, and pay bills.</Text>
          </View>
          <WelcomeMobileButtons nav={nav} />
          <WelcomeDemo demo={demo} setDemo={setDemo} act={act} />
        </View>
      </ScrollView>
    );
  }

  /* Phone */
  const heroH = Math.max(160, Math.min(230, height * 0.27));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={[a.welcome, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <Logo size={30} />
      <View style={{ gap: 8 }}>
        <Text style={a.h1} accessibilityRole="header">Your pets' care,{'\n'}all in one place.</Text>
        <Text style={a.lede}>Book visits, view records and reminders, message {db.clinic.name}, and pay bills.</Text>
      </View>
      <View style={[a.heroWrap, { height: heroH }]}>
        <View style={[a.blobBig, { width: heroH * 1.1, height: heroH * 1.1, borderRadius: heroH }]} />
        <View style={[a.blobSm,  { width: heroH * 0.32, height: heroH * 0.32, borderRadius: heroH }]} />
        <Image source={SCENES.welcomePets} resizeMode="contain"
          style={{ width: '100%', height: heroH }} accessibilityLabel="A cat and a dog" />
      </View>
      <WelcomeMobileButtons nav={nav} />
      <WelcomeDemo demo={demo} setDemo={setDemo} act={act} />
    </ScrollView>
  );
}

function WelcomeMobileButtons({ nav }: { nav: ReturnType<typeof useNav> }) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={() => nav.navigate('Login')} accessibilityRole="button" accessibilityLabel="Log in"
        style={({ pressed }) => [a.pillPrimary, pressed && { opacity: 0.88 }]}>
        <Icon name="login" size={18} color="#fff" strokeWidth={2} />
        <Text style={a.pillPrimaryText}>Log in</Text>
      </Pressable>
      <Pressable onPress={() => nav.navigate('SignUp')} accessibilityRole="button" accessibilityLabel="Create an account"
        style={({ pressed }) => [a.pillLine, pressed && { opacity: 0.88 }]}>
        <Icon name="userplus" size={18} color={colors.teal} strokeWidth={2} />
        <Text style={a.pillLineText}>Create an account</Text>
      </Pressable>
    </View>
  );
}

function WelcomeDemo({ demo, setDemo, act }: { demo: boolean; setDemo: (v: boolean) => void; act: ReturnType<typeof useApp>['act'] }) {
  return (
    <View style={a.demo}>
      <Pressable onPress={() => setDemo(!demo)} accessibilityRole="button"
        accessibilityState={{ expanded: demo }} style={a.demoHead}>
        <View style={a.demoIconWrap}>
          <Icon name="users" size={15} color={colors.accentDeep} />
        </View>
        <Text style={a.demoTitle}>Explore demo accounts</Text>
        <Icon name={demo ? 'chevU' : 'chevD'} size={16} color={colors.ink2} />
      </Pressable>
      {demo && DEMO.map(([id, role, name, icon]) => (
        <Pressable key={id} onPress={() => act.demoLogin(id)} accessibilityRole="button"
          accessibilityLabel={`Sign in as ${role}`}
          style={({ pressed }) => [a.demoRow, pressed && { backgroundColor: colors.subtle }]}>
          <View style={a.demoIcon}><Icon name={icon} size={15} color={colors.accentDeep} /></View>
          <View style={{ flex: 1 }}>
            <Text style={a.demoRole}>{role}</Text>
            <Text style={a.demoName} numberOfLines={1}>{name}</Text>
          </View>
          <Icon name="chevR" size={14} color={colors.ink3} />
        </Pressable>
      ))}
      {demo && (
        <Pressable onPress={resetDemoData} accessibilityRole="button" style={a.reset}>
          <Text style={{ fontFamily: FONT, fontSize: 12.5, color: colors.ink3 }}>Reset demo data</Text>
        </Pressable>
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
        <View style={{ height: 10 }} />
        <Text style={{ fontFamily: FONT, fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 }}>Welcome back</Text>
        <Text style={[type.small, { fontSize: 14, color: colors.ink2, lineHeight: 20 }]}>Log in with your email and password, or with a code sent to your mobile number.</Text>
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
      <Card tint>
        <Text style={type.label}>Demo accounts</Text>
        <Text style={[type.small, { marginTop: 4 }]}>Email: maria.santos@example.com (owner), lea@sugbopetcare.example (staff), elena@sugbopetcare.example (admin). Password demo1234. Mobile: 0917 555 0142, code {DEMO_CODE}.</Text>
      </Card>
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
        <View style={{ height: 10 }} />
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
        {[0, 1, 2].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.accentDeep : colors.line }} />)}
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
  /* Phone welcome */
  welcome:  { flexGrow: 1, paddingHorizontal: space.xl, gap: 24, width: '100%', maxWidth: 440, alignSelf: 'center' },
  h1:       { fontFamily: FONT, fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.ink, letterSpacing: -0.7 },
  lede:     { fontFamily: FONT, fontSize: 15, lineHeight: 23, color: colors.ink2 },
  heroWrap: { alignItems: 'center', justifyContent: 'flex-end' },
  blobBig:  { position: 'absolute', bottom: 0, backgroundColor: colors.accentSoft },
  blobSm:   { position: 'absolute', top: 6, right: '12%', backgroundColor: colors.subtle },

  /* Left panel */
  panel:    { width: '44%', maxWidth: 660, backgroundColor: PANEL_BG, padding: 48, gap: 24, overflow: 'hidden' },
  panelH1:  { fontFamily: FONT, fontSize: 32, lineHeight: 42, fontWeight: '800', color: PANEL_INK, letterSpacing: -0.8 },
  panelSub: { fontFamily: FONT, fontSize: 15, lineHeight: 23, color: 'rgba(15,42,90,0.62)' },
  trust:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustIcon:{ width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(47,125,225,0.16)', alignItems: 'center', justifyContent: 'center' },
  trustText:{ fontFamily: FONT, fontSize: 12.5, fontWeight: '600', color: PANEL_INK },

  /* Right panel (desktop welcome) */
  rightScroll:  { flexGrow: 1, padding: 56, gap: 28, justifyContent: 'center', maxWidth: 480, alignSelf: 'center', width: '100%' },
  rightMark:    { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rightH1:      { fontFamily: FONT, fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.ink, letterSpacing: -0.7 },
  rightSub:     { fontFamily: FONT, fontSize: 15, lineHeight: 23, color: colors.ink2 },

  /* Pill buttons */
  pillPrimary:     { height: 50, borderRadius: 999, backgroundColor: colors.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pillPrimaryText: { fontFamily: FONT, fontSize: 15, fontWeight: '600', color: '#fff' },
  pillLine:        { height: 50, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pillLineText:    { fontFamily: FONT, fontSize: 15, fontWeight: '600', color: colors.teal },

  /* Demo accounts */
  demo:        { borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden' },
  demoHead:    { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  demoIconWrap:{ width: 30, height: 30, borderRadius: 8, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  demoTitle:   { fontFamily: FONT, flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.ink },
  demoRow:     { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: colors.line },
  demoIcon:    { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  demoRole:    { fontFamily: FONT, fontSize: 14, fontWeight: '600', color: colors.ink },
  demoName:    { fontFamily: FONT, fontSize: 12.5, color: colors.ink2, marginTop: 1 },
  reset:       { alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
});
