import { useState } from "react";
import { useTrafficHistory } from "../hooks/useApi";
import { PageHeader, Card, SectionTitle, LoadingState, ErrorState } from "../components/ui";
import { format, subDays } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function HistoryPage() {
  const [from, setFrom] = useState(() => toInputDate(subDays(new Date(), 7)));
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [submitted, setSubmitted] = useState(false);

  const fromISO = `${from}T00:00:00.000Z`;
  const toISO = `${to}T23:59:59.999Z`;

  const { data, isLoading, isError } = useTrafficHistory(fromISO, toISO, submitted);

  const byDay = (() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    for (const inc of data.data) {
      const day = format(new Date(inc.startTime), "MMM d");
      counts[day] = (counts[day] ?? 0) + 1;
    }
    return Object.entries(counts).map(([day, count]) => ({ day, count }));
  })();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Historical Data Explorer"
        description="Browse and analyze historical traffic incident data by date range"
      />

      <Card className="mb-4">
        <SectionTitle>Select Date Range</SectionTitle>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="stat-label block mb-1">From</label>
            <input type="date" className="input w-40" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="stat-label block mb-1">To</label>
            <input type="date" className="input w-40" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => setSubmitted(true)}>
            Load Data
          </button>
        </div>
      </Card>

      {submitted && (
        <>
          {isLoading ? (
            <LoadingState message="Fetching historical data…" />
          ) : isError ? (
            <ErrorState message="Failed to load historical data" />
          ) : (
            <>
              <Card className="mb-4">
                <SectionTitle>Incident Volume by Day</SectionTitle>
                {byDay.length === 0 ? (
                  <p className="text-sm text-text-tertiary text-center py-8">No incidents in this range</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={byDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3148" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#4f5b73" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#4f5b73" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#161b27", border: "1px solid #2a3148", borderRadius: 8, fontSize: 12, color: "#e8eaf0" }} />
                      <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} fill="url(#histGrad)" name="Incidents" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <SectionTitle>
                  {data?.pagination.total ?? 0} Incidents — {from} to {to}
                </SectionTitle>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {["Type", "Description", "Start Time", "Location"].map(h => (
                          <th key={h} className="text-left py-2 pr-4 text-text-tertiary font-medium text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {data?.data.map((inc) => (
                        <tr key={inc.id}>
                          <td className="py-2.5 pr-4 font-mono text-xs text-accent-blue">{inc.incidentType}</td>
                          <td className="py-2.5 pr-4 text-text-secondary text-xs max-w-xs truncate">{inc.description ?? "—"}</td>
                          <td className="py-2.5 pr-4 text-text-tertiary text-xs whitespace-nowrap">{format(new Date(inc.startTime), "MMM d, HH:mm")}</td>
                          <td className="py-2.5 text-text-tertiary text-xs truncate max-w-[200px]">{inc.locationDescription ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
