"use client";
// @ts-nocheck
import { useState, useEffect, useRef } from "react";

const LOGO_URL = "https://raw.githubusercontent.com/cryptochitty/smartsettle/main/frontend/1773996920045.png";

const BILLS = [
  { id: 1, name: "BESCOM Electricity", amount: 5300,  saved: 700,  due: "Mar 28", category: "Utility",  icon: "⚡", status: "pending"    },
  { id: 2, name: "Airtel Broadband",   amount: 1499,  saved: 180,  due: "Apr 2",  category: "Internet", icon: "📡", status: "negotiated" },
  { id: 3, name: "AWS Cloud",          amount: 12400, saved: 1860, due: "Apr 1",  category: "SaaS",     icon: "☁️", status: "paid"       },
  { id: 4, name: "Jio Mobile",         amount: 899,   saved: 90,   due: "Apr 5",  category: "Mobile",   icon: "📱", status: "paid"       },
];

const RECEIPTS = [
  { hash: "0x9f2a...3c81", bill: "BESCOM Electricity", original: 5300,  paid: 4600,  saved: 700,  block: "18,442,391", date: "Mar 17" },
  { hash: "0x7a1b...92df", bill: "Airtel Broadband",   original: 1499,  paid: 1319,  saved: 180,  block: "18,389,204", date: "Mar 14" },
  { hash: "0x3e8c...11aa", bill: "AWS Cloud",          original: 12400, paid: 10540, saved: 1860, block: "18,301,882", date: "Mar 10" },
];

