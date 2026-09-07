import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../components/dashboard/Card";
import TransactionRow from "../components/dashboard/TransactionRow";
import PaymentGatewayModal, { type PaymentSuccessData } from "../components/wallet/PaymentGatewayModal";
import { formatRs, formatSignedRsFromUsdt } from "../utils/inrFormat";
import {
  getRealtimeBalance,
  resetRealtimeBalance,
  HOURLY_BURN_USDT,
} from "../utils/realtimeBalance";

const STORAGE_MODE = "gridos-wallet-billing";
const STORAGE_TXS = "gridos-wallet-activity-txs";

/** Matches dashboard “cost / hour” for runtime estimate */
const LOW_BALANCE_USDT = 0;

type BillingMode = "prepaid" | "postpaid";

type TxItem = {
  id: string;
  type: string;
  hash: string;
  amount: string;
  credit?: boolean;
  time: string;
};

const INITIAL_TXS: TxItem[] = [
  {
    id: "tx-1",
    type: "Top-up",
    hash: "0xfeed…a901",
    amount: formatSignedRsFromUsdt(0, true),
    credit: true,
    time: "1d ago",
  },
  {
    id: "tx-2",
    type: "Grid consumption",
    hash: "0x88aa…3c10",
    amount: formatSignedRsFromUsdt(0, false),
    time: "3h ago",
  },
  {
    id: "tx-3",
    type: "Validator reward",
    hash: "0x91be…8f04",
    amount: formatSignedRsFromUsdt(0, true),
    credit: true,
    time: "6h ago",
  },
  {
    id: "tx-4",
    type: "P2P settlement",
    hash: "0x7a3f…c21d",
    amount: formatSignedRsFromUsdt(0, false),
    time: "2d ago",
  },
];

function readStoredTxs(): TxItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_TXS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return INITIAL_TXS;
}

function readMode(): BillingMode {
  try {
    const v = localStorage.getItem(STORAGE_MODE);
    if (v === "postpaid" || v === "prepaid") return v;
  } catch {
    /* ignore */
  }
  return "prepaid";
}

