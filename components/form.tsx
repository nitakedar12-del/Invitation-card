"use client";

import { useState, useRef } from "react";
import { Alex_Brush } from "next/font/google";

const alexBrush = Alex_Brush({ subsets: ["latin"], weight: "400" });

const FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSeTmirIleu0lvdrhM4hEqhc9qUKmNPHhrT2LQYIbMLbUNZyvw/formResponse";

const ENTRY = {
  name:       "entry.932240829",
  phone:      "entry.1452326212",
  guests:     "entry.2119693615",
  guestnames: "entry.681164396",
  travel:     "entry.2119551155",
  aadhaar:    "entry.453933191",
};

export default function RSVPForm() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [form, setForm] = useState({
    name: "", phone: "", guests: "", guestnames: "", travel: "", aadhaar: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus("idle");

    if (!form.name.trim() || !form.phone.trim()) {
      setStatus("error");
      return;
    }

    const formEl = document.createElement("form");
    formEl.method = "POST";
    formEl.action = FORM_ACTION;
    formEl.target = "hidden_iframe";

    const fields: Record<string, string> = {
      [ENTRY.name]:       form.name,
      [ENTRY.phone]:      form.phone,
      [ENTRY.guests]:     form.guests,
      [ENTRY.guestnames]: form.guestnames,
      [ENTRY.travel]:     form.travel,
      [ENTRY.aadhaar]:    form.aadhaar,
    };

    Object.entries(fields).forEach(([key, val]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = val;
      formEl.appendChild(input);
    });

    document.body.appendChild(formEl);
    formEl.submit();
    document.body.removeChild(formEl);

    setStatus("success");
    setForm({ name: "", phone: "", guests: "", guestnames: "", travel: "", aadhaar: "" });
    setTimeout(() => setStatus("idle"), 5000);
  };

  const alexFont  = `${alexBrush.style.fontFamily}, 'Alex Brush', cursive`;
  const aliceFont = "'Alice', serif";

  // ─────────────────────────────────────────────
  // SVG is 810 × 1440.
  // Arch top border:  y=81   →  5.6%
  // White area top:   y=561  → 38.96%
  // White area bot:   y=1108 → 76.94%   ← peacock starts here
  // Bottom border:    y=1122 → 77.92%
  //
  // RSVP heading lives in the arch:  ~31.5%
  // Usable form band: 40.46% → 75.44%  (34.98% tall)
  // 8 slots (6 fields + note + button): each 4.37%
  //
  // Computed slot tops:
  //   Field 1 (Name)            40.46%
  //   Field 2 (Phone)           44.83%
  //   Field 3 (Guests count)    49.20%
  //   Field 4 (Guest names)     53.58%
  //   Field 5 (Travel)          57.95%
  //   Field 6 (Aadhaar)         62.32%
  //   Note                      66.69%
  //   Button                    71.07%
  //   Safe bottom               75.44%  (peacock free from 76.94%)
  // ─────────────────────────────────────────────

  // Input height that fits 4.37% slot — compact but readable
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 14px",
    border: "1.2px solid #b8881f",
    borderRadius: "5px",
    background: "rgba(255,252,238,0.93)",
    fontFamily: aliceFont,
    fontSize: "clamp(11px, 1.6vw, 14px)",
    color: "#2a1000",
    outline: "none",
    boxSizing: "border-box" as const,
    height: "32px",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    cursor: "pointer",
    paddingRight: "28px",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "none" as const,
    paddingTop: "7px",
  };

  // Single helper — all rows are direct absolute children of the container
  const abs = (top: string, width = "70%"): React.CSSProperties => ({
    position: "absolute",
    top,
    left: "50%",
    transform: "translateX(-50%)",
    width,
  });

  return (
    <>
      <iframe ref={iframeRef} name="hidden_iframe" style={{ display: "none" }} />

      {/* ── One positioning root, everything absolute inside ── */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        maxWidth: "560px",
        margin: "0 auto",
        overflow: "hidden",
      }}>

        {/* Background SVG — fills full 100vh */}
        <img
          src="Form.svg"
          alt="RSVP form background"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
          }}
        />

        {/* ── RSVP heading — inside arch, above white area ── */}
        <div style={{ ...abs("24.5%"), textAlign: "center" }}>
          <h1 style={{
            fontFamily: alexFont,
            fontSize: "clamp(32px, 6vw, 50px)",
            color: "#3d1c00",
            margin: 0,
            lineHeight: 1,
            letterSpacing: "4px",
            textShadow: "0 1px 3px rgba(180,100,20,0.15)",
          }}>
            RSVP
          </h1>
        </div>

        {/* ── Field 1: Name — 40.46% ── */}
        <div style={abs("30.46%")}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            style={inputStyle}
          />
        </div>

        {/* ── Field 2: Contact Number — 44.83% ── */}
        <div style={abs("34.83%")}>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Contact Number"
            type="tel"
            style={inputStyle}
          />
        </div>

        {/* ── Field 3: Number of Guests — 49.20% ── */}
        <div style={abs("39.20%")}>
          <input
            name="guests"
            value={form.guests}
            onChange={handleChange}
            placeholder="Number of Guests"
            type="number"
            min="1"
            style={inputStyle}
          />
        </div>

        {/* ── Field 4: Names of Guests — 53.58% ── */}
        <div style={abs("43.58%")}>
          <textarea
            name="guestnames"
            value={form.guestnames}
            onChange={handleChange}
            placeholder="Names of Guests"
            style={textareaStyle}
          />
        </div>

        {/* ── Field 5: Travel Confirmation — 57.95% ── */}
        <div style={abs("47.95%")}>
          <div style={{ position: "relative", width: "100%" }}>
            <select
              name="travel"
              value={form.travel}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="" disabled>Travel Confirmation (Yes/No)</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <div style={{
              position: "absolute",
              right: "11px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "5px solid #8B5E2A",
            }} />
          </div>
        </div>

        {/* ── Field 6: Aadhaar — 62.32% ── */}
        <div style={abs("52.32%")}>
          <input
            name="aadhaar"
            value={form.aadhaar}
            onChange={handleChange}
            placeholder="Aadhaar Card Details"
            style={inputStyle}
          />
        </div>

        {/* ── Privacy note — 66.69% ── */}
        <div style={{ ...abs("57.69%"), textAlign: "center" }}>
          <p style={{
            margin: 0,
            fontSize: "clamp(7.5px, 1vw, 10.5px)",
            color: "#7a4a10",
            fontStyle: "italic",
            lineHeight: 1.35,
            fontFamily: aliceFont,
          }}>
            🔒 Your Aadhaar details are confidential and used solely for event entry verification.
            They will not be shared or stored beyond this purpose.
          </p>
        </div>

        {/* ── Submit button — 71.07% ── */}
        <div style={{ ...abs("61.07%"), display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleSubmit}
            style={{
              background: "linear-gradient(135deg, #7a4500 0%, #5c2e00 100%)",
              color: "#f5dca0",
              border: "1.5px solid #c9922a",
              borderRadius: "7px",
              fontFamily: aliceFont,
              fontSize: "clamp(13px, 1.8vw, 16px)",
              fontWeight: 400,
              letterSpacing: "2px",
              padding: "7px 46px",
              cursor: "pointer",
              boxShadow: "0 3px 12px rgba(120,70,0,0.35), inset 0 1px 0 rgba(255,220,120,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            Submit
          </button>
        </div>

        {/* ── Success / Error — 73.5% (stays above peacock at 76.94%) ── */}
        {status === "success" && (
          <div style={{
            ...abs("63.5%"),
            background: "rgba(60,120,40,0.13)",
            border: "1px solid #6a9a40",
            borderRadius: "8px",
            color: "#2d5e10",
            fontSize: "clamp(10px, 1.2vw, 12px)",
            padding: "6px 10px",
            textAlign: "center",
            fontFamily: aliceFont,
          }}>
            ✓ Thank you! Your RSVP has been submitted successfully.
          </div>
        )}

        {status === "error" && (
          <div style={{
            ...abs("63.5%"),
            background: "rgba(180,40,20,0.1)",
            border: "1px solid #c05030",
            borderRadius: "8px",
            color: "#8B2010",
            fontSize: "clamp(10px, 1.2vw, 12px)",
            padding: "6px 10px",
            textAlign: "center",
            fontFamily: aliceFont,
          }}>
            Please fill in your Name and Contact Number.
          </div>
        )}

      </div>
    </>
  );
}