import { useRef, useEffect, useState } from "react";
import L from "leaflet";
import { useTrafficIncidents, useTrafficHeatmap, useBikeCounters } from "../hooks/useApi";
import { PageHeader, Card, LoadingState } from "../components/ui";
import clsx from "clsx";

// Fix Leaflet's default icon paths broken by bundlers
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LayerMode = "incidents" | "heatmap" | "bikes";

const CALGARY_CENTER: L.LatLngTuple = [51.045, -114.066];
const ZOOM = 11;

function incidentColour(type: string): string {
  switch (type.toUpperCase()) {
    case "ACCIDENT":     return "#ef4444";
    case "CONSTRUCTION": return "#f59e0b";
    case "HAZARD":       return "#f97316";
    case "ROAD_CLOSURE": return "#8b5cf6";
    case "CONGESTION":   return "#3b7dd8";
    default:             return "#22d3ee";
  }
}

function circleMarker(lat: number, lng: number, colour: string, label: string): L.CircleMarker {
  return L.circleMarker([lat, lng], {
    radius: 7,
    color: "#fff",
    weight: 1.5,
    fillColor: colour,
    fillOpacity: 0.9,
  }).bindPopup(`<div style="font-size:13px;line-height:1.5">${label}</div>`);
}

const INCIDENT_TYPES = [
  { type: "ACCIDENT",     colour: "#ef4444" },
  { type: "CONSTRUCTION", colour: "#f59e0b" },
  { type: "HAZARD",       colour: "#f97316" },
  { type: "ROAD_CLOSURE", colour: "#8b5cf6" },
  { type: "CONGESTION",   colour: "#3b7dd8" },
  { type: "OTHER",        colour: "#22d3ee" },
];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);

  const [layer, setLayer] = useState<LayerMode>("incidents");

  const incidents = useTrafficIncidents({ limit: 500 });
  const heatmap = useTrafficHeatmap();
  const bikes = useBikeCounters();

  // Initialise map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: CALGARY_CENTER,
      zoom: ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-render when layer or data changes
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (layer === "incidents" && incidents.data) {
      for (const inc of incidents.data.data) {
        const colour = incidentColour(inc.incidentType);
        const label = `
          <strong>${inc.incidentType}</strong><br/>
          ${inc.description ?? inc.locationDescription ?? "No description"}<br/>
          <span style="color:#888;font-size:11px">${new Date(inc.startTime).toLocaleString()}</span>
        `;
        circleMarker(inc.latitude, inc.longitude, colour, label).addTo(group);
      }
    }

    if (layer === "heatmap" && heatmap.data) {
      const points = heatmap.data.data.map(
        (p) => [p.lat, p.lng, Math.min(p.weight / 10, 1)] as [number, number, number]
      );
      import("leaflet.heat").then(() => {
        if (!mapRef.current) return;
        const heat = L.heatLayer(points, {
          radius: 28,
          blur: 20,
          maxZoom: 17,
          gradient: {
            0.2: "#2563eb",
            0.4: "#7dd3fc",
            0.6: "#fde68a",
            0.8: "#f97316",
            1.0: "#dc2626",
          },
        });
        heat.addTo(mapRef.current);
        heatLayerRef.current = heat;
      });
    }

    if (layer === "bikes" && bikes.data) {
      const bikeIcon = L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      for (const counter of bikes.data.data) {
        L.marker([counter.latitude, counter.longitude], { icon: bikeIcon })
          .bindPopup(`<strong>${counter.locationName}</strong>`)
          .addTo(group);
      }
    }
  }, [layer, incidents.data, heatmap.data, bikes.data]);

  const isLoading =
    (layer === "incidents" && incidents.isLoading) ||
    (layer === "heatmap" && heatmap.isLoading) ||
    (layer === "bikes" && bikes.isLoading);

  return (
    <div className="p-6 h-full flex flex-col max-w-6xl mx-auto">
      <PageHeader
        title="City Map"
        description="Interactive map of Calgary traffic, incidents, and infrastructure"
        actions={
          <div className="flex gap-2">
            {(["incidents", "heatmap", "bikes"] as LayerMode[]).map((l) => (
              <button
                key={l}
                onClick={() => setLayer(l)}
                className={clsx("btn text-xs capitalize", layer === l ? "btn-primary" : "btn-ghost")}
              >
                {l}
              </button>
            ))}
          </div>
        }
      />

      <Card className="flex-1 relative min-h-[500px] p-0 overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0 }} />

        {isLoading && (
          <div className="absolute top-4 left-4 z-10 bg-surface-1/90 rounded-lg px-3 py-2">
            <LoadingState message="Loading layer…" />
          </div>
        )}

        {layer === "incidents" && (
          <div className="absolute bottom-6 left-4 z-10 bg-surface-1/95 border border-border rounded-lg p-3 text-xs space-y-1.5">
            {INCIDENT_TYPES.map(({ type, colour }) => (
              <div key={type} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colour }} />
                <span className="text-text-secondary capitalize">
                  {type.toLowerCase().replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-text-tertiary mt-3">
        {layer === "incidents" && `${incidents.data?.pagination.total ?? 0} incidents · OpenStreetMap`}
        {layer === "heatmap" && `${heatmap.data?.data.length ?? 0} density zones — last 30 days · OpenStreetMap`}
        {layer === "bikes" && `${bikes.data?.pagination.total ?? 0} bike counters · OpenStreetMap`}
      </p>
    </div>
  );
}
