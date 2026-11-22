// Welcome, log-in, sign-up, verify and reset screens.
// Welcome is the product's landing moment: a big editorial headline, the clinic's pets in a blue "studio" arch, and a
// real care line from the demo data as proof of what the app does. Log in uses one smart field that accepts an
// email or a PH mobile number and adapts as you type.
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Banner, Btn, Check, CodeInput, Field, LinkBtn } from '../components/ui';
import { SCENES } from '../data/photos';
import { Icon, IconName } from '../components/Icon';
import { Logo } from '../components/Brand';
import { CareLine, careNodes, petHealth, RingGlyph } from '../components/care';
import { useApp, DEMO_CODE, resetDemoData } from '../store/AppStore';
import { PState, useBP } from '../components/responsive';
import { useNav, useParams } from '../navigation/nav';
import { colors, type, FONT, DISPLAY } from '../theme';
import { ageOf, hourLabel, isEmail, isPhone, TODAY } from '../utils/format';

export { Logo };

const DEMO: [string, string, string, string, IconName][] = [
  ['u1', 'Pet Owner',     'Maria Santos',     'maria.santos@example.com',   'paw'],
  ['u2', 'Clinic Staff',  'Lea Ramirez',      'lea@sugbopetcare.example',   'steth'],
  ['u3', 'Administrator', 'Dr. Elena Ybañez', 'elena@sugbopetcare.example', 'shield'],
];
const ARCH_BG = '#D3DFEC';

/* ─── Studio arch: the clinic's pets in a blue arch ─── */
function PetArch({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height, borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: ARCH_BG, overflow: 'hidden', justifyContent: 'flex-end' }}>
      {/* a quiet horizon line, like a studio backdrop meeting the floor */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.18, backgroundColor: '#C5D4E5' }} />
      <Image source={SCENES.welcomePets} resizeMode="contain" accessibilityLabel="A tabby cat and an Australian shepherd, patients of the clinic"
        style={{ width: width * 1.02, height: Math.min(height * 0.92, width * 1.02 * 541 / 560), alignSelf: 'center' }} />
    </View>
  );
}

