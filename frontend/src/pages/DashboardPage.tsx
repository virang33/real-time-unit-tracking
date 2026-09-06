import Card from "../components/dashboard/Card";
import MetricGauge from "../components/dashboard/MetricGauge";
import InfrastructureCard from "../components/dashboard/InfrastructureCard";
import TransactionRow from "../components/dashboard/TransactionRow";
import { IconBattery, IconEv, IconFan } from "../components/dashboard/gridosIcons";
import { formatRs, formatSignedRsFromUsdt } from "../utils/inrFormat";

const trendBarHeights = [45, 72, 55, 88, 62, 95, 70, 82, 58, 90, 65, 78];

export default function DashboardPage() {
  return (
    <>
      <div className="gridos-row-top">
        <Card className="gridos-card--dynamics">
          <MetricGauge
            label="Live load"
            value="14.8"
            unit="kW"
            trend="+2.4%"
            fillPortion={0.55}
          />
          <div className="gridos-dynamics-copy">
            <h2>Grid dynamics</h2>
            <p>
              Real-time energy consumption with blockchain synchronization. Metrics update as your node
              settles on-chain.
            </p>
            <div className="gridos-submetrics">
              <div className="gridos-submetric">
                <span>Cost / hour</span>
                <strong>{formatRs(4.12)}/h</strong>
              </div>
              <div className="gridos-submetric">
                <span>Efficiency</span>
                <strong>94.2%</strong>
              </div>
            </div>
          </div>
        </Card>

        <Card className="gridos-card--balance">
          <div>
            <p className="gridos-balance-label">Total balance</p>
            <p className="gridos-balance-value">{formatRs(14284.92)}</p>
            <p className="gridos-balance-meta">Est. remaining 128 days</p>
          </div>
          <button type="button" className="gridos-topup">
            Top up
          </button>
        </Card>

        <Card className="gridos-card--trend">
          <div className="gridos-trend-head">
            <span className="gridos-live-badge">Market live</span>
          </div>
          <div className="gridos-mini-bars" aria-hidden>
            {trendBarHeights.map((h, i) => (
              <div key={i} className="gridos-mini-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="gridos-trend-foot">{formatRs(0.142)} avg per kWh</p>
        </Card>
      </div>

      <div className="gridos-row-bottom">
        <section>
          <h3 className="gridos-section-title">Live infrastructure</h3>
          <div className="gridos-infra-grid">
            <InfrastructureCard
              name="Central HVAC"
              kw="3.24 kW"
              status="active"
              icon={<IconFan />}
              sparkPoints="0,20 12,8 24,14 36,6 48,12 60,4 72,10 84,6 96,12 100,8"
            />
            <InfrastructureCard
              name="Battery storage"
              kw="1.12 kW"
              status="active"
              icon={<IconBattery />}
              sparkPoints="0,14 14,22 28,12 42,18 56,10 70,16 84,8 100,14"
            />
            <InfrastructureCard
              name="Tesla Wall Connector"
              kw="0.00 kW"
              status="standby"
              icon={<IconEv />}
              sparkPoints="0,18 20,16 40,18 60,14 80,18 100,16"
            />
            <button type="button" className="gridos-register-node">
              Register new node
            </button>
          </div>
        </section>

        <section className="gridos-settlements-card">
          <h3 className="gridos-section-title">Recent settlements</h3>
          <div className="gridos-tx-list">
            <TransactionRow
              type="P2P purchase"
              hash="0x7a3f…c21d"
              amount={formatSignedRsFromUsdt(42.1, false)}
              time="2m ago"
            />
            <TransactionRow
              type="Solar generation credit"
              hash="0x91be…8f04"
              amount={formatSignedRsFromUsdt(128, true)}
              credit
              time="18m ago"
            />
            <TransactionRow
              type="Grid balancing reward"
              hash="0x44cd…a901"
              amount={formatSignedRsFromUsdt(12.55, true)}
              credit
              time="1h ago"
            />
            <TransactionRow
              type="Validator fee"
              hash="0xb102…3eef"
              amount={formatSignedRsFromUsdt(3.2, false)}
              time="3h ago"
            />
          </div>
          <footer className="gridos-ledger-foot">
            <span>
              <strong>Mainnet live</strong>
            </span>
            <span>12ms latency</span>
            <a href="#export">Export ledger (.csv)</a>
          </footer>
        </section>
      </div>
    </>
  );
}
