import Card from "../components/dashboard/Card";
import TransactionRow from "../components/dashboard/TransactionRow";
import { formatRs, formatSignedRsFromUsdt } from "../utils/inrFormat";

type Listing = {
  id: string;
  node: string;
  role: "sell" | "buy";
  energyKwh: number;
  pricePerKwhUsdt: number;
  window: string;
};

const LISTINGS: Listing[] = [
  { id: "1", node: "NODE-BETA-04", role: "sell", energyKwh: 0, pricePerKwhUsdt: 0, window: "Today 14:00–18:00" },
  { id: "2", node: "GRID-EAST-12", role: "sell", energyKwh: 0, pricePerKwhUsdt: 0, window: "Tomorrow 08:00–12:00" },
  { id: "3", node: "ALPHA-01 (you)", role: "buy", energyKwh: 0, pricePerKwhUsdt: 0, window: "Open offer" },
  { id: "4", node: "VOLT-NODE-09", role: "sell", energyKwh: 0, pricePerKwhUsdt: 0, window: "Next 48h" },
];

export default function P2PPage() {
  return (
    <>
      <header className="gridos-page-head">
        <h1 className="gridos-page-title">P2P marketplace</h1>
        <p className="gridos-page-desc">
          Trade surplus kWh with verified nodes. Prices settle on-chain; delivery windows are matched
          automatically when both parties confirm.
        </p>
      </header>

      <div className="gridos-p2p-stats">
        <Card className="gridos-p2p-stat">
          <p className="gridos-p2p-stat-label">24h volume</p>
          <p className="gridos-p2p-stat-value">{formatRs(0)}</p>
          <p className="gridos-p2p-stat-sub">Settled notional</p>
        </Card>
        <Card className="gridos-p2p-stat">
          <p className="gridos-p2p-stat-label">Best ask</p>
          <p className="gridos-p2p-stat-value">{formatRs(0)}/kWh</p>
          <p className="gridos-p2p-stat-sub">Lowest sell on book</p>
        </Card>
        <Card className="gridos-p2p-stat">
          <p className="gridos-p2p-stat-label">Open listings</p>
          <p className="gridos-p2p-stat-value">0</p>
          <p className="gridos-p2p-stat-sub">Across mainnet peers</p>
        </Card>
      </div>

      <Card className="gridos-p2p-table-card">
        <div className="gridos-p2p-table-head">
          <h3 className="gridos-section-title" style={{ marginBottom: 0 }}>
            Live book
          </h3>
          <span className="gridos-live-badge">Matching</span>
        </div>
        <div className="gridos-p2p-table-wrap">
          <table className="gridos-p2p-table">
            <thead>
              <tr>
                <th>Node</th>
                <th>Side</th>
                <th>Energy</th>
                <th>Price / kWh</th>
                <th>Window</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {LISTINGS.map((row) => (
                <tr key={row.id}>
                  <td className="gridos-p2p-mono">{row.node}</td>
                  <td>
                    <span className={row.role === "sell" ? "gridos-p2p-tag gridos-p2p-tag--sell" : "gridos-p2p-tag gridos-p2p-tag--buy"}>
                      {row.role === "sell" ? "Sell" : "Buy"}
                    </span>
                  </td>
                  <td>{row.energyKwh} kWh</td>
                  <td className="gridos-p2p-price">{formatRs(row.pricePerKwhUsdt)}</td>
                  <td className="gridos-p2p-muted">{row.window}</td>
                  <td>
                    <button type="button" className="gridos-p2p-action">
                      {row.role === "sell" ? "Match" : row.node.includes("(you)") ? "Manage" : "Counter"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="gridos-settlements-card">
        <h3 className="gridos-section-title">Recent P2P settlements</h3>
        <div className="gridos-tx-list">
          <TransactionRow
            type="P2P buy — NODE-GAMMA"
            hash="0x6c2a…91ff"
            amount={formatSignedRsFromUsdt(0, false)}
            time="22m ago"
          />
          <TransactionRow
            type="P2P sell — excess solar"
            hash="0x4d11…80aa"
            amount={formatSignedRsFromUsdt(0, true)}
            credit
            time="5h ago"
          />
          <TransactionRow
            type="P2P buy — peak shave"
            hash="0xbb09…2c44"
            amount={formatSignedRsFromUsdt(0, false)}
            time="1d ago"
          />
        </div>
      </section>
    </>
  );
}