/* ─── A real care line from the demo data, shown as a paper chart slip ─── */
function ChartSlip({ width }: { width?: number }) {
  const { db } = useApp();
  const pet = db.pets.find(p => p.status === 'active');
  if (!pet) return null;
  const h = petHealth(db, pet);
  return (
    <View style={[w.slip, width ? { width } : null]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <RingGlyph health={h.key} size={14} />
        <Text style={w.slipName} numberOfLines={1}>{pet.name}</Text>
        <Text style={w.slipMeta} numberOfLines={1}>{pet.breed}, {ageOf(pet.birth)}</Text>
      </View>
      <CareLine nodes={careNodes(db, pet.id, { past: 2, future: 1 })} />
    </View>
  );
}

/* ─── Demo accounts: one tap signs in; credentials for typing are listed underneath ─── */
function DemoAccounts({ start = false }: { start?: boolean }) {
  const { act } = useApp();
  const [open, setOpen] = useState(start);
  return (
    <View style={w.demo}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }}
        style={(st: PState) => [w.demoToggle, st.hovered && { backgroundColor: colors.hover }]}>
        <Icon name="users" size={18} color={colors.accent} />
        <Text style={w.demoTitle}>Explore demo accounts</Text>
        <Icon name={open ? 'chevU' : 'chevD'} size={18} color={colors.ink2} />
      </Pressable>
      {open && (
        <View>
          {DEMO.map(([id, role, name, email, icon]) => (
            <Pressable key={id} onPress={() => act.demoLogin(id)} accessibilityRole="button" accessibilityLabel={`Sign in as ${role}`}
              style={(st: PState) => [w.demoRow, (st.hovered || st.pressed) && { backgroundColor: colors.hover }]}>
              <Icon name={icon} size={18} color={colors.ink2} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={w.demoRole} numberOfLines={1}>{role}<Text style={w.demoName}>{`   ${name}`}</Text></Text>
                <Text style={w.demoEmail} numberOfLines={1}>{email}</Text>
              </View>
              <Text style={w.demoGo}>Sign in</Text>
            </Pressable>
          ))}
          <View style={w.demoFoot}>
            <Text style={[type.small, { flex: 1, minWidth: 200 }]}>
              Password for every account: <Text style={w.mono}>demo1234</Text>. Mobile login: <Text style={w.mono}>0917 555 0142</Text>, code <Text style={w.mono}>{DEMO_CODE}</Text>.
            </Text>
            <Pressable onPress={resetDemoData} accessibilityRole="button" hitSlop={8} style={(st: PState) => [w.reset, st.hovered && { backgroundColor: colors.hover }]}>
              <Icon name="repeat" size={14} color={colors.ink2} />
              <Text style={[type.small, { color: colors.ink2, fontWeight: '500' }]}>Reset demo data</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function ClinicFacts({ row }: { row?: boolean }) {
  const { db } = useApp();
  const day = db.settings.days[TODAY.getDay()];
  const facts: [IconName, string][] = [
    ['clock', day?.open ? `Open today, ${hourLabel(day.from)} to ${hourLabel(day.to)}` : 'Closed today'],
    ['pin', db.clinic.address],
    ['shield', 'Records kept private under RA 10173'],
  ];
  return (
    <View style={[{ gap: 10 }, row && { flexDirection: 'row', gap: 32, flexWrap: 'wrap' }]}>
      {facts.map(([i, t]) => (
        <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <Icon name={i} size={15} color={colors.ink3} />
          <Text style={[type.small, { flexShrink: 1 }]} numberOfLines={row ? 1 : 2}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/* ─── Welcome ─── */
export function Welcome() {
  const { bp, width } = useBP(); const { height } = useWindowDimensions();
  const nav = useNav(); const { db } = useApp();
  const insets = useSafeAreaInsets();
  const lede = `Vaccines, check-ups, bills and messages with ${db.clinic.name}, kept on one line so you always know what's next for your pet.`;
  const ctas = (
    <View style={[{ gap: 12 }, bp !== 'mobile' && { flexDirection: 'row' }]}>
      <Btn label="Log in" icon="login" onPress={() => nav.navigate('Login')} style={bp !== 'mobile' ? { paddingHorizontal: 28, height: 52 } : { height: 52 }} />
      <Btn label="Create an account" kind="line" onPress={() => nav.navigate('SignUp')} style={bp !== 'mobile' ? { paddingHorizontal: 28, height: 52 } : { height: 52 }} />
    </View>
  );

  if (bp === 'desktop') {
    const archH = Math.max(440, Math.min(height - 230, 660));
    const archW = archH * 0.8;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[w.page, { minHeight: height }]}>
          <View style={w.top}>
            <Logo size={30} />
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Btn label="Log in" kind="ghost" onPress={() => nav.navigate('Login')} />
              <Btn label="Create an account" kind="line" onPress={() => nav.navigate('SignUp')} />
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 72, paddingVertical: 24 }}>
            <View style={{ flex: 1, minWidth: 0, gap: 28, maxWidth: 600 }}>
              <Text style={w.clinicLine}>{db.clinic.name}</Text>
              <Text style={[w.hero, width < 1440 && { fontSize: 76, lineHeight: 76 }]} accessibilityRole="header">Every visit,{'\n'}remembered.</Text>
              <Text style={w.lede}>{lede}</Text>
              {ctas}
              <View style={{ maxWidth: 520 }}><DemoAccounts /></View>
            </View>
            <View style={{ width: archW + 80, height: archH + 40, justifyContent: 'flex-start', alignItems: 'flex-end' }}>
              <PetArch width={archW} height={archH} />
              <View style={{ position: 'absolute', left: 0, bottom: 0 }}><ChartSlip width={Math.min(420, archW + 20)} /></View>
            </View>
          </View>
          <View style={w.foot}><ClinicFacts row /></View>
        </View>
      </ScrollView>
    );
  }

  // Tablet and phone: one column, composed top to bottom
  const phone = bp === 'mobile';
  const colW = Math.min(width, phone ? width : 640) - (phone ? 40 : 96);
  const archW = phone ? colW : Math.min(colW, 440);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: phone ? 20 : 48, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 640, gap: phone ? 24 : 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={phone ? 26 : 30} />
          <LinkBtn label="Log in" icon={false} onPress={() => nav.navigate('Login')} />
        </View>
        <View style={{ gap: phone ? 14 : 20 }}>
          <Text style={[w.hero, phone ? { fontSize: width < 380 ? 44 : 50, lineHeight: width < 380 ? 44 : 50, letterSpacing: -1.8 } : { fontSize: 72, lineHeight: 72 }]} accessibilityRole="header">Every visit,{'\n'}remembered.</Text>
          <Text style={[w.lede, phone && { fontSize: 16, lineHeight: 24 }]}>{lede}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <PetArch width={archW} height={archW * (phone ? 0.95 : 1.05)} />
          <View style={{ width: '100%', marginTop: -56, paddingHorizontal: phone ? 0 : 24 }}><ChartSlip /></View>
        </View>
        {ctas}
        <DemoAccounts />
        <View style={{ paddingTop: 8 }}><ClinicFacts /></View>
      </View>
    </ScrollView>
  );
}

/* ─── AuthFrame wraps Login / SignUp / VerifyCode / ResetPassword ─── */
// Desktop: the studio arch on the left, the form on the right, one linen surface with a hairline between.
// Tablet and phone: the form alone, centered.
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const { bp } = useBP(); const { height } = useWindowDimensions();
  if (bp !== 'desktop') return <View style={{ flex: 1, backgroundColor: colors.bg }}><View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>{children}</View></View>;
  const archH = Math.max(380, Math.min(height - 260, 560));
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      <View style={w.frameLeft}>
        <Logo size={28} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <PetArch width={archH * 0.8} height={archH} />
        </View>
        <ClinicFacts />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>{children}</View>
      </View>
    </View>
  );
}

/** Page body for auth forms: back link, display title, content. No duplicate headers. */
function AuthPage({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  const nav = useNavigation(); const insets = useSafeAreaInsets(); const { bp } = useBP();
  const phone = bp === 'mobile';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: phone ? 'flex-start' : 'center', paddingHorizontal: phone ? 20 : 56, paddingTop: insets.top + (phone ? 8 : 40), paddingBottom: insets.bottom + 40 }}>
        <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', gap: 24 }}>
          {nav.canGoBack() && (
            <Pressable onPress={() => nav.goBack()} accessibilityRole="button" accessibilityLabel="Back"
              style={(st: PState) => [w.back, st.hovered && { backgroundColor: colors.hover }]}>
              <Icon name="chevL" size={18} color={colors.ink2} />
              <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.ink2 }}>Back</Text>
            </Pressable>
          )}
          <View style={{ gap: 8 }}>
            <Text style={w.title} accessibilityRole="header">{title}</Text>
            {sub && <Text style={[type.body, { color: colors.ink2 }]}>{sub}</Text>}
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─── Login ─── */
/** Anything that starts like a phone number (digits, +, spaces, dashes) is treated as mobile login. */
const looksLikePhone = (v: string) => /^[+\d][\d\s-]*$/.test(v.trim());

