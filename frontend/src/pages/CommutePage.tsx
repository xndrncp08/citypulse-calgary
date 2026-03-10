import { useState } from "react";
import { useCommutePrediction } from "../hooks/useApi";
import { PageHeader, Card, SectionTitle } from "../components/ui";
import clsx from "clsx";

const CONGESTION_COLOR = {
  low: "text-accent-green",
  moderate: "text-accent-amber",
  high: "text-accent-red",
  severe: "text-red-300",
};

// Calgary preset locations
const PRESETS = [
  { label: "Downtown", lat: 51.0447, lng: -114.0719 },
  { label: "NW Calgary", lat: 51.1215, lng: -114.1627 },
  { label: "SE Calgary", lat: 50.9615, lng: -113.9808 },
  { label: "Airport", lat: 51.1238, lng: -114.0100 },
  { label: "University", lat: 51.0784, lng: -114.1319 },
];

export default function CommutePage() {
  const [startLat, setStartLat] = useState("51.0447");
  const [startLng, setStartLng] = useState("-114.0719");
  const [endLat, setEndLat] = useState("51.0784");
  const [endLng, setEndLng] = useState("-114.1319");
  const [departureTime, setDepartureTime] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  const { mutate, data, isPending, error } = useCommutePrediction();

  function handleSubmit() {
    mutate({
      start_lat: parseFloat(startLat),
      start_lng: parseFloat(startLng),
      end_lat: parseFloat(endLat),
      end_lng: parseFloat(endLng),
      departure_time: new Date(departureTime).toISOString(),
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Commute Predictor"
        description="Estimate travel time based on current conditions and historical traffic patterns"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle>Origin</SectionTitle>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setStartLat(String(p.lat)); setStartLng(String(p.lng)); }}
                className="btn-ghost text-xs"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <input className="input" placeholder="Latitude" value={startLat} onChange={e => setStartLat(e.target.value)} />
            <input className="input" placeholder="Longitude" value={startLng} onChange={e => setStartLng(e.target.value)} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Destination</SectionTitle>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setEndLat(String(p.lat)); setEndLng(String(p.lng)); }}
                className="btn-ghost text-xs"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <input className="input" placeholder="Latitude" value={endLat} onChange={e => setEndLat(e.target.value)} />
            <input className="input" placeholder="Longitude" value={endLng} onChange={e => setEndLng(e.target.value)} />
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <SectionTitle>Departure Time</SectionTitle>
        <input
          type="datetime-local"
          className="input"
          value={departureTime}
          onChange={e => setDepartureTime(e.target.value)}
        />
      </Card>

      <button onClick={handleSubmit} disabled={isPending} className="btn-primary w-full mb-6">
        {isPending ? "Estimating…" : "Predict Commute"}
      </button>

      {error && (
        <Card className="border-accent-red/30 mb-4">
          <p className="text-sm text-accent-red">{(error as Error).message}</p>
        </Card>
      )}

      {data && (
        <Card>
          <SectionTitle>Prediction Results</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="stat-label mb-1">Estimated Time</p>
              <p className="stat-value">{data.estimated_commute_time} min</p>
            </div>
            <div>
              <p className="stat-label mb-1">Distance</p>
              <p className="stat-value">{data.distance_km} km</p>
            </div>
            <div>
              <p className="stat-label mb-1">Congestion</p>
              <p className={clsx("text-xl font-semibold capitalize", CONGESTION_COLOR[data.congestion_level])}>
                {data.congestion_level}
              </p>
            </div>
            <div>
              <p className="stat-label mb-1">Delay Risk</p>
              <p className="stat-value">{Math.round(data.delay_risk * 100)}%</p>
            </div>
            <div className="col-span-2">
              <p className="stat-label mb-1">Nearby Active Incidents</p>
              <p className="text-lg font-semibold text-text-primary">{data.nearby_incidents}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
