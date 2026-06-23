import React from "react";
import { formatReceiptDateHeader, formatReceiptPaymentDate } from "@/lib/receiptDates";

/**
 * Receipt component – pixel-accurate replica of the Uber metro ticket receipt
 * screenshot. Only the date changes between receipts.
 *
 * Designed for off-screen capture at fixed dimensions (1080 x 1920) so
 * html2canvas yields consistent, crisp PNG output.
 */
const Receipt = React.forwardRef(({ date, scale = 1 }, ref) => {
  const headerDate = formatReceiptDateHeader(date);
  const paymentDate = formatReceiptPaymentDate(date);

  // Base canvas: 1080 x 1920 (3x of common phone resolution). All internal
  // dimensions are in raw pixels; `scale` lets us shrink for live preview.
  const WIDTH = 1080;
  const HEIGHT = 1920;

  return (
    <div
      ref={ref}
      data-testid="receipt-canvas"
      style={{
        width: `${WIDTH * scale}px`,
        height: `${HEIGHT * scale}px`,
        position: "relative",
        overflow: "hidden",
        background: "#000",
        fontFamily:
          '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif',
        color: "#fff",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      <div
        style={{
          width: `${WIDTH}px`,
          height: `${HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          background: "#000",
        }}
      >
        {/* Status bar */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 0,
            right: 0,
            height: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 70px",
          }}
        >
          {/* Left: time + nav arrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span
              style={{
                fontSize: 46,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: -0.5,
              }}
            >
              2:05
            </span>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 11l18-8-8 18-2-8-8-2z"
                fill="#fff"
              />
            </svg>
          </div>

          {/* Right: signal, wifi, battery */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Signal bars */}
            <svg width="42" height="28" viewBox="0 0 22 14" fill="none">
              <rect x="0" y="10" width="3" height="4" rx="0.5" fill="#fff" />
              <rect x="5" y="7" width="3" height="7" rx="0.5" fill="#fff" />
              <rect x="10" y="4" width="3" height="10" rx="0.5" fill="#fff" />
              <rect x="15" y="0" width="3" height="14" rx="0.5" fill="#fff" />
            </svg>
            {/* WiFi */}
            <svg width="38" height="28" viewBox="0 0 20 16" fill="none">
              <path
                d="M10 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                fill="#fff"
              />
              <path
                d="M5.5 9.5a6.5 6.5 0 019 0"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M2 6.5a11 11 0 0116 0"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            {/* Battery (green = charging) */}
            <div
              style={{
                width: 70,
                height: 32,
                borderRadius: 8,
                border: "2px solid rgba(255,255,255,0.55)",
                position: "relative",
                display: "flex",
                alignItems: "center",
                padding: 2,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 5,
                  background: "#2bd96a",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: -6,
                  top: 9,
                  width: 4,
                  height: 14,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.55)",
                }}
              />
              {/* charging bolt */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                style={{ position: "absolute", left: 24, top: 5 }}
              >
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="#fff" />
              </svg>
            </div>
          </div>
        </div>

        {/* Top bar: X close + help */}
        <div
          style={{
            position: "absolute",
            top: 140,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 70px",
          }}
        >
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "#d8d8d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              fontWeight: 700,
              fontSize: 32,
              fontFamily:
                '"Helvetica Neue", Helvetica, Arial, sans-serif',
            }}
          >
            ?
          </div>
        </div>

        {/* Header card */}
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 70,
            right: 70,
            background: "#1f1f1f",
            borderRadius: 22,
            padding: "70px 70px 80px 70px",
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -2,
              marginBottom: 70,
            }}
          >
            Uber
          </div>
          <div
            style={{
              fontSize: 38,
              color: "#fff",
              marginBottom: 38,
              fontWeight: 400,
            }}
          >
            {headerDate}
          </div>
          <div
            style={{
              fontSize: 112,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -3,
              marginBottom: 50,
            }}
          >
            Thanks for booking, Divya
          </div>
          <div
            style={{
              fontSize: 50,
              fontWeight: 400,
              lineHeight: 1.25,
              color: "#fff",
            }}
          >
            Here is the receipt for your metro ticket.
          </div>
        </div>

        {/* Total row */}
        <div
          style={{
            position: "absolute",
            top: 1290,
            left: 70,
            right: 70,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1 }}>
            Total
          </span>
          <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1 }}>
            ₹50.00
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 1410,
            left: 70,
            right: 70,
            height: 1,
            background: "#3a3a3a",
          }}
        />

        {/* Ticket fare row */}
        <div
          style={{
            position: "absolute",
            top: 1470,
            left: 70,
            right: 70,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span style={{ fontSize: 42, fontWeight: 500 }}>Ticket fare</span>
          <span style={{ fontSize: 42, fontWeight: 500 }}>₹50.00</span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 1555,
            left: 70,
            right: 70,
            height: 1,
            background: "#3a3a3a",
          }}
        />

        {/* Payments */}
        <div
          style={{
            position: "absolute",
            top: 1615,
            left: 70,
            right: 70,
          }}
        >
          <div style={{ fontSize: 46, fontWeight: 700, marginBottom: 30 }}>
            Payments
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {/* UPI badge */}
              <div
                style={{
                  width: 86,
                  height: 56,
                  borderRadius: 8,
                  background: "#0f0f0f",
                  border: "1px solid #2c2c2c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily:
                    '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontWeight: 900,
                  fontSize: 26,
                  color: "#f3a82a",
                  fontStyle: "italic",
                  letterSpacing: 0.5,
                }}
              >
                UPI<span style={{ marginLeft: 2 }}>›</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 42, fontWeight: 600, color: "#fff" }}>
                  UPI
                </span>
                <span style={{ fontSize: 30, color: "#a3a3a3", fontWeight: 400 }}>
                  {paymentDate}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 42, fontWeight: 600 }}>₹50.00</span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 1810,
            left: 70,
            right: 70,
            height: 1,
            background: "#3a3a3a",
          }}
        />

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            top: 1840,
            left: 70,
            right: 70,
            fontSize: 32,
            color: "#9a9a9a",
            fontWeight: 400,
          }}
        >
          This is not a tax invoice.
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";
export default Receipt;