export function Login() {
  const nav = useNav(); const { act, toast } = useApp();
  const [id, setId] = useState(''); const [pw, setPw] = useState(''); const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const phone = looksLikePhone(id);

  const tryCode = (c: string) => { const m = act.loginCode(id, c); if (m) setErr({ code: m }); };
  const submit = () => {
    const v = id.trim();
    if (!v) return setErr({ id: 'Enter your email or mobile number' });
    if (phone) {
      if (!isPhone(v)) return setErr({ id: 'Use a PH mobile number, for example 0917 555 0142' });
      if (!sent) { const m = act.requestCode(v); if (m) return setErr({ form: m }); setSent(true); setErr({}); return; }
      if (code.length !== 6) return setErr({ code: 'Enter all 6 digits' });
      return tryCode(code);
    }
    const e: Record<string, string> = {};
    if (!isEmail(v)) e.id = 'That email looks incomplete. Check it and try again.';
    if (!pw) e.pw = 'Enter your password';
    if (Object.keys(e).length) return setErr(e);
    const m = act.loginEmail(v, pw); if (m) setErr({ form: m });
  };
  const changeId = (v: string) => { setId(v); setErr({}); if (sent) { setSent(false); setCode(''); } };

  return (
    <AuthPage title="Log in" sub="Use the email or mobile number on your account.">
      {err.form && <Banner tone="bad" icon="alert" title="Can't log in" sub={err.form} />}
      <View style={{ gap: 18 }}>
        <Field label="Email or mobile number" icon={phone && id ? 'phone' : 'mail'} placeholder="you@example.com or 0917 555 0142"
          autoCapitalize="none" autoCorrect={false} autoComplete="username" keyboardType={phone && id ? 'phone-pad' : 'email-address'}
          value={id} onChangeText={changeId} error={err.id} editable={!sent} onSubmitEditing={submit} />
        {!phone && (
          <View style={{ gap: 8 }}>
            <Field label="Password" icon="lock" placeholder="Your password" secure autoComplete="current-password"
              value={pw} onChangeText={v => { setPw(v); setErr({}); }} error={err.pw} onSubmitEditing={submit} />
            <View style={{ alignSelf: 'flex-end' }}><LinkBtn label="Forgot password?" icon={false} onPress={() => nav.navigate('ResetPassword')} /></View>
          </View>
        )}
        {phone && sent && (
          <View style={{ gap: 12 }}>
            <Text style={type.label}>Enter the code sent to {id.trim()}</Text>
            <CodeInput value={code} onChange={c => { setCode(c); setErr({}); if (c.length === 6) tryCode(c); }} error={err.code} autoFocus />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <LinkBtn label="Use a different number" icon={false} onPress={() => { setSent(false); setCode(''); }} />
              <LinkBtn label="Send a new code" icon={false} onPress={() => toast(`A new code was sent (demo: ${DEMO_CODE})`)} />
            </View>
            <Text style={type.small}>This is a demo, so no SMS is sent. The code is {DEMO_CODE}.</Text>
          </View>
        )}
        {phone && !sent && id.length > 0 && <Text style={[type.small, { marginTop: -8 }]}>We'll text a 6-digit code to this number.</Text>}
      </View>
      <Btn label={phone ? (sent ? 'Log in' : 'Send code') : 'Log in'} full onPress={submit} style={{ height: 52 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text style={type.small}>New here?</Text>
        <LinkBtn label="Create an account" icon={false} onPress={() => nav.navigate('SignUp')} />
      </View>
      <DemoAccounts />
    </AuthPage>
  );
}

/* ─── Sign up ─── */
/** Thin progress rule for multi-step auth flows: done steps in blue, the current one in navy. */
function Steps({ n, at, labels }: { n: number; at: number; labels: string[] }) {
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={`Step ${at + 1} of ${n}: ${labels[at]}`}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: n }).map((_, i) => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < at ? colors.blue : i === at ? colors.accentDeep : colors.line }} />)}
      </View>
      <Text style={type.small}>Step {at + 1} of {n}: {labels[at]}</Text>
    </View>
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
    if (!isPhone(f.phone)) e.phone = 'Use a PH mobile number, for example 0917 555 0142';
    if (!isEmail(f.email)) e.email = 'Enter a valid email address';
    if (f.pw.length < 8) e.pw = 'Use at least 8 characters';
    if (!f.consent) e.consent = 'Accept the privacy notice to continue';
    if (Object.values(e).some(Boolean)) return setErr(e);
    const r = act.checkSignup(f);
    if (r.error) return setErr({ [r.field!]: r.error });
    nav.navigate('VerifyCode', { name: f.name, email: f.email, pw: f.pw, phone: f.phone });
  };
  return (
    <AuthPage title="Create your account" sub="For pet owners. Clinic staff accounts are set up by the administrator.">
      <Steps n={2} at={0} labels={['your details', 'confirm your mobile number']} />
      <View style={{ gap: 18 }}>
        <Field label="Full name" icon="user" placeholder="Maria Santos" autoComplete="name" value={f.name} onChangeText={v => set('name', v)} error={err.name} />
        <Field label="Mobile number" icon="phone" placeholder="0917 555 0142" keyboardType="phone-pad" autoComplete="tel" value={f.phone} onChangeText={v => set('phone', v)} error={err.phone} hint="We'll text a code here. You can also log in with it." />
        <Field label="Email" icon="mail" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={f.email} onChangeText={v => set('email', v)} error={err.email} />
        <Field label="Password" icon="lock" placeholder="At least 8 characters" secure autoComplete="new-password" value={f.pw} onChangeText={v => set('pw', v)} error={err.pw} onSubmitEditing={submit} />
        <Check value={f.consent} onChange={() => set('consent', !f.consent)} error={err.consent}
          label="I agree to the privacy notice. The clinic keeps my details and my pets' records for clinic use only (Data Privacy Act, RA 10173)." />
      </View>
      <Btn label="Continue" iconRight="chevR" full onPress={submit} style={{ height: 52 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text style={type.small}>Already have an account?</Text>
        <LinkBtn label="Log in" icon={false} onPress={() => nav.navigate('Login')} />
      </View>
    </AuthPage>
  );
}

/* ─── Verify code ─── */
export function VerifyCode() {
  const { act, toast } = useApp(); const p = useParams<{ name: string; email: string; pw: string; phone: string }>();
  const [code, setCode] = useState(''); const [err, setErr] = useState('');
  const verify = (c: string) => { if (c.trim() !== DEMO_CODE) return setErr('That code is not right. Check it and try again.'); act.signup({ name: p.name!, email: p.email!, pw: p.pw!, phone: p.phone! }); };
  return (
    <AuthPage title="Check your phone" sub={`Enter the 6-digit code we sent to ${p.phone || 'your mobile number'}.`}>
      <Steps n={2} at={1} labels={['your details', 'confirm your mobile number']} />
      <CodeInput value={code} onChange={v => { setCode(v); setErr(''); if (v.length === 6) verify(v); }} error={err} autoFocus />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Text style={type.small}>Demo code: {DEMO_CODE}. No SMS is sent.</Text>
        <LinkBtn label="Send a new code" icon={false} onPress={() => toast(`A new code was sent (demo: ${DEMO_CODE})`)} />
      </View>
      <Btn label="Verify and create account" full onPress={() => code.length === 6 ? verify(code) : setErr('Enter all 6 digits')} style={{ height: 52 }} />
    </AuthPage>
  );
}

/* ─── Reset password ─── */
export function ResetPassword() {
  const nav = useNav(); const { act } = useApp();
  const [step, setStep] = useState(0); const [phone, setPhone] = useState(''); const [code, setCode] = useState(''); const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const next = () => {
    if (step === 0) { if (!isPhone(phone)) return setErr('Use a PH mobile number, for example 0917 555 0142'); setErr(''); setStep(1); return; }
    if (step === 1) { if (code !== DEMO_CODE) return setErr('That code is not right. Check it and try again.'); setErr(''); setStep(2); return; }
    if (pw.length < 8) return setErr('Use at least 8 characters');
    const m = act.resetPassword(phone, pw); if (m) return setErr(m);
    nav.goBack();
  };
  const subs = ['Enter the mobile number on your account. We will text you a 6-digit code.', `Enter the code we sent to ${phone}.`, 'Choose a new password with at least 8 characters.'];
  return (
    <AuthPage title="Reset password" sub={subs[step]}>
      <Steps n={3} at={step} labels={['your mobile number', 'the code', 'a new password']} />
      {step === 0 && <Field label="Mobile number" icon="phone" keyboardType="phone-pad" placeholder="0917 555 0142" value={phone} onChangeText={v => { setPhone(v); setErr(''); }} error={err} onSubmitEditing={next} />}
      {step === 1 && <View style={{ gap: 10 }}>
        <CodeInput value={code} onChange={v => { setCode(v); setErr(''); }} error={err} autoFocus />
        <Text style={type.small}>Demo code: {DEMO_CODE}. No SMS is sent.</Text>
      </View>}
      {step === 2 && <Field label="New password" icon="lock" secure placeholder="At least 8 characters" autoComplete="new-password" value={pw} onChangeText={v => { setPw(v); setErr(''); }} error={err} onSubmitEditing={next} />}
      <Btn label={['Send code', 'Check code', 'Save new password'][step]} full onPress={next} style={{ height: 52 }} />
    </AuthPage>
  );
}

/* ─── Styles ─── */
const w = StyleSheet.create({
  page:       { width: '100%', maxWidth: 1400, alignSelf: 'center', paddingHorizontal: 56 },
  top:        { height: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clinicLine: { fontFamily: FONT, fontSize: 15, fontWeight: '500', color: colors.accent },
  hero:       { fontFamily: DISPLAY, fontSize: 92, lineHeight: 90, fontWeight: '600', color: colors.ink, letterSpacing: -3.4 },
  lede:       { fontFamily: FONT, fontSize: 19, lineHeight: 29, color: colors.ink2, maxWidth: 500 },
  foot:       { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 22 },

  slip:       { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  slipName:   { fontFamily: DISPLAY, fontSize: 18, fontWeight: '600', color: colors.ink, letterSpacing: -0.3 },
  slipMeta:   { fontFamily: FONT, fontSize: 13, color: colors.ink2, flexShrink: 1 },

  frameLeft:  { width: '42%', maxWidth: 640, padding: 40, gap: 24, borderRightWidth: 1, borderRightColor: colors.line },
  title:      { fontFamily: DISPLAY, fontSize: 40, lineHeight: 42, fontWeight: '600', color: colors.ink, letterSpacing: -1.4 },
  back:       { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', height: 44, paddingLeft: 6, paddingRight: 12, marginLeft: -10, borderRadius: 8 },

  demo:       { borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.surface, overflow: 'hidden' },
  demoToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 52 },
  demoTitle:  { flex: 1, fontFamily: FONT, fontSize: 15, fontWeight: '500', color: colors.ink },
  demoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 60, borderTopWidth: 1, borderTopColor: colors.line },
  demoRole:   { fontFamily: FONT, fontSize: 14.5, fontWeight: '600', color: colors.ink },
  demoName:   { fontFamily: FONT, fontSize: 13.5, fontWeight: '400', color: colors.ink2 },
  demoEmail:  { fontFamily: FONT, fontSize: 12.5, color: colors.ink3, marginTop: 2 },
  demoGo:     { fontFamily: FONT, fontSize: 13.5, fontWeight: '600', color: colors.accent },
  demoFoot:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.tint },
  mono:       { fontFamily: FONT, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] },
  reset:      { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 10, borderRadius: 6 },
});
