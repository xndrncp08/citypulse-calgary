import { PageHeader, StatCard, Card, LoadingState, ErrorState, SectionTitle } from "../components/ui";
import { useTrafficIncidents, useTransitPerformance, useWeather, useAirQuality } from "../hooks/useApi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

function aqhiLabel(v: number): string {
  if (v <= 3) return "Low";
  if (v <= 6) return "Moderate";
  if (v <= 10) return "High";
  return "Very High";
}

export default function Dashboard() {
  const incidents = useTrafficIncidents({ limit: 200 });
  const transit = useTransitPerformance();
  const weather = useWeather();
  const airQuality = useAirQuality();

  const latestWeather = weather.data?.data[0];
  const latestAqhi = airQuality.data?.data[0];

  // Build a simple incident count by hour for the sparkline
  const incidentsByHour = (() => {
    if (!incidents.data) return [];
    const counts: Record<string, number> = {};
    for (const inc of incidents.data.data) {
      const hour = format(new Date(inc.startTime), "HH:00");
      counts[hour] = (counts[hour] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([hour, count]) => ({ hour, count }));
  })();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of Calgary civic metrics"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {incidents.isLoading ? (
          <StatCard label="Active Incidents" value="—" className="col-span-1" />
        ) : incidents.isError ? (
          <StatCard label="Active Incidents" value="Error" className="col-span-1" />
        ) : (
          <StatCard
            label="Active Incidents"
            value={incidents.data?.pagination.total ?? 0}
            sub="Last 24h"
            className="col-span-1"
          />
        )}

        <StatCard
          label="Transit Routes"
          value={transit.data?.data.totalRoutes ?? "—"}
          sub={transit.isLoading ? "Loading…" : "Active routes"}
          className="col-span-1"
        />

        <StatCard
          label="Temperature"
          value={
            latestWeather?.temperature != null
              ? `${latestWeather.temperature.toFixed(1)}°C`
              : "—"
          }
          sub={
            latestWeather?.windSpeed != null
              ? `Wind ${latestWeather.windSpeed.toFixed(0)} km/h`
              : undefined
          }
          className="col-span-1"
        />

        <StatCard
          label="Air Quality (AQHI)"
          value={latestAqhi?.aqhi?.toFixed(1) ?? "—"}
          sub={latestAqhi ? aqhiLabel(latestAqhi.aqhi) : undefined}
          trend={
            latestAqhi
              ? latestAqhi.aqhi <= 3
                ? "up"
                : latestAqhi.aqhi >= 7
                ? "down"
                : "neutral"
              : undefined
          }
          className="col-span-1"
        />
      </div>

      {/* Incident trend chart */}
      <Card className="mb-6">
        <SectionTitle>Incident Activity — Last 24h</SectionTitle>
        {incidents.isLoading ? (
          <LoadingState />
        ) : incidents.isError ? (
          <ErrorState message="Could not load incident trend" />
        ) : incidentsByHour.length === 0 ? (
          <p className="text-sm text-text-tertiary py-8 text-center">No recent incidents</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={incidentsByHour} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b7dd8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b7dd8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3148" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#4f5b73" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#4f5b73" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#161b27",
                  border: "1px solid #2a3148",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#e8eaf0",
                }}
                cursor={{ stroke: "#3b7dd8", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b7dd8"
                strokeWidth={2}
                fill="url(#incidentGrad)"
                name="Incidents"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Recent incidents table */}
      <Card>
        <SectionTitle>Recent Incidents</SectionTitle>
        {incidents.isLoading ? (
          <LoadingState />
        ) : incidents.isError ? (
          <ErrorState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-text-tertiary font-medium text-xs">Type</th>
                  <th className="text-left py-2 pr-4 text-text-tertiary font-medium text-xs">Description</th>
                  <th className="text-left py-2 text-text-tertiary font-medium text-xs">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {incidents.data?.data.slice(0, 10).map((inc) => (
                  <tr key={inc.id}>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-xs text-accent-blue">{inc.incidentType}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-text-secondary max-w-xs truncate">
                      {inc.description ?? inc.locationDescription ?? "—"}
                    </td>
                    <td className="py-2.5 text-text-tertiary text-xs whitespace-nowrap">
                      {format(new Date(inc.startTime), "MMM d, HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(incidents.data?.data.length ?? 0) === 0 && (
              <p className="text-sm text-text-tertiary text-center py-8">No incidents found</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
