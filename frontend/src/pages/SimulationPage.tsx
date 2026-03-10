import { useState } from "react";
import { useSimulation } from "../hooks/useApi";
import { PageHeader, Card, SectionTitle } from "../components/ui";
import clsx from "clsx";

const WEATHER_OPTIONS = [
  { value: "clear", label: "Clear" },
  { value: "rain", label: "Rain" },
  { value: "snow", label: "Snow" },
  { value: "ice", label: "Ice" },
  { value: "fog", label: "Fog" },
];

const TIME_OPTIONS = [
  { value: "morning_peak", label: "Morning Peak (7–9 AM)" },
  { value: "midday", label: "Midday (10 AM–3 PM)" },
  { value: "evening_peak", label: "Evening Peak (4–6 PM)" },
  { value: "overnight", label: "Overnight (10 PM–6 AM)" },
];

export default function SimulationPage() {
  const [weather, setWeather] = useState("clear");
  const [timeOfDay, setTimeOfDay] = useState("morning_peak");
  const [hasClosure, setHasClosure] = useState(false);

  const { mutate, data, isPending, error } = useSimulation();

  function handleRun() {
    mutate({
      weather_condition: weather,
      time_of_day: timeOfDay,
      road_closure_location: hasClosure ? { lat: 51.0447, lng: -114.0719 } : undefined,
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Scenario Simulator"
        description="Model the effect of weather, closures, and peak times on Calgary traffic"
      />

      <Card className="mb-4">
        <SectionTitle>Weather Condition</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {WEATHER_OPTIONS.map((w) => (
            <button
              key={w.value}
              onClick={() => setWeather(w.value)}
              className={clsx("btn text-sm", weather === w.value ? "btn-primary" : "btn-ghost")}
            >
              {w.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <SectionTitle>Time of Day</SectionTitle>
        <div className="flex flex-col gap-2">
          {TIME_OPTIONS.map((t) => (
            <label key={t.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="time"
                value={t.value}
                checked={timeOfDay === t.value}
                onChange={() => setTimeOfDay(t.value)}
                className="accent-accent-blue"
              />
              <span className="text-sm text-text-secondary">{t.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <SectionTitle>Additional Conditions</SectionTitle>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasClosure}
            onChange={(e) => setHasClosure(e.target.checked)}
            className="accent-accent-blue w-4 h-4"
          />
          <span className="text-sm text-text-secondary">Simulate downtown road closure</span>
        </label>
      </Card>

      <button onClick={handleRun} disabled={isPending} className="btn-primary w-full mb-6">
        {isPending ? "Running simulation…" : "Run Simulation"}
      </button>

      {error && (
        <Card className="border-accent-red/30 mb-4">
          <p className="text-sm text-accent-red">{(error as Error).message}</p>
        </Card>
      )}

      {data && (
        <Card>
          <SectionTitle>Simulation Results</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="stat-label mb-1">Congestion Increase</p>
              <p className="stat-value text-accent-amber">{data.congestion_increase}</p>
            </div>
            <div>
              <p className="stat-label mb-1">Commute Delay</p>
              <p className="stat-value text-accent-red">{data.commute_delay}</p>
            </div>
            <div>
              <p className="stat-label mb-1">Transit Demand</p>
              <p className="stat-value text-accent-cyan">{data.transit_demand_change}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="stat-label mb-3">Factor Breakdown</p>
            <div className="space-y-2">
              {Object.entries(data.factors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-sm font-medium text-text-primary font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
