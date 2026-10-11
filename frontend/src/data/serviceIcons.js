import { createElement } from "react";
import {
  Smartphone,
  Clapperboard,
  Film,
  Heart,
  Megaphone,
  Palette,
  Camera,
  Video,
  Music,
  Mic,
  Sparkles,
  Wand2,
  Scissors,
  Layers,
  MonitorPlay,
  Tv,
  Aperture,
  Building2,
  Plane,
  ShoppingBag,
  Gift,
  Star,
  Zap,
  PenTool,
} from "lucide-react";

// Icons the editor can pick for a service card, stored by name in the data.
export const serviceIcons = {
  Smartphone,
  Clapperboard,
  Film,
  Heart,
  Megaphone,
  Palette,
  Camera,
  Video,
  Music,
  Mic,
  Sparkles,
  Wand2,
  Scissors,
  Layers,
  MonitorPlay,
  Tv,
  Aperture,
  Building2,
  Plane,
  ShoppingBag,
  Gift,
  Star,
  Zap,
  PenTool,
};

export function ServiceIcon({ name, ...props }) {
  return createElement(serviceIcons[name] || Sparkles, props);
}
