import { useEffect, useState } from "react";
import { apiRequest } from "../api/axios";

type TelemetryData = {
  deviceId?: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
  gridStatus?: string;
  relayState?: string;
  updatedAt?: string;
};

export default function DashboardPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    deviceId: "Demo Node",
    voltage: 0,
    current: 0,
    power: 0,
    energy: 0,
    frequency: 0,
    powerFactor: 0,
    gridStatus: "ONLINE",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchLiveTelemetry = async () => {
      try {
        const data = await apiRequest<TelemetryData>("/live-data");
        if (isMounted && data) {
          setTelemetry((prev) => ({ ...prev, ...data }));
        }
      } catch {
        /* ignore polling errors */
      }
    };

    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const metrics = [
    {
      title: "VOLTAGE",
      value: telemetry.voltage ? String(telemetry.voltage) : "0",
      unit: "V",
      subtitle: "AC input level",
      tone: "blue",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z" fill="currentColor" />
        </svg>
      )
    },
    {
      title: "CURRENT",
      value: telemetry.current ? String(telemetry.current) : "0",
      unit: "A",
      subtitle: "Load current",
      tone: "green",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h4l2-5 3 10 2-5h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: "POWER",
      value: telemetry.power ? String(telemetry.power) : "0",
      unit: "W",
      subtitle: "Real-time wattage",
      tone: "cream",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 16.5h10M8 13.5l2-5h4l-2 5h2.5l-5.5 7 1.5-6H8l2-6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: "ENERGY",
      value: telemetry.energy ? String(telemetry.energy) : "0",
      unit: "kWh",
      subtitle: "Total consumed",
      tone: "purple",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 18h10M9 18V9m6 9V6m-3 12V4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    },
    {
      title: "FREQUENCY",
      value: telemetry.frequency ? String(telemetry.frequency) : "0",
      unit: "Hz",
      subtitle: "AC line frequency",
      tone: "lavender",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12c2.5-4 5.5-6 8-6 3.6 0 6.4 3.3 8 6-2.5 4-5.5 6-8 6-3.6 0-6.4-3.3-8-6Zm8-2v4m-2-2h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: "POWER FACTOR",
      value: telemetry.powerFactor ? String(telemetry.powerFactor) : "0",
      unit: "",
      subtitle: "Load efficiency",
      tone: "pink",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 12h3l2-4 2 8 2-4h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  const summaryRows = [
    { label: "CONNECTION", value: telemetry.deviceId === "ESP32-GRID-NODE-01" ? "ESP32 (MyPhone)" : (telemetry.deviceId || "ESP32 Connected") },
    { label: "VOLTAGE", value: `${telemetry.voltage || 0} V` },
    { label: "CURRENT", value: `${telemetry.current || 0} A` },
    { label: "POWER", value: `${telemetry.power || 0} W` }
  ];

  const hasPower = (telemetry.power || 0) > 0;

  return (
    <div className="ac-dashboard-wrapper">
      <header className="ac-header">
        <div className="ac-header-left">
          <div className="ac-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z" fill="currentColor" />
            </svg>
          </div>
          <div className="ac-header-text">
            <h1>AC Energy Dashboard</h1>
            <p>Live voltage, current, power, energy, frequency and power factor monitoring</p>
          </div>
        </div>

        <div className="ac-device-status">
          <span className="ac-device-label">Connected Device</span>
          <div className="ac-device-value">
            <span className="ac-status-dot" />
            {telemetry.deviceId
              ? (telemetry.deviceId === "ESP32-GRID-NODE-01" ? "ESP32 (MyPhone)" : telemetry.deviceId)
              : "ESP32 Connected"}
          </div>
        </div>
      </header>

      <div className="ac-metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.title} className={`ac-metric-card ac-metric-card--${metric.tone}`}>
            <div className="ac-metric-header">
              <h2 className="ac-metric-title">{metric.title}</h2>
              <div className="ac-metric-icon" aria-hidden="true">
                {metric.icon}
              </div>
            </div>

            <div className="ac-metric-value">
              {metric.value}
              {metric.unit ? <span className="ac-metric-unit">{metric.unit}</span> : null}
            </div>
            <div className="ac-metric-subtitle">{metric.subtitle}</div>
            <span className="ac-metric-orb" aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="ac-bottom-section">
        <div className="ac-chart-card">
          <div className="ac-card-title">Real-time Power Trend</div>
          <svg className="ac-power-chart" viewBox="0 0 700 260" preserveAspectRatio="none" aria-label="Power trend chart">
            <g className="ac-chart-grid" aria-hidden="true">
              <line x1="0" y1="40" x2="700" y2="40" />
              <line x1="0" y1="100" x2="700" y2="100" />
              <line x1="0" y1="160" x2="700" y2="160" />
              <line x1="0" y1="220" x2="700" y2="220" />
            </g>
            <text x="24" y="22" className="ac-chart-label ac-chart-label--left">Power (W)</text>
            {hasPower ? (
              <path d="M0 180 C 100 130, 200 100, 350 120 S 550 80, 700 110" />
            ) : (
              <path d="M0 220 L 700 220" />
            )}
            <circle cx="480" cy={hasPower ? "100" : "220"} r="6" />
            <text x="560" y="182" className="ac-chart-label">0W</text>
            <text x="560" y="36" className="ac-chart-label">{telemetry.power ? `${telemetry.power * 2}W` : "0W"}</text>
            <text x="380" y="220" className="ac-chart-label">{telemetry.power || 0} W</text>
          </svg>
        </div>

        <div className="ac-summary-card">
          <div className="ac-card-title">Live Summary</div>
          <div className="ac-summary-list">
            {summaryRows.map((row) => (
              <div key={row.label} className="ac-summary-item">
                <span className="ac-summary-label">{row.label}</span>
                <span className="ac-summary-value">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="ac-progress-bar-container" aria-label="Power level indicator">
            <div
              className="ac-progress-bar-fill"
              style={{ width: `${Math.min(100, ((telemetry.power || 0) / 1000) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="ac-footer-label">AC Energy Meter By Circuit Diagrams</div>
    </div>
  );
}

