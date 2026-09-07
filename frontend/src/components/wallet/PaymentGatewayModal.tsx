import React, { useState, useEffect } from "react";
import { addRealtimeBalanceInr } from "../../utils/realtimeBalance";

export type PaymentSuccessData = {
  amountInr: number;
  paymentMethod: string;
  transactionId: string;
  timestamp: string;
};

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: PaymentSuccessData) => void;
}

type PaymentTab = "upi" | "card" | "netbanking" | "crypto";

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentGatewayModalProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [customInput, setCustomInput] = useState<string>("1000");
  const [activeTab, setActiveTab] = useState<PaymentTab>("upi");

  // Form states
  const [upiId, setUpiId] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("gpay");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [cryptoNetwork, setCryptoNetwork] = useState("Polygon");

  // Gateway status: 'idle' | 'processing' | 'success' | 'failed'
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [generatedTxnId, setGeneratedTxnId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setProcessingStep(0);
      setGeneratedTxnId("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomInput(String(val));
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCustomInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setAmount(num);
    } else {
      setAmount(0);
    }
  };

  const formatCardNumber = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 16);
    const groups = clean.match(/.{1,4}/g);
    return groups ? groups.join(" ") : clean;
  };

  const formatExpiry = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    return clean;
  };

  const handlePayNow = () => {
    if (amount <= 0) {
      alert("Please enter a valid recharge amount (minimum ₹100).");
      return;
    }

    setStatus("processing");
    setProcessingStep(1);

    // Multi-stage realistic payment processing simulation
    setTimeout(() => {
      setProcessingStep(2);
      setTimeout(() => {
        setProcessingStep(3);
        setTimeout(() => {
          const txnId = `TXN_GRID_${Math.floor(100000000 + Math.random() * 900000000)}`;
          setGeneratedTxnId(txnId);
          setStatus("success");

          // Update local balance
          addRealtimeBalanceInr(amount);

          let methodLabel = "UPI Instant";
          if (activeTab === "card") methodLabel = `Card (${cardNumber.slice(-4) || "Debit"})`;
          if (activeTab === "netbanking") methodLabel = `NetBanking (${selectedBank})`;
          if (activeTab === "crypto") methodLabel = `Crypto (${cryptoNetwork})`;

          onSuccess({
            amountInr: amount,
            paymentMethod: methodLabel,
            transactionId: txnId,
            timestamp: "Just now",
          });
        }, 800);
      }, 900);
    }, 800);
  };

  return (
    <div className="pg-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pg-header">
          <div className="pg-header-left">
            <div className="pg-shield-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
            </div>
            <div>
              <h2 className="pg-title">GridOS Secure Payment Gateway</h2>
              <p className="pg-subtitle">
                <span className="pg-ssl-tag">256-bit SSL</span> Instant Power Credit Settlement
              </p>
            </div>
          </div>
          <button
            type="button"
            className="pg-close-btn"
            onClick={onClose}
            aria-label="Close payment modal"
          >
            ✕
          </button>
        </div>

        {status === "processing" ? (
          <div className="pg-processing-view">
            <div className="pg-spinner" />
            <h3 className="pg-proc-title">Processing Secure Payment</h3>
            <p className="pg-proc-desc">Please do not refresh or close this window...</p>

            <div className="pg-proc-steps">
              <div className={`pg-step ${processingStep >= 1 ? "is-active" : ""}`}>
                <span className="pg-step-icon">{processingStep > 1 ? "✓" : "1"}</span>
                <span>Connecting to payment gateway</span>
              </div>
              <div className={`pg-step ${processingStep >= 2 ? "is-active" : ""}`}>
                <span className="pg-step-icon">{processingStep > 2 ? "✓" : "2"}</span>
                <span>Authorizing transaction via bank network</span>
              </div>
              <div className={`pg-step ${processingStep >= 3 ? "is-active" : ""}`}>
                <span className="pg-step-icon">3</span>
                <span>Syncing balance to GridOS energy ledger</span>
              </div>
            </div>
          </div>
        ) : status === "success" ? (
          <div className="pg-success-view">
            <div className="pg-success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="pg-success-title">Payment Successful!</h3>
            <p className="pg-success-desc">
              Your prepaid energy credit has been updated and activated.
            </p>

            <div className="pg-receipt-card">
              <div className="pg-receipt-row">
                <span>Amount Paid</span>
                <strong className="pg-highlight-green">₹{amount.toLocaleString("en-IN")}.00</strong>
              </div>
              <div className="pg-receipt-row">
                <span>Transaction ID</span>
                <code className="pg-mono">{generatedTxnId}</code>
              </div>
              <div className="pg-receipt-row">
                <span>Payment Mode</span>
                <span>{activeTab.toUpperCase()} Instant</span>
              </div>
              <div className="pg-receipt-row">
                <span>Status</span>
                <span className="pg-badge-success">Confirmed & On-Chain Synced</span>
              </div>
            </div>

            <button type="button" className="pg-done-btn" onClick={onClose}>
              Done & Return to Wallet
            </button>
          </div>
        ) : (
          <div className="pg-body">
            {/* Amount Selection Section */}
            <div className="pg-amount-box">
              <label className="pg-amount-label">Select Recharge Amount</label>
              <div className="pg-preset-grid">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`pg-preset-btn ${amount === val ? "is-selected" : ""}`}
                    onClick={() => handleAmountSelect(val)}
                  >
                    ₹{val.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              <div className="pg-custom-amount-wrapper">
                <span className="pg-currency-prefix">₹</span>
                <input
                  type="text"
                  className="pg-custom-amount-input"
                  placeholder="Enter custom amount"
                  value={customInput}
                  onChange={handleCustomAmountChange}
                />
                <span className="pg-amount-equiv">
                  ≈ {(amount / 83).toFixed(2)} USDT Power Credit
                </span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="pg-methods-container">
              <label className="pg-amount-label">Choose Payment Method</label>
              <div className="pg-tabs-bar" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "upi"}
                  className={`pg-tab ${activeTab === "upi" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("upi")}
                >
                  <span className="pg-tab-emoji">📱</span> UPI / QR
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "card"}
                  className={`pg-tab ${activeTab === "card" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("card")}
                >
                  <span className="pg-tab-emoji">💳</span> Card
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "netbanking"}
                  className={`pg-tab ${activeTab === "netbanking" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("netbanking")}
                >
                  <span className="pg-tab-emoji">🏦</span> Net Banking
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "crypto"}
                  className={`pg-tab ${activeTab === "crypto" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("crypto")}
                >
                  <span className="pg-tab-emoji">⚡</span> Web3 / Crypto
                </button>
              </div>

              <div className="pg-tab-content">
                {/* 1. UPI */}
                {activeTab === "upi" && (
                  <div className="pg-upi-view">
                    <div className="pg-upi-qr-card">
                      <div className="pg-qr-frame">
                        <svg viewBox="0 0 100 100" width="120" height="120" className="pg-qr-code">
                          {/* Simulated high tech QR Pattern */}
                          <rect x="0" y="0" width="100" height="100" fill="#0c121e" />
                          <rect x="10" y="10" width="25" height="25" fill="#38bdf8" rx="3" />
                          <rect x="15" y="15" width="15" height="15" fill="#0c121e" />
                          <rect x="18" y="18" width="9" height="9" fill="#38bdf8" />
                          <rect x="65" y="10" width="25" height="25" fill="#38bdf8" rx="3" />
                          <rect x="70" y="15" width="15" height="15" fill="#0c121e" />
                          <rect x="73" y="18" width="9" height="9" fill="#38bdf8" />
                          <rect x="10" y="65" width="25" height="25" fill="#38bdf8" rx="3" />
                          <rect x="15" y="70" width="15" height="15" fill="#0c121e" />
                          <rect x="18" y="73" width="9" height="9" fill="#38bdf8" />
                          <rect x="42" y="12" width="12" height="12" fill="#38bdf8" />
                          <rect x="42" y="30" width="16" height="8" fill="#38bdf8" />
                          <rect x="12" y="42" width="18" height="16" fill="#38bdf8" />
                          <rect x="42" y="44" width="16" height="16" fill="#34d399" />
                          <rect x="65" y="42" width="24" height="14" fill="#38bdf8" />
                          <rect x="42" y="66" width="14" height="22" fill="#38bdf8" />
                          <rect x="62" y="64" width="26" height="24" fill="#38bdf8" />
                        </svg>
                        <span className="pg-qr-badge">Scan & Pay ₹{amount}</span>
                      </div>

                      <div className="pg-upi-apps">
                        <p className="pg-sub-heading">Or select UPI app:</p>
                        <div className="pg-app-chips">
                          {[
                            { id: "gpay", name: "Google Pay", color: "#4285F4" },
                            { id: "phonepe", name: "PhonePe", color: "#5f259f" },
                            { id: "paytm", name: "Paytm", color: "#00b9f5" },
                            { id: "bhim", name: "BHIM UPI", color: "#22c55e" },
                          ].map((app) => (
                            <button
                              key={app.id}
                              type="button"
                              className={`pg-app-chip ${selectedUpiApp === app.id ? "is-active" : ""}`}
                              onClick={() => setSelectedUpiApp(app.id)}
                            >
                              <span className="pg-app-dot" style={{ backgroundColor: app.color }} />
                              {app.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pg-upi-id-row">
                      <input
                        type="text"
                        className="pg-input"
                        placeholder="Enter UPI ID (e.g. yourname@okhdfcbank)"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* 2. CARD */}
                {activeTab === "card" && (
                  <div className="pg-card-view">
                    <div className="pg-field">
                      <label>Card Number</label>
                      <input
                        type="text"
                        className="pg-input"
                        placeholder="4532 •••• •••• 8921"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      />
                    </div>

                    <div className="pg-field">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        className="pg-input"
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>

                    <div className="pg-field-grid">
                      <div className="pg-field">
                        <label>Expiry (MM/YY)</label>
                        <input
                          type="text"
                          className="pg-input"
                          placeholder="12/28"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        />
                      </div>
                      <div className="pg-field">
                        <label>CVV / CVC</label>
                        <input
                          type="password"
                          className="pg-input"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. NET BANKING */}
                {activeTab === "netbanking" && (
                  <div className="pg-bank-view">
                    <label className="pg-sub-heading">Popular Banks:</label>
                    <div className="pg-bank-grid">
                      {["HDFC", "SBI", "ICICI", "Axis Bank", "Kotak", "PNB"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={`pg-bank-card ${selectedBank === b ? "is-selected" : ""}`}
                          onClick={() => setSelectedBank(b)}
                        >
                          🏦 {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. CRYPTO */}
                {activeTab === "crypto" && (
                  <div className="pg-crypto-view">
                    <label className="pg-sub-heading">Select Network:</label>
                    <div className="pg-bank-grid">
                      {["Polygon", "Arbitrum", "Ethereum", "TRC-20"].map((net) => (
                        <button
                          key={net}
                          type="button"
                          className={`pg-bank-card ${cryptoNetwork === net ? "is-selected" : ""}`}
                          onClick={() => setCryptoNetwork(net)}
                        >
                          ⚡ {net}
                        </button>
                      ))}
                    </div>
                    <div className="pg-crypto-addr">
                      <p className="pg-crypto-label">Deposit Address (USDT):</p>
                      <code className="pg-crypto-code">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary & Checkout Button */}
            <div className="pg-footer">
              <div className="pg-summary-strip">
                <div>
                  <span className="pg-summary-label">Total Payable:</span>
                  <strong className="pg-summary-amount">₹{amount.toLocaleString("en-IN")}.00</strong>
                </div>
                <div className="pg-zero-fee-tag">Zero Gateway Fee</div>
              </div>

              <button
                type="button"
                className="pg-pay-btn"
                onClick={handlePayNow}
                disabled={amount <= 0}
              >
                <span>🔒 Pay ₹{amount.toLocaleString("en-IN")} Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