function formatRuntimeFromBalance(balanceUsdt: number) {
  const hours = balanceUsdt / HOURLY_BURN_USDT;
  if (!Number.isFinite(hours) || hours <= 0) {
    return { label: "No runtime left", sub: "Top up to restore power credit." };
  }
  const totalMinutes = Math.floor(hours * 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const h = Math.floor((totalMinutes % (60 * 24)) / 60);
  const m = totalMinutes % 60;
  let label: string;
  if (days >= 1) {
    label = `${days} day${days === 1 ? "" : "s"} ${h} hr`;
  } else if (h >= 1) {
    label = `${h} hr ${m} min`;
  } else {
    label = `${m} min`;
  }
  return {
    label: `~${label}`,
    sub: `At ${formatRs(HOURLY_BURN_USDT)}/h (current live draw).`,
  };
}

export default function WalletPage() {
  const [billingMode, setBillingMode] = useState<BillingMode>(readMode);
  const [prepaidBalance, setPrepaidBalance] = useState(getRealtimeBalance);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [transactions, setTransactions] = useState<TxItem[]>(readStoredTxs);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MODE, billingMode);
    } catch {
      /* ignore */
    }
  }, [billingMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TXS, JSON.stringify(transactions));
    } catch {
      /* ignore */
    }
  }, [transactions]);

  useEffect(() => {
    const refreshBalance = () => setPrepaidBalance(getRealtimeBalance());
    const interval = setInterval(refreshBalance, 1000);
    window.addEventListener("storage", refreshBalance);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", refreshBalance);
    };
  }, []);

  const isPrepaidLow = billingMode === "prepaid" && prepaidBalance < LOW_BALANCE_USDT;
  const runtime = useMemo(() => formatRuntimeFromBalance(prepaidBalance), [prepaidBalance]);

  const onOpenGateway = useCallback(() => {
    setIsGatewayOpen(true);
  }, []);

  const handlePaymentSuccess = useCallback((data: PaymentSuccessData) => {
    setPrepaidBalance(getRealtimeBalance());
    const newTx: TxItem = {
      id: data.transactionId,
      type: `Top-up (${data.paymentMethod})`,
      hash: `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
      amount: `+Rs. ${data.amountInr.toLocaleString("en-IN")}.00`,
      credit: true,
      time: "Just now",
    };
    setTransactions((prev) => [newTx, ...prev]);
  }, []);

  const onResetBalance = useCallback(() => {
    const zeroed = resetRealtimeBalance();
    setPrepaidBalance(zeroed);
  }, []);

  return (
    <>
      <header className="gridos-page-head">
        <h1 className="gridos-page-title">Wallet</h1>
        <p className="gridos-page-desc">
          Prepaid draws down your balance (shown in Rs.) as the node runs. Postpaid bills your linked
          account each cycle. Runtime uses your current average cost per hour.
        </p>
      </header>

      {isPrepaidLow ? (
        <div className="gridos-wallet-alert" role="alert">
          <div className="gridos-wallet-alert__icon" aria-hidden>
            !
          </div>
          <div>
            <p className="gridos-wallet-alert__title">Low balance</p>
            <p className="gridos-wallet-alert__body">
              Your prepaid balance is below {formatRs(LOW_BALANCE_USDT)}. Top up to avoid
              service interruption. Push notification sent <strong>10 min ago</strong>.
            </p>
          </div>
        </div>
      ) : null}

      <div className="gridos-wallet-segment" role="tablist" aria-label="Billing mode">
        <button
          type="button"
          role="tab"
          aria-selected={billingMode === "prepaid"}
          className={`gridos-wallet-segment__btn${billingMode === "prepaid" ? " is-active" : ""}`}
          onClick={() => setBillingMode("prepaid")}
        >
          Prepaid
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={billingMode === "postpaid"}
          className={`gridos-wallet-segment__btn${billingMode === "postpaid" ? " is-active" : ""}`}
          onClick={() => setBillingMode("postpaid")}
        >
          Postpaid
        </button>
      </div>

      <div className="gridos-wallet-grid">
        {billingMode === "prepaid" ? (
          <Card
            className={`gridos-card--balance gridos-wallet-balance-card${isPrepaidLow ? " gridos-card--balance-low" : ""}`}
          >
            <div>
              <p className="gridos-balance-label">Prepaid balance</p>
              <p className="gridos-balance-value">{formatRs(prepaidBalance)}</p>
              <p className="gridos-balance-meta">Est. time to stay powered on: {runtime.label}</p>
              <p className="gridos-wallet-runtime-hint">{runtime.sub}</p>
            </div>
            <button type="button" className="gridos-topup" onClick={onOpenGateway}>
              Top up
            </button>
          </Card>
        ) : (
          <Card className="gridos-wallet-postpaid-card">
            <p className="gridos-wallet-postpaid-label">Postpaid account</p>
            <p className="gridos-wallet-postpaid-outstanding">
              Cycle to date: <strong>{formatRs(0)}</strong>
            </p>
            <p className="gridos-wallet-postpaid-meta">
              Credit limit <strong>{formatRs(0)}</strong> · Next statement in{" "}
              <strong>0 days</strong>
            </p>
            <p className="gridos-wallet-postpaid-power">
              Power-on: <span>not limited</span> by wallet balance while within limit.
            </p>
            <p className="gridos-wallet-runtime-hint gridos-wallet-runtime-hint--dark">
              Usage accrues monthly; autopay settles in Rs. on due date.
            </p>
          </Card>
        )}

        <Card className="gridos-wallet-side-card">
          <h3 className="gridos-section-title">Billing details</h3>
          {billingMode === "prepaid" ? (
            <ul className="gridos-wallet-facts">
              <li>
                <span>Hourly burn (est.)</span>
                <strong>{formatRs(HOURLY_BURN_USDT)}/h</strong>
              </li>
              <li>
                <span>Low-balance threshold</span>
                <strong>{formatRs(LOW_BALANCE_USDT)}</strong>
              </li>
              <li>
                <span>Alert channel</span>
                <strong>In-app + push</strong>
              </li>
            </ul>
          ) : (
            <ul className="gridos-wallet-facts">
              <li>
                <span>Payment method</span>
                <strong>Linked account</strong>
              </li>
              <li>
                <span>Billing cycle</span>
                <strong>Monthly</strong>
              </li>
              <li>
                <span>Low balance alerts</span>
                <strong>Prepaid only</strong>
              </li>
            </ul>
          )}
          {billingMode === "prepaid" ? (
            <button
              type="button"
              className="gridos-wallet-demo-btn"
              onClick={onResetBalance}
            >
              Reset balance to 0
            </button>
          ) : null}
        </Card>
      </div>

      <section className="gridos-settlements-card">
        <h3 className="gridos-section-title">Wallet activity</h3>
        <div className="gridos-tx-list">
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              type={tx.type}
              hash={tx.hash}
              amount={tx.amount}
              credit={tx.credit}
              time={tx.time}
            />
          ))}
        </div>
      </section>

      {/* GridOS Secure Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

