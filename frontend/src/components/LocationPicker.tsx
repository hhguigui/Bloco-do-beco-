import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { MAP_CENTER, pinIcon, TILE_ATTRIBUTION, TILE_URL } from "./TalentsMap";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface Props {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onPick }: Props) {
  const hasPoint = lat !== null && lng !== null;
  return (
    <div className="isolate h-64 overflow-hidden rounded-xl border border-amber-900/10" data-testid="location-picker-map">
      <MapContainer center={hasPoint ? [lat, lng] : MAP_CENTER} zoom={15} scrollWheelZoom={false} className="h-full w-full cursor-crosshair">
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <ClickHandler onPick={onPick} />
        {hasPoint && <Marker position={[lat, lng]} icon={pinIcon("#E65100")} />}
      </MapContainer>
    </div>
  );
}
