import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { CATEGORY_META } from "@/lib/catalog";
import type { Category, Talent } from "@/lib/types";
import { cn } from "@/lib/utils";

export const MAP_CENTER: [number, number] = [-23.6635, -46.733];
export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const iconCache = new Map<string, L.DivIcon>();
export function pinIcon(color: string): L.DivIcon {
  let icon = iconCache.get(color);
  if (!icon) {
    icon = L.divIcon({
      className: "",
      html: `<span class="bdb-pin" style="--pin:${color}"><i></i></span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -28],
    });
    iconCache.set(color, icon);
  }
  return icon;
}
const iconFor = (c: Category) => pinIcon(CATEGORY_META[c].color);

function FlyTo({ target }: { target?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 17, { duration: 0.8 });
  }, [target, map]);
  return null;
}

interface Props {
  talents: Talent[];
  className?: string;
  zoom?: number;
  focus?: [number, number] | null;
  onSelect?: (t: Talent) => void;
  testId?: string;
}

export default function TalentsMap({ talents, className, zoom = 15, focus, onSelect, testId = "talents-map" }: Props) {
  return (
    <div className={cn("isolate overflow-hidden rounded-2xl border border-amber-900/10", className)} data-testid={testId}>
      <MapContainer center={focus ?? MAP_CENTER} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {talents.map((t) => (
          <Marker
            key={t.id}
            position={[t.lat, t.lng]}
            icon={iconFor(t.category)}
            title={t.name}
            eventHandlers={{ click: () => onSelect?.(t) }}
          >
            <Popup>
              <div className="flex min-w-48 items-center gap-3">
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="size-12 rounded-lg object-cover" />
                ) : (
                  <span className="size-12 rounded-lg" style={{ background: CATEGORY_META[t.category].bg }} />
                )}
                <div className="space-y-0.5">
                  <p className="m-0! font-heading text-sm font-bold text-stone-900">{t.name}</p>
                  <p className="m-0! text-xs text-stone-600">{CATEGORY_META[t.category].label}</p>
                  <Link to={`/talento/${t.id}`} className="text-xs font-semibold text-[#C2410C]! underline">
                    Ver perfil →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <FlyTo target={focus} />
      </MapContainer>
    </div>
  );
}
