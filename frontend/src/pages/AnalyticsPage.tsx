import { useEffect, useMemo, useState, type ReactNode } from "react";
import Card from "../components/dashboard/Card";
import MetricGauge from "../components/dashboard/MetricGauge";
import { IconBattery, IconEv, IconFan } from "../components/dashboard/gridosIcons";
import { MonthlyLineChart, WeeklyBarChart } from "../components/analytics/UsageCharts";

const WEEKLY_KWH = [0, 0, 0, 0, 0, 0, 0];
const WEEKLY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTHLY_KWH = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const MONTHLY_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function useJitteredValue(initial: number, min: number, max: number, intervalMs = 1600) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    const id = window.setInterval(() => {
      setV((x) => {
        const n = x + (Math.random() - 0.5) * (max - min) * 0.08;
        return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [min, max, intervalMs]);
  return v;
}

function formatKw(v: number) {
  return `${v.toFixed(2)} kW`;
}

type UnitRtProps = {
  name: string;
  kw: number;
  status: "active" | "standby";
  icon: ReactNode;
  sparkSeed: number;
};

function UnitRealtimeCard({ name, kw, status, icon, sparkSeed }: UnitRtProps) {
  const pts = useMemo(() => {
    const base = sparkSeed * 17;
    const out: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * 100;
      const wave = Math.sin((i + base) * 0.7) * 8 + Math.cos((i + base) * 0.4) * 5;
      const y = 18 + wave + (kw > 0.5 ? 0 : 6);
      out.push(`${x},${Math.min(26, Math.max(4, y))}`);
    }
    return out.join(" ");
  }, [kw, sparkSeed]);

  return (
    <article className="gridos-unit-rt">
      <div className="gridos-unit-rt-head">
        <div className="gridos-infra-icon">{icon}</div>
        <span
          className={
            status === "active" ? "gridos-status-dot" : "gridos-status-dot gridos-status-dot--standby"
          }
          title={status === "active" ? "Active" : "Standby"}
        />
      </div>
      <p className="gridos-unit-rt-name">{name}</p>
      <p className="gridos-unit-rt-kw">{formatKw(kw)}</p>
      <svg className="gridos-unit-rt-spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    </article>
  );
}

export default function AnalyticsPage() {
  const weeklyTotal = WEEKLY_KWH.reduce((a, b) => a + b, 0);
  const monthlyTotal = MONTHLY_KWH.reduce((a, b) => a + b, 0);

  const liveAggregate = useJitteredValue(0, 0, 0, 1400);
  const fillPortion = 0;

  const hvacKw = useJitteredValue(0, 0, 0, 1500);
  const storageKw = useJitteredValue(0, 0, 0, 1700);
  const evKw = useJitteredValue(0, 0, 0, 2000);

  const weeklyTrendPct = weekHalfOverHalfChange(WEEKLY_KWH);
  const trendWeekly =
    weeklyTrendPct >= 0 ? `+${weeklyTrendPct.toFixed(1)}%` : `${weeklyTrendPct.toFixed(1)}%`;

  return (
    <>
      <header className="gridos-page-head">
        <h1 className="gridos-page-title">Analytics</h1>
        <p className="gridos-page-desc">
          Energy usage by week and month (kWh), live draw per unit, and aggregate real-time load from
          your node.
        </p>
      </header>

      <div className="gridos-analytics-top">
        <Card className="gridos-usage-card">
          <div className="gridos-usage-head">
            <div>
              <p className="gridos-usage-label">This week</p>
              <p className="gridos-usage-total">
                {weeklyTotal.toLocaleString()}
                <span>kWh</span>
              </p>
            </div>
            <span
              className={`gridos-usage-delta${weeklyTrendPct < 0 ? " gridos-usage-delta--down" : ""}`}
            >
              {trendWeekly} vs last week
            </span>
          </div>
          <div className="gridos-chart-wrap">
            <WeeklyBarChart labels={WEEKLY_LABELS} valuesKwh={WEEKLY_KWH} />
          </div>
        </Card>

        <Card className="gridos-usage-card">
          <div className="gridos-usage-head">
            <div>
              <p className="gridos-usage-label">This year (monthly)</p>
              <p className="gridos-usage-total">
                {(monthlyTotal / 1000).toFixed(2)}
                <span>MWh</span>
              </p>
            </div>
            <span className="gridos-usage-delta">0% vs prior year</span>
          </div>
          <div className="gridos-chart-wrap">
            <MonthlyLineChart labels={MONTHLY_LABELS} valuesKwh={MONTHLY_KWH} />
          </div>
        </Card>
      </div>

      <section style={{ marginTop: 8 }}>
        <h3 className="gridos-section-title">Real-time unit monitoring</h3>
        <div className="gridos-analytics-mid">
          <Card className="gridos-rt-card">
            <MetricGauge
              label="Live load"
              value={liveAggregate.toFixed(1)}
              unit="kW"
              trend="Streaming"
              fillPortion={fillPortion}
            />
            <p className="gridos-rt-caption">
              Combined power across registered units. Values refresh from your meter stream.
            </p>
          </Card>
          <div className="gridos-units-analytics">
            <UnitRealtimeCard
              name="Main HVAC unit"
              kw={hvacKw}
              status="active"
              icon={<IconFan />}
              sparkSeed={1}
            />
            <UnitRealtimeCard
              name="Sub-Zero storage"
              kw={storageKw}
              status="active"
              icon={<IconBattery />}
              sparkSeed={2}
            />
            <UnitRealtimeCard
              name="Tesla Wall Connector"
              kw={evKw}
              status={evKw < 0.02 ? "standby" : "active"}
              icon={<IconEv />}
              sparkSeed={3}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function weekHalfOverHalfChange(values: number[]) {
  const half = Math.floor(values.length / 2);
  if (half < 1 || values.length - half < 1) return 0;
  const a = values.slice(0, half).reduce((s, x) => s + x, 0) / half;
  const b = values.slice(half).reduce((s, x) => s + x, 0) / (values.length - half);
  return ((b - a) / Math.max(a, 1)) * 100;
}
