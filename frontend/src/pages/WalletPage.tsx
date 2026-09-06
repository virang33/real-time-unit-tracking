import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../components/dashboard/Card";
import TransactionRow from "../components/dashboard/TransactionRow";
import { formatRs, formatSignedRsFromUsdt } from "../utils/inrFormat";

const STORAGE_MODE = "gridos-wallet-billing";
const STORAGE_BALANCE = "gridos-wallet-balance";

/** Matches dashboard “cost / hour” for runtime estimate */
const HOURLY_BURN_USDT = 4.12;
const LOW_BALANCE_USDT = 500;

type BillingMode = "prepaid" | "postpaid";

function readMode(): BillingMode {
  try {
    const v = localStorage.getItem(STORAGE_MODE);
    if (v === "postpaid" || v === "prepaid") return v;
  } catch {
    /* ignore */
  }
  return "prepaid";
}

function readBalance(): number {
  try {
    const v = localStorage.getItem(STORAGE_BALANCE);
    if (v != null) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  } catch {
    /* ignore */
  }
  return 14284.92;
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
  const [prepaidBalance, setPrepaidBalance] = useState(readBalance);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MODE, billingMode);
    } catch {
      /* ignore */
    }
  }, [billingMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BALANCE, String(prepaidBalance));
    } catch {
      /* ignore */
    }
  }, [prepaidBalance]);

  const isPrepaidLow = billingMode === "prepaid" && prepaidBalance < LOW_BALANCE_USDT;
  const runtime = useMemo(() => formatRuntimeFromBalance(prepaidBalance), [prepaidBalance]);

  const onTopUp = useCallback(() => {
    setPrepaidBalance((b) => Math.round((b + 2500) * 100) / 100);
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
            <button type="button" className="gridos-topup" onClick={onTopUp}>
              Top up
            </button>
          </Card>
        ) : (
          <Card className="gridos-wallet-postpaid-card">
            <p className="gridos-wallet-postpaid-label">Postpaid account</p>
            <p className="gridos-wallet-postpaid-outstanding">
              Cycle to date: <strong>{formatRs(312.4)}</strong>
            </p>
            <p className="gridos-wallet-postpaid-meta">
              Credit limit <strong>{formatRs(5000)}</strong> · Next statement in{" "}
              <strong>12 days</strong>
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
              onClick={() => setPrepaidBalance(85)}
            >
              Demo: set low balance
            </button>
          ) : null}
        </Card>
      </div>

      <section className="gridos-settlements-card">
        <h3 className="gridos-section-title">Wallet activity</h3>
        <div className="gridos-tx-list">
          <TransactionRow
            type="Top-up"
            hash="0xfeed…a901"
            amount={formatSignedRsFromUsdt(2500, true)}
            credit
            time="1d ago"
          />
          <TransactionRow
            type="Grid consumption"
            hash="0x88aa…3c10"
            amount={formatSignedRsFromUsdt(18.44, false)}
            time="3h ago"
          />
          <TransactionRow
            type="Validator reward"
            hash="0x91be…8f04"
            amount={formatSignedRsFromUsdt(12.55, true)}
            credit
            time="6h ago"
          />
          <TransactionRow
            type="P2P settlement"
            hash="0x7a3f…c21d"
            amount={formatSignedRsFromUsdt(42.1, false)}
            time="2d ago"
          />
        </div>
      </section>
    </>
  );
}
