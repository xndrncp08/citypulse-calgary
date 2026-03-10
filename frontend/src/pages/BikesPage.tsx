import { useBikeCounters } from "../hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import { bikesApi } from "../services/api";
import {
  PageHeader, Card, LoadingState, ErrorState, SectionTitle, StatCard,
} from "../components/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function BikesPage() {
  const counters = useBikeCounters();
  const usage = useQuery({
    queryKey: ["bikes", "usage"],
    queryFn: () => bikesApi.usage(),
    staleTime: 600_000,
  });

  const usageByLocation = (() => {
    if (!usage.data) return [];
    const totals: Record<string, number> = {};
    for (const r of usage.data.data) {
      const name = r.counter?.locationName ?? "Unknown";
      totals[name] = (totals[name] ?? 0) + r.bikeCount;
    }
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  })();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Bike Analytics"
        description="Bike counter locations and daily usage across Calgary"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Counter Locations" value={counters.data?.pagination.total ?? "—"} />
        <StatCard label="Usage Records" value={usage.data?.pagination.total ?? "—"} />
        <StatCard
          label="Top Location"
          value={usageByLocation[0]?.name.split(" ")[0] ?? "—"}
          sub={usageByLocation[0] ? `${usageByLocation[0].count.toLocaleString()} rides` : undefined}
        />
      </div>

      <Card className="mb-4">
        <SectionTitle>Top 10 Locations by Total Rides</SectionTitle>
        {usage.isLoading ? <LoadingState /> : usage.isError ? <ErrorState /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={usageByLocation}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 80, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3148" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#4f5b73" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#8892a4" }}
                axisLine={false}
                tickLine={false}
                width={76}
              />
              <Tooltip
                contentStyle={{ background: "#161b27", border: "1px solid #2a3148", borderRadius: 8, fontSize: 12, color: "#e8eaf0" }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 3, 3, 0]} name="Rides" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <SectionTitle>Counter Locations</SectionTitle>
        {counters.isLoading ? <LoadingState /> : counters.isError ? <ErrorState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Counter ID", "Location", "Coordinates"].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-text-tertiary font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {counters.data?.data.map(c => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-accent-green">{c.counterId}</td>
                    <td className="py-2.5 pr-4 text-text-secondary text-sm">{c.locationName}</td>
                    <td className="py-2.5 text-text-tertiary text-xs font-mono">
                      {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                    </td>
                  </tr>
                ))}
                {counters.data?.data.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-text-tertiary text-sm">
                      No bike counters loaded yet. Run the data pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
