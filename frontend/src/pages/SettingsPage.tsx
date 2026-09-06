import { useCallback, useEffect, useState } from "react";
import Card from "../components/dashboard/Card";
import { USDT_TO_INR } from "../utils/inrFormat";

const KEY_NOTIFY_LOW = "gridos-settings-notify-low";
const KEY_NOTIFY_SETTLE = "gridos-settings-notify-settle";
const KEY_NOTIFY_P2P = "gridos-settings-notify-p2p";
const KEY_DATA_RETENTION = "gridos-settings-retention";

function readBool(key: string, defaultVal: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* ignore */
  }
  return defaultVal;
}

function readString(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(key);
    if (v != null && v.length > 0) return v;
  } catch {
    /* ignore */
  }
  return fallback;
}

export default function SettingsPage() {
  const [notifyLow, setNotifyLow] = useState(() => readBool(KEY_NOTIFY_LOW, true));
  const [notifySettle, setNotifySettle] = useState(() => readBool(KEY_NOTIFY_SETTLE, true));
  const [notifyP2P, setNotifyP2P] = useState(() => readBool(KEY_NOTIFY_P2P, true));
  const [retention, setRetention] = useState(() => readString(KEY_DATA_RETENTION, "90"));

  useEffect(() => {
    try {
      localStorage.setItem(KEY_NOTIFY_LOW, notifyLow ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [notifyLow]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_NOTIFY_SETTLE, notifySettle ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [notifySettle]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_NOTIFY_P2P, notifyP2P ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [notifyP2P]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_DATA_RETENTION, retention);
    } catch {
      /* ignore */
    }
  }, [retention]);

  const onExport = useCallback(() => {
    window.alert("Export would download ledger CSV (demo).");
  }, []);

  return (
    <>
      <header className="gridos-page-head">
        <h1 className="gridos-page-title">Settings</h1>
        <p className="gridos-page-desc">
          Node identity, alerts, and data preferences. Changes apply on this device immediately.
        </p>
      </header>

      <div className="gridos-settings-grid">
        <Card className="gridos-settings-card">
          <h3 className="gridos-section-title">Node</h3>
          <dl className="gridos-settings-dl">
            <div>
              <dt>Display name</dt>
              <dd>ALPHA-01</dd>
            </div>
            <div>
              <dt>Node ID</dt>
              <dd className="gridos-p2p-mono">0x7f3a…e901</dd>
            </div>
            <div>
              <dt>Validator</dt>
              <dd>
                <span className="gridos-badge">Verified</span>
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="gridos-settings-card">
          <h3 className="gridos-section-title">Notifications</h3>
          <ul className="gridos-settings-toggles">
            <li>
              <div>
                <p className="gridos-settings-toggle-label">Low prepaid balance</p>
                <p className="gridos-settings-toggle-hint">Push when below threshold</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyLow}
                className={`gridos-switch${notifyLow ? " is-on" : ""}`}
                onClick={() => setNotifyLow((v) => !v)}
              >
                <span className="gridos-switch-knob" />
              </button>
            </li>
            <li>
              <div>
                <p className="gridos-settings-toggle-label">Settlement receipts</p>
                <p className="gridos-settings-toggle-hint">Each on-chain credit or debit</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifySettle}
                className={`gridos-switch${notifySettle ? " is-on" : ""}`}
                onClick={() => setNotifySettle((v) => !v)}
              >
                <span className="gridos-switch-knob" />
              </button>
            </li>
            <li>
              <div>
                <p className="gridos-settings-toggle-label">P2P matches</p>
                <p className="gridos-settings-toggle-hint">When a counterparty accepts</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyP2P}
                className={`gridos-switch${notifyP2P ? " is-on" : ""}`}
                onClick={() => setNotifyP2P((v) => !v)}
              >
                <span className="gridos-switch-knob" />
              </button>
            </li>
          </ul>
        </Card>

        <Card className="gridos-settings-card">
          <h3 className="gridos-section-title">Data & display</h3>
          <label className="gridos-settings-field">
            <span className="gridos-settings-field-label">Ledger history (days)</span>
            <select
              className="gridos-settings-select"
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
            >
              <option value="30">30</option>
              <option value="90">90</option>
              <option value="365">365</option>
            </select>
          </label>
          <p className="gridos-settings-hint">
            Rs. amounts use a fixed mock rate: USDT-equivalent units × {USDT_TO_INR} for display only.
          </p>
          <button type="button" className="gridos-settings-export" onClick={onExport}>
            Export ledger (.csv)
          </button>
        </Card>
      </div>
    </>
  );
}
