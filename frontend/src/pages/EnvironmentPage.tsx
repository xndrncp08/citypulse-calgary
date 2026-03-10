import { useWeather, useAirQuality } from "../hooks/useApi";
import { PageHeader, Card, LoadingState, ErrorState, SectionTitle, StatCard } from "../components/ui";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

function aqhiColor(v: number): string {
  if (v <= 3) return "#10b981";
  if (v <= 6) return "#f59e0b";
  if (v <= 10) return "#ef4444";
  return "#8b5cf6";
}

export default function EnvironmentPage() {
  const weather = useWeather();
  const airQuality = useAirQuality();

  const weatherChart = (weather.data?.data ?? [])
    .slice(0, 48)
    .reverse()
    .map((r) => ({
      time: format(new Date(r.timestamp), "MMM d HH:mm"),
      temp: r.temperature,
      humidity: r.humidity,
      wind: r.windSpeed,
    }));

  const aqChart = (airQuality.data?.data ?? [])
    .slice(0, 48)
    .reverse()
    .map((r) => ({
      time: format(new Date(r.timestamp), "MMM d HH:mm"),
      aqhi: r.aqhi,
      station: r.stationName,
    }));

  const latestWeather = weather.data?.data[0];
  const latestAq = airQuality.data?.data[0];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Environment"
        description="Weather conditions and air quality index across Calgary"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Temperature" value={latestWeather?.temperature != null ? `${latestWeather.temperature.toFixed(1)}°C` : "—"} />
        <StatCard label="Humidity" value={latestWeather?.humidity != null ? `${latestWeather.humidity.toFixed(0)}%` : "—"} />
        <StatCard label="Wind Speed" value={latestWeather?.windSpeed != null ? `${latestWeather.windSpeed.toFixed(0)} km/h` : "—"} />
        <StatCard
          label="AQHI"
          value={latestAq?.aqhi?.toFixed(1) ?? "—"}
          sub={latestAq ? (latestAq.aqhi <= 3 ? "Low risk" : latestAq.aqhi <= 6 ? "Moderate risk" : "High risk") : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <SectionTitle>Temperature Trend</SectionTitle>
          {weather.isLoading ? <LoadingState /> : weather.isError ? <ErrorState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weatherChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3148" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#4f5b73" }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#4f5b73" }} axisLine={false} tickLine={false} unit="°C" />
                <Tooltip contentStyle={{ background: "#161b27", border: "1px solid #2a3148", borderRadius: 8, fontSize: 12, color: "#e8eaf0" }} />
                <Line type="monotone" dataKey="temp" stroke="#22d3ee" dot={false} strokeWidth={2} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle>Air Quality Index (AQHI)</SectionTitle>
          {airQuality.isLoading ? <LoadingState /> : airQuality.isError ? <ErrorState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={aqChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3148" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#4f5b73" }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#4f5b73" }} axisLine={false} tickLine={false} domain={[0, 12]} />
                <Tooltip contentStyle={{ background: "#161b27", border: "1px solid #2a3148", borderRadius: 8, fontSize: 12, color: "#e8eaf0" }} />
                <Line
                  type="monotone"
                  dataKey="aqhi"
                  stroke={latestAq ? aqhiColor(latestAq.aqhi) : "#3b7dd8"}
                  dot={false}
                  strokeWidth={2}
                  name="AQHI"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle>Weather Readings</SectionTitle>
        {weather.isLoading ? <LoadingState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Timestamp", "Temp (°C)", "Humidity (%)", "Wind (km/h)", "Precipitation"].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-text-tertiary font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {weather.data?.data.slice(0, 20).map(r => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-4 text-text-secondary text-xs whitespace-nowrap">{format(new Date(r.timestamp), "MMM d, HH:mm")}</td>
                    <td className="py-2.5 pr-4 text-text-primary tabular-nums">{r.temperature?.toFixed(1) ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-text-primary tabular-nums">{r.humidity?.toFixed(0) ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-text-primary tabular-nums">{r.windSpeed?.toFixed(0) ?? "—"}</td>
                    <td className="py-2.5 text-text-primary tabular-nums">{r.precipitation?.toFixed(1) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
