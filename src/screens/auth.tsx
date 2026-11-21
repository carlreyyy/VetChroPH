// Welcome, log in (email + password, or mobile number + code), sign up with a mobile code check, and password reset.
// Consultation D6 (both login methods), D7 (owners register through the app), D23 (privacy notice).
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Banner, Btn, Card, Check, Field, Group, LinkBtn, Row, Screen, Stack, T, Tabs } from '../components/ui';
import { SCENES } from '../data/photos';
import { Icon, IconName } from '../components/Icon';
import { BrandMark, Logo } from '../components/Brand';
import { useApp, DEMO_CODE, resetDemoData } from '../store/AppStore';
import { useBP } from '../components/responsive';
import { useNav, useParams } from '../navigation/nav';
import { colors, space, type, FONT } from '../theme';
import { isEmail, isPhone } from '../utils/format';

const DEMO: [string, string, string, IconName][] = [
  ['u1', 'Pet Owner', 'Maria Santos', 'paw'],
  ['u2', 'Clinic Staff', 'Lea Ramirez', 'steth'],
  ['u3', 'Administrator', 'Dr. Elena Ybañez', 'shield'],
];

export { Logo };

/** Desktop: brand panel on the left, the page on the right. Tablet: page centered. Phone: page only. */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const { bp } = useBP();
  if (bp === 'mobile') return <>{children}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff' }}>
      {bp === 'desktop' && (
        <View style={a.panel}>
          <Logo size={34} light />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={a.panelBlob} />
            <Image source={SCENES.welcomePets} resizeMode="contain" style={{ width: '88%', maxWidth: 520, aspectRatio: 560 / 541 }} accessibilityLabel="A cat and a dog" />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT, fontSize: 22, lineHeight: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.4 }}>Manage every visit, record and reminder for your clinic and the pets it cares for.</Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.65)' }}>VetChroPH · Talisay City, Philippines</Text>
          </View>
        </View>
      )}
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#fff' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 560 }}>{children}</View>
      </View>
    </View>
  );
}

export function Welcome() {
  const nav = useNav(); const { db, act } = useApp(); const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions(); const { desktop } = useBP();
  const [demo, setDemo] = useState(false);
  const heroH = Math.max(170, Math.min(270, height * 0.3));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={[a.welcome, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }, desktop && { justifyContent: 'center', paddingVertical: 48 }]}>
      {desktop ? <BrandMark size={44} /> : <Logo size={34} />}
      <View style={{ gap: 8 }}>
        <Text style={a.h1} accessibilityRole="header">Your pets' care,{'\n'}all in one place.</Text>
        <Text style={a.lede}>Book visits, view records and reminders, message {db.clinic.name}, and pay bills.</Text>
      </View>
      {!desktop && <View style={[a.heroWrap, { height: heroH }]}>
        <View style={[a.blobBig, { width: heroH * 1.05, height: heroH * 1.05, borderRadius: heroH }]} />
        <View style={[a.blobSmall, { width: heroH * 0.34, height: heroH * 0.34, borderRadius: heroH }]} />
        <Image source={SCENES.welcomePets} resizeMode="contain" style={{ width: '100%', height: heroH }} accessibilityLabel="A cat and a dog" />
      </View>}
      <View style={{ gap: 10 }}>
        <Btn label="Log in" icon="login" full onPress={() => nav.navigate('Login')} />
        <Btn label="Create a pet owner account" icon="userplus" kind="line" full onPress={() => nav.navigate('SignUp')} />
      </View>
      <View style={a.demo}>
        <Pressable onPress={() => setDemo(!demo)} accessibilityRole="button" accessibilityState={{ expanded: demo }} style={a.demoHead}>
          <Icon name="users" size={18} color={colors.accentDeep} />
          <Text style={a.demoTitle}>Explore Demo Accounts</Text>
          <Icon name={demo ? 'chevU' : 'chevD'} size={18} color={colors.ink2} />
        </Pressable>
        {demo && DEMO.map(([id, role, name, icon]) => (
          <Pressable key={id} onPress={() => act.demoLogin(id)} accessibilityRole="button" accessibilityLabel={`Sign in as ${role}`}
            style={({ pressed }) => [a.demoRow, pressed && { backgroundColor: colors.subtle }]}>
            <View style={a.demoIcon}><Icon name={icon} size={17} color={colors.accentDeep} /></View>
            <View style={{ flex: 1 }}>
              <Text style={a.demoRole}>{role}</Text>
              <Text style={a.demoName} numberOfLines={1}>{name}</Text>
            </View>
            <Icon name="chevR" size={16} color={colors.ink3} />
          </Pressable>
        ))}
        {demo && <Pressable onPress={resetDemoData} accessibilityRole="button" style={a.reset}><Text style={{ fontSize: 13, color: colors.ink2 }}>Reset demo data</Text></Pressable>}
      </View>
    </ScrollView>
  );
}

