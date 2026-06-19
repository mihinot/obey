import React from 'react'
import {
  Home, Calendar, Bell, User, Users, Check, Clock, AlertTriangle, Plus,
  ChevronRight, ChevronLeft, ChevronDown, X, Grid3x3, List, Sparkles, Zap,
  ArrowLeftRight, LogOut, Settings, FileText, Heart, Shield, MapPin, Layers,
  Search, Filter, Star, Download,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>> = {
  home: Home,
  calendar: Calendar,
  bell: Bell,
  user: User,
  users: Users,
  check: Check,
  clock: Clock,
  alert: AlertTriangle,
  plus: Plus,
  chevR: ChevronRight,
  chevL: ChevronLeft,
  chevD: ChevronDown,
  x: X,
  grid: Grid3x3,
  list: List,
  spark: Sparkles,
  bolt: Zap,
  swap: ArrowLeftRight,
  logout: LogOut,
  settings: Settings,
  doc: FileText,
  heart: Heart,
  shield: Shield,
  pin: MapPin,
  layers: Layers,
  search: Search,
  filter: Filter,
  star: Star,
  dl: Download,
}

type IconProps = {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
  style?: React.CSSProperties
}

export function Icon({ name, size = 16, color, strokeWidth = 2, style }: IconProps) {
  const Comp = ICON_MAP[name]
  if (!Comp) return null
  return <Comp size={size} color={color} strokeWidth={strokeWidth} style={style} />
}
