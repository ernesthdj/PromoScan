/**
 * MapView — Carte Leaflet avec markers magasins et itineraire trace.
 * Utilise react-leaflet. Attention au SSR (importer dynamiquement si besoin).
 */

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import clsx from 'clsx';
import { BRAND_COLORS, BRAND_LABELS } from '../../utils/constants';
import { formatPrice } from '../../utils/formatters';
import type { Brand } from '../../../shared/enums';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  brand: Brand;
  articles?: string[];
  savings?: number;
}

interface MapViewProps {
  center: [number, number];
  markers: MapMarker[];
  routeCoordinates?: [number, number][];
  zoom?: number;
  className?: string;
}

/** Cree un icone Leaflet colore par enseigne */
function createBrandIcon(brand: Brand): L.DivIcon {
  const color = BRAND_COLORS[brand].bg;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/** Sous-composant pour ajuster les bounds automatiquement */
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [markers, map]);

  return null;
}

export function MapView({
  center,
  markers,
  routeCoordinates,
  zoom = 13,
  className,
}: MapViewProps) {
  const brandIcons = useMemo(() => {
    const icons: Partial<Record<Brand, L.DivIcon>> = {};
    for (const marker of markers) {
      if (!icons[marker.brand]) {
        icons[marker.brand] = createBrandIcon(marker.brand);
      }
    }
    return icons;
  }, [markers]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className={clsx('w-full h-full rounded-lg z-0', className)}
      style={{ minHeight: '300px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds markers={markers} />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={brandIcons[marker.brand]}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{marker.name}</p>
              <p className="text-neutral-500">{BRAND_LABELS[marker.brand]}</p>
              {marker.articles && marker.articles.length > 0 && (
                <ul className="mt-1 list-disc list-inside">
                  {marker.articles.map((article) => (
                    <li key={article}>{article}</li>
                  ))}
                </ul>
              )}
              {marker.savings !== undefined && marker.savings > 0 && (
                <p className="mt-1 font-medium text-green-600">
                  Economies : {formatPrice(marker.savings)}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {routeCoordinates && routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
        />
      )}
    </MapContainer>
  );
}