export function Login() {
  const nav = useNav(); const { act } = useApp();
  const [mode, setMode] = useState<'email' | 'mobile'>('email');
  const [f, setF] = useState({ email: '', pw: '', phone: '', code: '' }); const [sent, setSent] = useState(false);
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
      <View><BrandMark size={34} /><View style={{ height: 14 }} /><T.H1>Welcome back</T.H1><View style={{ height: 6 }} /><T.Body muted>Log in with your email and password, or with a code sent to your mobile number.</T.Body></View>
      <Tabs options={[['email', 'Email'], ['mobile', 'Mobile number']]} value={mode} onChange={m => { setMode(m); setErr({}); }} />
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
        <Text style={[type.small, { marginTop: 4 }]}>Email: maria.santos@example.com (owner), lea@sugbopetcare.example (staff), elena@sugbopetcare.example (administrator). Password demo1234. Mobile login: 0917 555 0142, code {DEMO_CODE}.</Text>
      </Card>
    </Screen>
  );
}

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
      <View><BrandMark size={34} /><View style={{ height: 14 }} /><T.H1>Sign up as a pet owner</T.H1><View style={{ height: 6 }} /><T.Body muted>We will send a code to your mobile number to confirm it.</T.Body></View>
      <Field label="Full name" icon="user" placeholder="Maria Santos" value={f.name} onChangeText={v => set('name', v)} error={err.name} />
      <Field label="Mobile number" icon="phone" placeholder="0917 555 0142" keyboardType="phone-pad" value={f.phone} onChangeText={v => set('phone', v)} error={err.phone} hint="You can log in with a code sent to this number." />
      <Field label="Email" icon="mail" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={f.email} onChangeText={v => set('email', v)} error={err.email} />
      <Field label="Password" icon="lock" placeholder="At least 8 characters" secure value={f.pw} onChangeText={v => set('pw', v)} error={err.pw} />
      <Check value={f.consent} onChange={() => set('consent', !f.consent)} error={err.consent}
        label="I agree to the privacy notice. The clinic keeps my details and my pets' records for clinic use only (Data Privacy Act, RA 10173)." />
    </Screen>
  );
}

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
      <View style={{ flexDirection: 'row', gap: 6 }}>{[0, 1, 2].map(i => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? colors.accentDeep : colors.line }} />)}</View>
      {step === 0 && <><T.Body muted>Enter the mobile number on your account. We will send a 6-digit code.</T.Body>
        <Field label="Mobile number" icon="phone" keyboardType="phone-pad" placeholder="0917 555 0142" value={phone} onChangeText={v => { setPhone(v); setErr(''); }} error={err} /></>}
      {step === 1 && <><T.Body muted>Enter the code sent to {phone}.</T.Body>
        <Field label="6-digit code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={v => { setCode(v); setErr(''); }} error={err} hint={`Demo code: ${DEMO_CODE}`} /></>}
      {step === 2 && <Field label="New password" icon="lock" secure placeholder="At least 8 characters" value={pw} onChangeText={v => { setPw(v); setErr(''); }} error={err} />}
    </Screen>
  );
}

const a = StyleSheet.create({
  welcome: { flexGrow: 1, paddingHorizontal: space.xl, gap: 22, width: '100%', maxWidth: 520, alignSelf: 'center' },
  h1: { fontFamily: FONT, fontSize: 30, lineHeight: 37, fontWeight: '700', color: colors.ink, letterSpacing: -0.6 },
  lede: { fontFamily: FONT, fontSize: 15, lineHeight: 23, color: colors.ink2 },
  panel: { width: '46%', maxWidth: 760, backgroundColor: colors.accentDeep, padding: 48, gap: 24 },
  panelBlob: { position: 'absolute', width: '70%', aspectRatio: 1, borderRadius: 999, backgroundColor: 'rgba(79,130,184,0.15)' },
  reset: { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  heroWrap: { alignItems: 'center', justifyContent: 'flex-end' },
  blobBig: { position: 'absolute', bottom: 0, backgroundColor: colors.accentSoft },
  blobSmall: { position: 'absolute', top: 6, right: '12%', backgroundColor: colors.subtle },
  demo: { borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden' },
  demoHead: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  demoTitle: { fontFamily: FONT, flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  demoRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.line },
  demoIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  demoRole: { fontFamily: FONT, fontSize: 15, fontWeight: '600', color: colors.ink },
  demoName: { fontFamily: FONT, fontSize: 13, color: colors.ink2, marginTop: 1 },
});