const STEPS = [
  { id: 1, label: "Parsing invoice",           detail: "Extracted ₹5,300 · BESCOM · Due Mar 28",    delay: 0    },
  { id: 2, label: "Connecting to provider API", detail: "BESCOM billing gateway — connected ✓",      delay: 900  },
  { id: 3, label: "Requesting discount offers", detail: "3 offers received from provider",           delay: 1900 },
  { id: 4, label: "AI selects best offer",      detail: "Loyalty 8% + fee waiver → ₹4,600",         delay: 3100 },
  { id: 5, label: "Signing cUSD transaction",   detail: "Wallet approved · broadcasting to Celo…",  delay: 4200 },
  { id: 6, label: "Receipt stored on-chain ✓",  detail: "Block #18,442,391 · Saved ₹700 (13.2%)",   delay: 5300 },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function Counter({ target, prefix = "", suffix = "", delay = 0 }) {
  const [val, setVal] = useState(0);
  const n = parseInt(String(target).replace(/[^0-9]/g, "")) || 0;
  useEffect(() => {
    const t = setTimeout(() => {
      let cur = 0;
      const step = Math.ceil(n / 36);
      const iv = setInterval(() => {
        cur = Math.min(cur + step, n);
        setVal(cur);
        if (cur >= n) clearInterval(iv);
      }, 25);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [n, delay]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

function NegotiationModal({ bill, onClose, isMobile }) {
  const [steps, setSteps] = useState([]);
  const [done, setDone]   = useState(false);
  useEffect(() => {
    STEPS.forEach(s => setTimeout(() => {
      setSteps(p => [...p, s]);
      if (s.id === STEPS.length) setDone(true);
    }, s.delay));
  }, []);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:"fixed", inset:0, zIndex:100,
      background:"rgba(2,6,18,0.88)", backdropFilter:"blur(12px)",
      display:"flex",
      alignItems: isMobile ? "flex-end" : "center",
      justifyContent:"center",
      padding: isMobile ? 0 : 20,
    }}>
      <div style={{
        width:"100%", maxWidth:500, maxHeight:"88vh", overflowY:"auto",
        background:"#060e1f", border:"1px solid #1e3354",
        borderRadius: isMobile ? "24px 24px 0 0" : 24,
        animation: isMobile ? "slideUp .35s ease" : "popIn .3s cubic-bezier(.34,1.56,.64,1)",
      }}>
        {isMobile && <div style={{ width:40,height:4,borderRadius:2,background:"#1e3354",margin:"12px auto 0" }} />}
        <div style={{ padding:"20px 24px 16px",borderBottom:"1px solid #0f1e35",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5 }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"#00ff87",display:"inline-block",animation:"blink 1.2s infinite" }} />
              <span style={{ fontSize:10,color:"#00ff87",letterSpacing:"0.16em",fontFamily:"monospace" }}>AI AGENT · LIVE</span>
            </div>
            <h3 style={{ fontSize:17,fontWeight:800,color:"#e8f2ff" }}>Negotiating {bill.name}</h3>
          </div>
          <button onClick={onClose} style={{ background:"#0d1b2e",border:"1px solid #1e3354",color:"#3a5878",width:30,height:30,borderRadius:8,cursor:"pointer",fontSize:14,flexShrink:0 }}>✕</button>
        </div>
        <div style={{ padding:24 }}>
          {steps.length === 0 && (
            <div style={{ textAlign:"center",padding:"32px 0" }}>
              <div style={{ width:32,height:32,border:"2.5px solid #00ff87",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px" }} />
              <p style={{ color:"#2a4060",fontSize:13 }}>Connecting to AI agent…</p>
            </div>
          )}
          {steps.map((s, i) => (
            <div key={s.id} style={{ display:"flex",gap:14,paddingBottom:18,animation:"slideUp .35s ease" }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
                <div style={{ width:26,height:26,borderRadius:"50%",flexShrink:0,border:`1.5px solid ${i===steps.length-1&&!done?"#38bdf8":"#00ff87"}`,background:i===steps.length-1&&!done?"#38bdf810":"#00ff8712",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i===steps.length-1&&!done?"#38bdf8":"#00ff87" }}>
                  {i===steps.length-1&&!done?<span style={{animation:"blink .9s infinite"}}>●</span>:"✓"}
                </div>
                {i<steps.length-1&&<div style={{ width:1,flex:1,background:"#0f1e35",minHeight:10 }} />}
              </div>
              <div style={{ paddingTop:2 }}>
                <p style={{ fontSize:13,fontWeight:600,color:"#c8deff" }}>{s.label}</p>
                <p style={{ fontSize:11,color:"#2a4060",fontFamily:"monospace",marginTop:2 }}>{s.detail}</p>
              </div>
            </div>
          ))}
          {done && (
            <div style={{ background:"linear-gradient(135deg,#00ff870a,#38bdf808)",border:"1px solid #00ff8730",borderRadius:16,padding:20,marginTop:4,animation:"slideUp .4s ease" }}>
              <p style={{ fontSize:10,color:"#00ff87",letterSpacing:"0.14em",marginBottom:12,fontFamily:"monospace" }}>✓ BEST OFFER SECURED</p>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16 }}>
                <div>
                  <p style={{ fontSize:38,fontWeight:900,color:"#00ff87",lineHeight:1 }}>₹4,600</p>
                  <p style={{ fontSize:12,color:"#2a4060",textDecoration:"line-through",marginTop:4 }}>₹5,300 original</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontSize:22,fontWeight:800,color:"#e8f2ff" }}>↓ ₹700</p>
                  <p style={{ fontSize:11,color:"#2a4060" }}>saved (13.2%)</p>
                </div>
              </div>
              <button style={{ width:"100%",padding:"13px 0",borderRadius:12,background:"linear-gradient(135deg,#00ff87,#38bdf8)",border:"none",color:"#020c1c",fontWeight:900,fontSize:13,cursor:"pointer",letterSpacing:"0.06em" }}>⚡ APPROVE & PAY IN cUSD</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab]             = useState("dashboard");
  const [connected, setConn]      = useState(false);
  const [settling, setSettling]   = useState(null);
  const [drag, setDrag]           = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const fileRef = useRef(null);
  const isMobile = useIsMobile();

  const statusStyle = {
    pending:    ["#f59e0b", "PENDING"],
    negotiated: ["#38bdf8", "NEGOTIATED"],
    paid:       ["#00ff87", "PAID ✓"],
  };

  const NAV_ITEMS = [
    { id:"dashboard", label:"Dashboard" },
    { id:"bills",     label:"Bills"     },
    { id:"receipts",  label:"Receipts"  },
    { id:"wallet",    label:"Wallet"    },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#030912", color:"#d8eeff", fontFamily:"'Syne',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=JetBrains+Mono:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#030912}::-webkit-scrollbar-thumb{background:#1a2d4a;border-radius:2px}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes glow{0%,100%{box-shadow:0 0 18px #00ff8730}50%{box-shadow:0 0 36px #00ff8760}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

        /* ── Responsive grid ── */
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .dash-grid  { display:grid; grid-template-columns:1.35fr 1fr; gap:20px; }
        .main-pad   { padding:36px 32px; }

        @media(max-width:1024px){
          .stats-grid{ grid-template-columns:repeat(2,1fr); }
          .dash-grid { grid-template-columns:1fr; }
        }
        @media(max-width:767px){
          .stats-grid{ grid-template-columns:repeat(2,1fr); gap:10px; }
          .dash-grid { grid-template-columns:1fr; }
          .main-pad  { padding:20px 16px 100px; }
          .hide-mobile{ display:none !important; }
          .show-mobile{ display:flex !important; }
        }
        @media(min-width:768px){
          .hide-desktop{ display:none !important; }
          .show-desktop{ display:flex !important; }
        }
      `}</style>

      {/* Backgrounds */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(#1e3a5a10 1px,transparent 1px),linear-gradient(90deg,#1e3a5a10 1px,transparent 1px)",backgroundSize:"52px 52px" }} />
      <div style={{ position:"fixed",top:"-20%",left:"30%",width:600,height:600,background:"radial-gradient(circle,#00ff8710 0%,transparent 70%)",pointerEvents:"none" }} />
      <div style={{ position:"fixed",bottom:"-10%",right:"10%",width:400,height:400,background:"radial-gradient(circle,#38bdf810 0%,transparent 70%)",pointerEvents:"none" }} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{ position:"sticky",top:0,zIndex:50,background:"rgba(3,9,18,0.9)",backdropFilter:"blur(20px)",borderBottom:"1px solid #0f1e35",height:62,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>

        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:38,height:38,borderRadius:12,overflow:"hidden",flexShrink:0,background:"#0d1929",border:"1px solid #1e3354",display:"flex",alignItems:"center",justifyContent:"center" }}>
            {!logoError
              ? <img src={LOGO_URL} alt="SmartSettle" onError={()=>setLogoError(true)} style={{ width:38,height:38,objectFit:"contain",borderRadius:12 }} />
              : <span style={{fontSize:20}}>⚖️</span>
            }
          </div>
          <div>
            <div style={{ display:"flex",alignItems:"center" }}>
              <span style={{ fontSize:16,fontWeight:900,color:"#fff",letterSpacing:"-0.02em" }}>Smart</span>
              <span style={{ fontSize:16,fontWeight:900,background:"linear-gradient(90deg,#f5a623,#00c8f0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em" }}>Settle</span>
            </div>
            <div style={{ fontSize:9,color:"#1e3a5a",letterSpacing:"0.16em",fontFamily:"monospace" }}>AI BILL NEGOTIATION</div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hide-mobile" style={{ display:"flex",gap:2 }}>
          {NAV_ITEMS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:tab===t.id?"#00ff8710":"transparent",border:`1px solid ${tab===t.id?"#00ff8732":"transparent"}`,borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:700,color:tab===t.id?"#00ff87":"#2a4878",cursor:"pointer",letterSpacing:"0.1em",transition:"all .15s" }}>
              {t.label.toUpperCase()}
            </button>
          ))}
        </nav>

        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {/* Connect button */}
          <button onClick={()=>setConn(!connected)} style={{ background:connected?"#00ff8712":"linear-gradient(135deg,#00ff87,#38bdf8)",border:connected?"1px solid #00ff8730":"none",borderRadius:10,padding:"7px 14px",fontSize:11,fontWeight:800,color:connected?"#00ff87":"#020c1c",cursor:"pointer",letterSpacing:"0.06em",animation:connected?"none":"glow 2.5s infinite",transition:"all .2s",whiteSpace:"nowrap" }}>
            {connected ? (isMobile ? "● Connected" : "● 0xCBbd...716F") : "CONNECT"}
          </button>

          {/* Mobile hamburger */}
          <button className="show-mobile" onClick={()=>setMenuOpen(!menuOpen)} style={{ display:"none",background:"#0d1929",border:"1px solid #1e3354",borderRadius:8,width:36,height:36,alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,color:"#d8eeff",fontSize:18 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{ position:"fixed",top:62,left:0,right:0,zIndex:49,background:"rgba(3,9,18,0.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid #0f1e35",padding:"12px 16px" }}>
          {NAV_ITEMS.map(t => (
            <button key={t.id} onClick={()=>{ setTab(t.id); setMenuOpen(false); }} style={{ display:"block",width:"100%",textAlign:"left",background:tab===t.id?"#00ff8710":"transparent",border:`1px solid ${tab===t.id?"#00ff8730":"transparent"}`,borderRadius:10,padding:"12px 16px",fontSize:13,fontWeight:700,color:tab===t.id?"#00ff87":"#d8eeff",cursor:"pointer",marginBottom:6,letterSpacing:"0.08em" }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <main className="main-pad" style={{ maxWidth:1100,margin:"0 auto",position:"relative",zIndex:1 }}>

        {/* ── LANDING ──────────────────────────────────────────────────────── */}
        {!connected && (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"72vh",textAlign:"center",gap:24,animation:"slideUp .5s ease",padding:"0 16px" }}>
            <div style={{ animation:"float 3s ease-in-out infinite" }}>
              {!logoError
                ? <img src={LOGO_URL} alt="SmartSettle" onError={()=>setLogoError(true)} style={{ width:isMobile?100:140,height:isMobile?100:140,objectFit:"contain",borderRadius:28,filter:"drop-shadow(0 0 30px #00ff8740)" }} />
                : <div style={{ fontSize:isMobile?64:88 }}>⚖️</div>
              }
            </div>
            <div>
              <h1 style={{ fontSize:isMobile?36:54,fontWeight:900,lineHeight:1.06,letterSpacing:"-0.03em",marginBottom:16 }}>
                Pay bills at the<br />
                <span style={{ background:"linear-gradient(90deg,#00ff87,#38bdf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>lowest price.</span>
              </h1>
              <p style={{ fontSize:isMobile?14:16,color:"#2a4060",maxWidth:420,margin:"0 auto",lineHeight:1.7 }}>
                AI agent negotiates discounts and pays in <strong style={{color:"#38bdf8"}}>cUSD</strong> on Celo Sepolia — fully autonomous.
              </p>
            </div>
            <button onClick={()=>setConn(true)} style={{ background:"linear-gradient(135deg,#00ff87,#38bdf8)",border:"none",borderRadius:14,padding:isMobile?"14px 36px":"16px 44px",fontSize:isMobile?13:14,fontWeight:900,color:"#020c1c",cursor:"pointer",letterSpacing:"0.06em",animation:"glow 2.5s infinite",width:isMobile?"100%":"auto" }}>
              CONNECT WALLET →
            </button>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center" }}>
              {["Valora","MetaMask","WalletConnect","Coinbase Wallet"].map(w => (
                <span key={w} style={{ fontSize:11,color:"#1e3a5a",background:"#060e1f",border:"1px solid #0f1e35",borderRadius:8,padding:"5px 12px" }}>{w}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── DASHBOARD ────────────────────────────────────────────────────── */}
        {connected && tab === "dashboard" && (
          <div style={{ animation:"slideUp .4s ease" }}>
            <div style={{ marginBottom:24 }}>
              <p style={{ fontSize:10,color:"#1e3a5a",letterSpacing:"0.18em",marginBottom:6,fontFamily:"monospace" }}>MARCH 2026 · OVERVIEW</p>
              <h2 style={{ fontSize:isMobile?24:34,fontWeight:900,letterSpacing:"-0.025em" }}>
                Your agent is{" "}
                <span style={{ background:"linear-gradient(90deg,#00ff87,#38bdf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>saving money.</span>
              </h2>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom:20 }}>
              {[
                { v:"8240", pre:"₹", suf:"",  label:"Total Saved",       sub:"this month",   color:"#00ff87" },
                { v:"14",   pre:"",  suf:"",   label:"Bills Settled",     sub:"autonomously", color:"#38bdf8" },
                { v:"11",   pre:"",  suf:"%",  label:"Avg. Discount",     sub:"per bill",     color:"#f59e0b" },
                { v:"14",   pre:"",  suf:"",   label:"On-chain Receipts", sub:"immutable",    color:"#a78bfa" },
              ].map((s, i) => (
                <div key={i} style={{ background:"linear-gradient(135deg,#060e1f,#04091a)",border:`1px solid ${s.color}22`,borderRadius:20,padding:isMobile?"16px":"22px 20px",position:"relative",overflow:"hidden",animation:"slideUp .4s ease",animationDelay:`${i*70}ms` }}>
                  <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${s.color},transparent)` }} />
                  <p style={{ fontSize:9,color:"#1e3a5a",letterSpacing:"0.14em",marginBottom:8,fontFamily:"monospace" }}>{s.label.toUpperCase()}</p>
                  <p style={{ fontSize:isMobile?24:30,fontWeight:900,color:s.color }}>
                    <Counter target={s.v} prefix={s.pre} suffix={s.suf} delay={i*100} />
                  </p>
                  <p style={{ fontSize:10,color:"#1a3050",marginTop:3 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Main content grid */}
            <div className="dash-grid">
              {/* Bills panel */}
              <div style={{ background:"linear-gradient(135deg,#060e1f,#04091a)",border:"1px solid #0f1e35",borderRadius:20,padding:isMobile?16:24 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                  <p style={{ fontSize:10,color:"#1e3a5a",letterSpacing:"0.14em",fontFamily:"monospace" }}>PENDING BILLS</p>
                  <span style={{ fontSize:10,color:"#00ff87",background:"#00ff8712",border:"1px solid #00ff8728",padding:"3px 10px",borderRadius:20 }}>4 bills</span>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {BILLS.map((b, i) => {
                    const [sc, sl] = statusStyle[b.status];
                    return (
                      <div key={b.id}
                        style={{ display:"flex",alignItems:"center",gap:10,background:"#04091a",border:"1px solid #0f1e35",borderRadius:14,padding:"11px 14px",transition:"all .18s",cursor:b.status==="pending"?"pointer":"default",animation:"slideUp .35s ease",animationDelay:`${i*55}ms` }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ff8725";e.currentTarget.style.transform="translateX(3px)"}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="#0f1e35";e.currentTarget.style.transform="translateX(0)"}}
                      >
                        <div style={{ width:36,height:36,borderRadius:10,background:"#060e1f",border:"1px solid #0f1e35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>{b.icon}</div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <p style={{ fontSize:13,fontWeight:700,color:"#d8eeff",marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{b.name}</p>
                          <p style={{ fontSize:10,color:"#1e3a5a" }}>{b.category} · Due {b.due}</p>
                        </div>
                        {!isMobile && (
                          <div style={{ textAlign:"right",marginRight:6,flexShrink:0 }}>
                            <p style={{ fontSize:13,fontWeight:800,color:"#d8eeff" }}>₹{b.amount.toLocaleString()}</p>
                            {b.saved>0 && <p style={{ fontSize:10,color:"#00ff87" }}>↓ ₹{b.saved}</p>}
                          </div>
                        )}
                        <span style={{ fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20,background:`${sc}15`,color:sc,border:`1px solid ${sc}35`,letterSpacing:"0.06em",whiteSpace:"nowrap",flexShrink:0 }}>{isMobile ? sl.split(" ")[0] : sl}</span>
                        {b.status === "pending" && (
                          <button onClick={()=>setSettling(b)} style={{ background:"linear-gradient(135deg,#00ff87,#38bdf8)",border:"none",borderRadius:8,padding:"7px 10px",fontSize:10,fontWeight:800,color:"#020c1c",cursor:"pointer",flexShrink:0 }}>
                            {isMobile ? "GO" : "SETTLE →"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chain activity */}
              <div style={{ background:"linear-gradient(135deg,#060e1f,#04091a)",border:"1px solid #0f1e35",borderRadius:20,padding:isMobile?16:24 }}>
                <p style={{ fontSize:10,color:"#1e3a5a",letterSpacing:"0.14em",marginBottom:16,fontFamily:"monospace" }}>CHAIN ACTIVITY</p>
                {RECEIPTS.map((r, i) => (
                  <div key={i} style={{ paddingBottom:12,marginBottom:12,borderBottom:i<2?"1px solid #080f1d":"none" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                      <span style={{ fontSize:11,color:"#38bdf8",fontFamily:"monospace" }}>{r.hash}</span>
                      <span style={{ fontSize:12,fontWeight:700,color:"#d8eeff" }}>₹{r.paid.toLocaleString()}</span>
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between" }}>
                      <span style={{ fontSize:11,color:"#1e3a5a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"60%" }}>{r.bill}</span>
                      <span style={{ fontSize:11,color:"#00ff87" }}>↓ ₹{r.saved}</span>
                    </div>
                    <p style={{ fontSize:9,color:"#0d1a2e",marginTop:2,fontFamily:"monospace" }}>#{r.block} · {r.date}</p>
                  </div>
                ))}
                <div style={{ padding:"8px 12px",background:"#04091a",border:"1px solid #0f1e35",borderRadius:10,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ width:6,height:6,borderRadius:"50%",background:"#00ff87",display:"inline-block",animation:"blink 2s infinite",flexShrink:0 }} />
                  <span style={{ fontSize:10,color:"#d8eeff",fontFamily:"monospace" }}>Celo Sepolia · 11142220</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BILLS ────────────────────────────────────────────────────────── */}
        {connected && tab === "bills" && (
          <div style={{ animation:"slideUp .4s ease" }}>
            <div style={{ marginBottom:24 }}>
              <p style={{ fontSize:10,color:"#1e3a5a",letterSpacing:"0.18em",marginBottom:6,fontFamily:"monospace" }}>INVOICE UPLOAD</p>
              <h2 style={{ fontSize:isMobile?24:32,fontWeight:900,letterSpacing:"-0.025em" }}>Upload & Negotiate</h2>
            </div>
            <div
              onDragOver={e=>{e.preventDefault();setDrag(true)}}
              onDragLeave={()=>setDrag(false)}
              onDrop={e=>{e.preventDefault();setDrag(false);setSettling(BILLS[0]);setTab("dashboard")}}
              onClick={()=>{ if(fileRef.current) fileRef.current.click(); }}
              style={{ border:`2px dashed ${drag?"#00ff87":"#0f1e35"}`,borderRadius:22,padding:isMobile?"32px 20px":"56px 40px",textAlign:"center",cursor:"pointer",marginBottom:20,transition:"all .22s",background:drag?"#00ff8706":"linear-gradient(135deg,#060e1f,#04091a)" }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg" style={{display:"none"}} onChange={()=>{setSettling(BILLS[0]);setTab("dashboard")}} />
              <div style={{ fontSize:isMobile?40:52,marginBottom:12 }}>📄</div>
              <p style={{ fontSize:isMobile?16:20,fontWeight:800,color:"#d8eeff",marginBottom:8 }}>{drag?"Drop to analyze →":"Drop your invoice here"}</p>
              <p style={{ fontSize:13,color:"#1e3a5a",marginBottom:20 }}>PDF, PNG, JPG — Claude AI extracts everything</p>
              <span style={{ display:"inline-block",padding:"10px 26px",background:"#04091a",border:"1px solid #0f1e35",borderRadius:12,fontSize:12,color:"#38bdf8" }}>Browse files →</span>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {BILLS.map((b, i) => {
                const [sc, sl] = statusStyle[b.status];
                return (
                  <div key={b.id}
                    style={{ display:"flex",alignItems:"center",gap:12,background:"linear-gradient(135deg,#060e1f,#04091a)",border:"1px solid #0f1e35",borderRadius:16,padding:"13px 16px",transition:"all .18s",animation:"slideUp .35s ease",animationDelay:`${i*55}ms` }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#00ff8722"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#0f1e35"}
                  >
                    <div style={{ width:40,height:40,borderRadius:12,background:"#04091a",border:"1px solid #0f1e35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{b.icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ fontSize:13,fontWeight:700,color:"#d8eeff",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{b.name}</p>
                      <p style={{ fontSize:10,color:"#1e3a5a" }}>{b.category} · Due {b.due}</p>
                    </div>
                    <div style={{ textAlign:"right",marginRight:8,flexShrink:0 }}>
                      <p style={{ fontSize:14,fontWeight:800,color:"#d8eeff" }}>₹{b.amount.toLocaleString()}</p>
                      {b.saved>0 && <p style={{ fontSize:10,color:"#00ff87" }}>↓ ₹{b.saved}</p>}
                    </div>
                    <span style={{ fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20,background:`${sc}15`,color:sc,border:`1px solid ${sc}35`,letterSpacing:"0.06em",flexShrink:0 }}>{sl}</span>
                    {b.status==="pending" && <button onClick={()=>setSettling(b)} style={{ background:"linear-gradient(135deg,#00ff87,#38bdf8)",border:"none",borderRadius:10,padding:"8px 14px",fontSize:11,fontWeight:800,color:"#020c1c",cursor:"pointer",flexShrink:0 }}>SETTLE</button>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RECEIPTS ─────────────────────────────────────────────────────── */}
        {connected && tab === "receipts" && (
          <div style={{ animation:"slideUp .4s ease" }}>
            <div style={{ marginBottom:24 }}>
              <p style={{ fontSize:10,color:"#1e3a5a",letterSpacing:"0.18em",marginBottom:6,fontFamily:"monospace" }}>CELO SEPOLIA BLOCKCHAIN</p>
              <h2 style={{ fontSize:isMobile?24:32,fontWeight:900,letterSpacing:"-0.025em" }}>On-Chain Receipts</h2>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {RECEIPTS.map((r, i) => (
                <div key={i} style={{ background:"linear-gradient(135deg,#060e1f,#04091a)",border:"1px solid #0f1e35",borderRadius:20,padding:isMobile?16:22,animation:"slideUp .4s ease",animationDelay:`${i*70}ms` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",gap:16 }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:7,flexWrap:"wrap" }}>
                        <span style={{ width:6,height:6,borderRadius:"50%",background:"#00ff87",flexShrink:0 }} />
                        <span style={{ fontSize:13,fontWeight:700,color:"#d8eeff" }}>{r.bill}</span>
                        <span style={{ fontSize:9,color:"#00ff87",background:"#00ff8712",border:"1px solid #00ff8728",padding:"2px 7px",borderRadius:20 }}>CONFIRMED</span>
                      </div>
                      <p style={{ fontSize:11,color:"#38bdf8",fontFamily:"monospace",marginBottom:7 }}>{r.hash}</p>
                      <div style={{ display:"flex",gap:12,fontSize:10,color:"#1e3a5a",fontFamily:"monospace",flexWrap:"wrap" }}>
                        <span>Block #{r.block}</span>
                        <span>{r.date}</span>
                        <a href="#" style={{ color:"#38bdf8",textDecoration:"none" }}>Explorer →</a>
                      </div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <p style={{ fontSize:10,color:"#1e3a5a",marginBottom:2 }}>PAID</p>
                      <p style={{ fontSize:isMobile?20:26,fontWeight:900,color:"#d8eeff" }}>₹{r.paid.toLocaleString()}</p>
                      <p style={{ fontSize:12,color:"#00ff87",marginTop:2 }}>↓ ₹{r.saved}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14,padding:"12px 16px",background:"#060e1f",border:"1px solid #0f1e35",borderRadius:14,display:"flex",alignItems:"center",gap:8 }}>
              <span>⛓️</span>
              <p style={{ fontSize:11,color:"#1e3a5a" }}>All receipts are permanently stored on Celo Sepolia.</p>
            </div>
          </div>
        )}

        {/* ── WALLET ───────────────────────────────────────────────────────── */}
        {connected && tab === "wallet" && (
          <div style={{ animation:"slideUp .4s ease",maxWidth:520 }}>
            <div style={{ marginBottom:24 }}>
              <p style={{ fontSize:10,color:"#1e3a5a",letterSpacing:"0.18em",marginBottom:6,fontFamily:"monospace" }}>AGENT WALLET</p>
              <h2 style={{ fontSize:isMobile?24:32,fontWeight:900,letterSpacing:"-0.025em" }}>Manage Funds</h2>
            </div>
            {[
              { label:"Your cUSD Balance",    val:"$128.40", color:"#38bdf8" },
              { label:"Agent Wallet Balance", val:"$54.12",  color:"#00ff87" },
            ].map(b => (
              <div key={b.label} style={{ background:"linear-gradient(135deg,#060e1f,#04091a)",border:`1px solid ${b.color}20`,borderRadius:20,padding:"18px 22px",marginBottom:14 }}>
                <p style={{ fontSize:10,color:"#1e3a5a",letterSpacing:"0.14em",marginBottom:7,fontFamily:"monospace" }}>{b.label.toUpperCase()}</p>
                <p style={{ fontSize:isMobile?28:34,fontWeight:900,color:b.color }}>{b.val}</p>
              </div>
            ))}
            <div style={{ background:"linear-gradient(135deg,#060e1f,#04091a)",border:"1px solid #0f1e35",borderRadius:20,padding:isMobile?16:24 }}>
              <p style={{ fontSize:10,color:"#1e3a5a",letterSpacing:"0.14em",marginBottom:14,fontFamily:"monospace" }}>AMOUNT (cUSD)</p>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14,borderBottom:"1px solid #0f1e35",paddingBottom:14 }}>
                <span style={{ fontSize:24,color:"#1e3a5a" }}>$</span>
                <input type="number" placeholder="0.00" style={{ flex:1,background:"none",border:"none",outline:"none",fontSize:isMobile?26:34,fontWeight:900,color:"#d8eeff",fontFamily:"'Syne',sans-serif" }} />
              </div>
              <div style={{ display:"flex",gap:8,marginBottom:14 }}>
                {["10","50","100","500"].map(q => (
                  <button key={q} style={{ flex:1,padding:"8px 0",background:"#04091a",border:"1px solid #0f1e35",borderRadius:8,color:"#1e3a5a",fontSize:12,fontWeight:700,cursor:"pointer" }}>${q}</button>
                ))}
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <button style={{ padding:"13px 0",borderRadius:12,background:"linear-gradient(135deg,#00ff87,#38bdf8)",border:"none",color:"#020c1c",fontWeight:900,fontSize:13,cursor:"pointer" }}>↓ Deposit</button>
                <button style={{ padding:"13px 0",borderRadius:12,background:"transparent",border:"1px solid #0f1e35",color:"#d8eeff",fontWeight:900,fontSize:13,cursor:"pointer" }}>↑ Withdraw</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────────────────── */}
      {connected && isMobile && (
        <nav style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"rgba(3,9,18,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid #0f1e35",display:"flex",padding:"8px 0 20px" }}>
          {[
            { id:"dashboard", icon:"📊", label:"Home"     },
            { id:"bills",     icon:"📄", label:"Bills"    },
            { id:"receipts",  icon:"🧾", label:"Receipts" },
            { id:"wallet",    icon:"💰", label:"Wallet"   },
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"6px 0" }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={{ fontSize:9,fontWeight:700,color:tab===t.id?"#00ff87":"#2a4060",letterSpacing:"0.06em" }}>{t.label.toUpperCase()}</span>
              {tab===t.id && <div style={{ width:16,height:2,borderRadius:1,background:"#00ff87" }} />}
            </button>
          ))}
        </nav>
      )}

      {settling && <NegotiationModal bill={settling} onClose={()=>setSettling(null)} isMobile={isMobile} />}
    </div>
  );
}
