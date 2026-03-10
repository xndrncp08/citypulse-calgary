import { useState } from "react";
import { useTrafficIncidents } from "../hooks/useApi";
import { PageHeader, Card, LoadingState, ErrorState, SectionTitle } from "../components/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

const COLORS = ["#3b7dd8", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export default function TrafficPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTrafficIncidents({ page, limit: 200 });

  const byType = (() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    for (const inc of data.data) {
      counts[inc.incidentType] = (counts[inc.incidentType] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  })();

  const byHour = (() => {
    if (!data) return [];
    const counts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) counts[h] = 0;
    for (const inc of data.data) {
      const h = new Date(inc.startTime).getHours();
      counts[h] = (counts[h] ?? 0) + 1;
    }
    return Object.entries(counts).map(([hour, count]) => ({
      hour: `${hour.padStart(2, "0")}:00`,
      count,
    }));
  })();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Traffic Analytics"
        description="Incident trends, type breakdowns, and peak time analysis"
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <SectionTitle>Incidents by Hour of Day</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byHour} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3148" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: "#4f5b73" }}
                    interval={3}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#4f5b73" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#161b27", border: "1px solid #2a3148", borderRadius: 8, fontSize: 12, color: "#e8eaf0" }}
                  />
                  <Bar dataKey="count" fill="#3b7dd8" radius={[3, 3, 0, 0]} name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <SectionTitle>Incidents by Type</SectionTitle>
              {byType.length === 0 ? (
                <p className="text-sm text-text-tertiary text-center py-8">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={byType}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {byType.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#161b27", border: "1px solid #2a3148", borderRadius: 8, fontSize: 12, color: "#e8eaf0" }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span style={{ color: "#8892a4", fontSize: 11 }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <Card>
            <SectionTitle>All Incidents</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Type", "Description", "Location", "Start", "End"].map((h) => (
                      <th key={h} className="text-left py-2 pr-4 text-text-tertiary font-medium text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data?.data.map((inc) => (
                    <tr key={inc.id}>
                      <td className="py-2.5 pr-4">
                        <span className="font-mono text-xs text-accent-blue">{inc.incidentType}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary max-w-xs truncate">
                        {inc.description ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-text-tertiary text-xs truncate max-w-[180px]">
                        {inc.locationDescription ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-text-tertiary text-xs whitespace-nowrap">
                        {format(new Date(inc.startTime), "MMM d, HH:mm")}
                      </td>
                      <td className="py-2.5 text-text-tertiary text-xs whitespace-nowrap">
                        {inc.endTime ? format(new Date(inc.endTime), "MMM d, HH:mm") : "Ongoing"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-tertiary">
                  Page {data.pagination.page} of {data.pagination.totalPages} — {data.pagination.total} total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-ghost disabled:opacity-40 text-xs"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                    className="btn-ghost disabled:opacity-40 text-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
