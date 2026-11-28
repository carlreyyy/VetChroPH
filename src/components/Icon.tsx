import {
  House, PawPrint, Calendar, Wallet, MapPin, LayoutGrid, ChartColumn, Users, User, SlidersHorizontal, Bell,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Check, X, Search, Clock, Phone, Mail, Lock, Eye, EyeOff,
  Camera, FileText, Upload, Trash2, Pencil, Syringe, Pill, Stethoscope, ClipboardList, Receipt, QrCode,
  ShieldCheck, Info, TriangleAlert, LogOut, Settings, Tag, Repeat, Building2, Navigation, Image, Copy,
  History, Ellipsis, KeyRound, Download, Thermometer, UserPlus, Banknote, Activity, Scale,
  CreditCard, LogIn, Mars, Venus, Paperclip, MessageCircle, SendHorizontal, NotebookPen, List, CalendarDays, Landmark, Smartphone, HeartPulse, StickyNote, Tablet,
} from 'lucide-react-native';
import { colors } from '../theme';

const MAP = {
  home: House, paw: PawPrint, calendar: Calendar, wallet: Wallet, pin: MapPin, grid: LayoutGrid, chart: ChartColumn,
  users: Users, user: User, sliders: SlidersHorizontal, bell: Bell, chevL: ChevronLeft, chevR: ChevronRight,
  chevD: ChevronDown, chevU: ChevronUp, plus: Plus, check: Check, x: X, search: Search, clock: Clock, phone: Phone, mail: Mail,
  lock: Lock, eye: Eye, eyeoff: EyeOff, camera: Camera, file: FileText, upload: Upload, trash: Trash2, edit: Pencil,
  syringe: Syringe, pill: Pill, steth: Stethoscope, clip: ClipboardList, receipt: Receipt, qr: QrCode,
  shield: ShieldCheck, info: Info, alert: TriangleAlert, logout: LogOut, gear: Settings, tag: Tag, repeat: Repeat,
  building: Building2, nav: Navigation, image: Image, copy: Copy, history: History, more: Ellipsis, key: KeyRound,
  download: Download, temp: Thermometer, userplus: UserPlus, banknote: Banknote, activity: Activity, scale: Scale,
  login: LogIn, male: Mars, female: Venus, chat: MessageCircle, send: SendHorizontal, note: NotebookPen, list: List, calgrid: CalendarDays, bank: Landmark,
  card: CreditCard, clip2: Paperclip, phoneapp: Smartphone, heart: HeartPulse, sticky: StickyNote, tablet: Tablet,
};
export type IconName = keyof typeof MAP;

export function Icon({ name, size = 20, color = colors.ink, strokeWidth = 1.9 }: { name: IconName | string; size?: number; color?: string; strokeWidth?: number }) {
  const C = MAP[name as IconName] || Info;
  return <C size={size} color={color} strokeWidth={strokeWidth} />;
}
