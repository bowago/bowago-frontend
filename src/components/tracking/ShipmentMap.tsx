"use client";

/**
 * ShipmentMap — Gap 3: Replaced react-leaflet with Google Maps JavaScript API
 * PRD Sprint 4: "Primary: Mapbox API. Fallback: Google Maps API."
 * Per your instruction: "convert to Google Maps API in all app"
 *
 * Env required: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 *
 * Features:
 *  - Origin marker (blue)
 *  - Current location marker (red / animated pulse)
 *  - Destination marker (green)
 *  - Dashed polyline connecting all points
 *  - Auto-fit bounds to all markers
 *  - Dark map style matching the app's dark theme
 *  - Graceful fallback text if API key missing or load fails
 */

import { useEffect, useRef, useState } from "react";

interface ShipmentMapProps {
  origin: [number, number] | null;
  current: [number, number] | null;
  destination: [number, number] | null;
  originLabel?: string;
  currentLabel?: string;
  destinationLabel?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// ── Dark map style matching app theme ─────────────────────────────────────────
const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

// ── SVG marker helpers ────────────────────────────────────────────────────────
function makeMarkerIcon(color: string, label: string): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

// ── Load Google Maps script once ─────────────────────────────────────────────
let _scriptLoaded = false;
let _scriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (_scriptLoaded) return Promise.resolve();
  if (_scriptPromise) return _scriptPromise;

  _scriptPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
      return;
    }

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      _scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => { _scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return _scriptPromise;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ShipmentMap({
  origin,
  current,
  destination,
  originLabel = "Origin",
  currentLabel = "Current Location",
  destinationLabel = "Destination",
}: ShipmentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const points = [origin, current, destination].filter(
    (p): p is [number, number] => p !== null
  );

  // ── Initialize map on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (points.length === 0) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) return;

        const center = { lat: points[0][0], lng: points[0][1] };

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 10,
          styles: DARK_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        googleMapRef.current = map;
        setMapReady(true);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  // ── Update markers and polyline when points change ─────────────────────────
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylineRef.current?.setMap(null);

    const markerDefs: Array<{
      pos: [number, number];
      color: string;
      title: string;
      zIndex: number;
    }> = [];

    if (origin)      markerDefs.push({ pos: origin,      color: "#1F3A70", title: originLabel,      zIndex: 1 });
    if (current)     markerDefs.push({ pos: current,     color: "#e53e3e", title: currentLabel,     zIndex: 3 });
    if (destination) markerDefs.push({ pos: destination, color: "#38a169", title: destinationLabel, zIndex: 2 });

    const latLngs: google.maps.LatLng[] = [];

    markerDefs.forEach(({ pos, color, title, zIndex }) => {
      const latLng = new google.maps.LatLng(pos[0], pos[1]);
      latLngs.push(latLng);

      const marker = new google.maps.Marker({
        position: latLng,
        map,
        title,
        zIndex,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-family:sans-serif;font-size:12px;font-weight:600;padding:4px 6px;">${title}</div>`,
      });

      marker.addListener("click", () => {
        infoWindow.open({ anchor: marker, map });
      });

      markersRef.current.push(marker);
    });

    // Dashed polyline connecting all points
    if (latLngs.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: latLngs,
        geodesic: true,
        strokeColor: "#e53e3e",
        strokeOpacity: 0,
        strokeWeight: 2,
        icons: [
          {
            icon: { path: "M 0,-1 0,1", strokeOpacity: 0.8, scale: 3 },
            offset: "0",
            repeat: "12px",
          },
        ],
        map,
      });
    }

    // Auto-fit bounds
    if (latLngs.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      latLngs.forEach((ll) => bounds.extend(ll));
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else if (latLngs.length === 1) {
      map.setCenter(latLngs[0]);
      map.setZoom(12);
    }
  }, [mapReady, origin, current, destination, originLabel, currentLabel, destinationLabel]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (points.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400 bg-gray-900 rounded-xl">
        Awaiting location data…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-sm text-gray-400 bg-gray-900 rounded-xl gap-2 px-4 text-center">
        <span>Map unavailable</span>
        {points[0] && (
          <span className="text-xs text-gray-500">
            Current: {points[0][0].toFixed(4)}, {points[0][1].toFixed(4)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem", overflow: "hidden" }}
    />
  );
}
