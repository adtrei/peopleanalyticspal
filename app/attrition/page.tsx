"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventsChart } from "@/components/charts/EventsChart";
import { TermReasonChart } from "@/components/charts/TermReasonChart";
import { KpiCard } from "@/components/ui/KpiCard";
import { EpistemicBadge } from "@/components/ui/EpistemicBadge";
import type { MonthlyEvent, TerminationReasonSummary, TenureBucket } from "@/types";
import { generateSampleHeadcount, generateSampleEvents } from "@/data/sampleData";
import {
  computeMonthlyEvents,
  computeTerminationReasons,
  computeVoluntaryInvoluntarySplit,
  computeTenureBuckets,
} from "@/lib/analytics/attrition";
import { formatNumber, formatPct } from "@/lib/utils";
import { UserMinus, Info, AlertTriangle } from "lucide-react";

export default function AttritionPage() {
  const [events, setEvents] = useState<MonthlyEvent[]>([]);
  const [reasons, setReasons] = useState<TerminationReasonSummary[]>([]);
  const [tenure, setTenure] = useState<TenureBucket[]>([]);
  const [volSplit, setVolSplit] = useState({ voluntary: 0, involuntary: 0, unknown: 0 });
  const [showTransfers, setShowTransfers] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const hc = generateSampleHeadcount();
    const ev = generateSampleEvents();
    setEvents(computeMonthlyEvents(ev));
    const r = computeTerminationReasons(ev);
    setReasons(r);
    setVolSplit(computeVoluntaryInvoluntarySplit(r));
    setTenure(computeTenureBuckets(ev, hc));
    setLoaded(true);
  }, []);

  if (!loaded) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>;
  if (events.length === 0) return <EmptyState />;

  const totalTerms = events.reduce((a, b) => a + b.terminations, 0);
  const totalHires = events.reduce((a, b) => a + b.hires, 0);
  const netExternal = events.reduce((a, b) => a + b.netExternal, 0);
  const totalTransfers = events.reduce((a, b) => a + b.transfersIn + b.transfersOut, 0);
  const volTotal = volSplit.voluntary + volSplit.involuntary + volSplit.unknown;
  const volPct = volTotal > 0 ? volSplit.voluntary / volTotal : 0;

  return (
    <div>
      <PageHeader
        title="Attrition Explorer"
        description="Termination trends, reason distributions, voluntary/involuntary classification, and tenure analysis."
      />

      {/* Transfer notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 mb-5">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Internal transfers are normalized out by default.</strong>{" "}
          Transfers (Transferred in / Transferred out) are excluded from hire and termination counts to avoid
          double-counting. {formatNumber(totalTransfers)} transfer events detected this period.{" "}
          <button onClick={() => setShowTransfers(!showTransfers)} className="underline">
            {showTransfers ? "Hide transfers" : "Show transfers on chart"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Terminations" value={formatNumber(totalTerms)} icon={UserMinus} variant="danger" />
        <KpiCard label="Total Hires" value={formatNumber(totalHires)} variant="success" />
        <KpiCard
          label="Net External Change"
          value={`${netExternal >= 0 ? "+" : ""}${formatNumber(netExternal)}`}
          variant={netExternal >= 0 ? "success" : "danger"}
          subtext="Hires minus terminations"
        />
        <KpiCard
          label="Likely Voluntary"
          value={formatPct(volPct)}
          subtext="Based on reason mapping"
          variant="warning"
        />
      </div>

      {/* Events chart */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Hires, Terminations & Transfers by Month</h2>
          <EpistemicBadge status="known" size="sm" />
        </div>
        <EventsChart data={events} showTransfers={showTransfers} height={260} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Reason distribution */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Top Termination Reasons</h2>
            <div className="flex gap-1.5 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Voluntary</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Involuntary</span>
            </div>
          </div>
          <TermReasonChart data={reasons} height={260} />
          <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              Voluntary/involuntary classification is <strong>derived</strong> from reason text mapping — not directly captured in source data.
            </span>
          </div>
        </div>

        {/* Voluntary split */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Voluntary vs Involuntary</h2>
            <EpistemicBadge status="assumed" size="sm" />
          </div>
          <div className="space-y-3">
            {[
              { label: "Voluntary", count: volSplit.voluntary, color: "bg-amber-400" },
              { label: "Involuntary", count: volSplit.involuntary, color: "bg-red-400" },
              { label: "Unknown / Unclassified", count: volSplit.unknown, color: "bg-gray-300" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="text-xs text-gray-700 w-40">{label}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${color} h-3 rounded-full`}
                    style={{ width: volTotal > 0 ? `${(count / volTotal) * 100}%` : "0%" }}
                  />
                </div>
                <div className="text-xs font-medium text-gray-700 w-8 text-right">{formatNumber(count)}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Classification is inferred from reason text. A standardized voluntary/involuntary flag in the source system would improve accuracy.
          </p>
        </div>
      </div>

      {/* Tenure buckets */}
      {tenure.some((t) => t.count > 0) && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Attrition by Tenure Bucket</h2>
            <EpistemicBadge status="derived" size="sm" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {tenure.map((b) => (
              <div key={b.label} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-gray-900">{b.count}</div>
                <div className="text-xs text-gray-500 mt-0.5">{b.label}</div>
                <div className="text-xs text-gray-400">{formatPct(b.pct)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Tenure derived from Date of Last Hire vs event date. Employees without a hire date are excluded.
          </p>
        </div>
      )}
    </div>
  );
}
