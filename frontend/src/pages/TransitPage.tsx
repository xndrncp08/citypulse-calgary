import { useTransitRoutes, useTransitStops, useTransitPerformance } from "../hooks/useApi";
import { PageHeader, Card, LoadingState, ErrorState, SectionTitle, StatCard } from "../components/ui";

export default function TransitPage() {
  const routes = useTransitRoutes();
  const stops = useTransitStops();
  const performance = useTransitPerformance();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Transit" description="Calgary Transit routes, stops, and performance metrics" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Routes" value={performance.data?.data.totalRoutes ?? "—"} />
        <StatCard label="Total Stops" value={performance.data?.data.totalStops ?? "—"} />
        <StatCard label="Routes Loaded" value={routes.data?.pagination.total ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Routes</SectionTitle>
          {routes.isLoading ? <LoadingState /> : routes.isError ? <ErrorState /> : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {routes.data?.data.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-1.5">
                  <span className="font-mono text-xs text-accent-blue w-16 shrink-0">{r.routeId}</span>
                  <span className="text-sm text-text-secondary truncate">{r.routeName}</span>
                </div>
              ))}
              {routes.data?.data.length === 0 && (
                <p className="text-sm text-text-tertiary py-4 text-center">No routes loaded yet. Run the data pipeline.</p>
              )}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>Stops (sample)</SectionTitle>
          {stops.isLoading ? <LoadingState /> : stops.isError ? <ErrorState /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-text-tertiary font-medium text-xs">Stop ID</th>
                    <th className="text-left py-2 pr-4 text-text-tertiary font-medium text-xs">Name</th>
                    <th className="text-left py-2 text-text-tertiary font-medium text-xs">Coords</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {stops.data?.data.slice(0, 20).map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-4 font-mono text-xs text-accent-cyan">{s.stopId}</td>
                      <td className="py-2 pr-4 text-text-secondary text-xs truncate max-w-[180px]">{s.stopName}</td>
                      <td className="py-2 text-text-tertiary text-xs font-mono">
                        {s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stops.data?.data.length === 0 && (
                <p className="text-sm text-text-tertiary py-4 text-center">No stops loaded yet.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
