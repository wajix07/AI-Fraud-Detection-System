import { useEffect, useState } from 'react';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const initial = { amount: 850, hour: 2, distance_from_home_km: 420, is_international: true, transactions_last_24h: 8, merchant_risk: 0.8 };
const samples = [
  { label: 'Low-risk example', icon: 'shield', values: { amount: 450, hour: 14, distance_from_home_km: 3, is_international: false, transactions_last_24h: 1, merchant_risk: 0.1 } },
  { label: 'Unusual activity', icon: 'activity', values: { amount: 18500, hour: 1, distance_from_home_km: 620, is_international: true, transactions_last_24h: 11, merchant_risk: 0.9 } },
  { label: 'Review example', icon: 'search', values: { amount: 5200, hour: 20, distance_from_home_km: 85, is_international: false, transactions_last_24h: 4, merchant_risk: 0.5 } }
];

function Icon({ name, size = 17 }) {
  const paths = {
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    rotate: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.shield}</svg>;
}

export default function App() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');
  const [displayScore, setDisplayScore] = useState(0);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('fraudshield-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(appleMobile);
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true
    );

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallHelp(false);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  }

  useEffect(() => {
    try {
      localStorage.setItem('fraudshield-history', JSON.stringify(history));
    } catch (storageError) {
      console.warn('Could not save analysis history in this browser.', storageError);
    }
  }, [history]);

  useEffect(() => {
    if (!result) { setDisplayScore(0); return; }
    const target = result.fraud_probability * 100;
    const duration = 950;
    let start;
    let frame;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayScore(target * (1 - Math.pow(1 - progress, 4)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [result]);

  function update(key, value) { setForm(current => ({ ...current, [key]: value })); }
  function loadSample(sample) {
    setForm(sample.values);
    setResult(null);
    setError('');
  }
  function resetForm() {
    setForm(initial);
    setResult(null);
    setError('');
  }
  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch(API_BASE_URL + '/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || ('API error (' + response.status + ')'));
      setResult(body);
      setHistory(items => [{ id: Date.now(), amount: form.amount, risk: body.risk_level, probability: body.fraud_probability, time: new Date().toLocaleTimeString() }, ...items].slice(0, 8));
    } catch (err) {
      setError(err.message + '. Check the API URL and confirm that the backend is running.');
    } finally { setLoading(false); }
  }

  const highCount = history.filter(item => item.risk.toLowerCase() === 'high').length;
  const mediumCount = history.filter(item => item.risk.toLowerCase() === 'medium').length;
  const lowCount = history.filter(item => item.risk.toLowerCase() === 'low').length;
  const total = history.length || 1;
  function exportHistory() {
    if (!history.length) return;
    const columns = ['Transaction ID', 'Amount (INR)', 'Risk Level', 'Fraud Probability (%)', 'Time'];
    const rows = history.map(item => [
      item.id,
      item.amount,
      item.risk,
      (Number(item.probability) * 100).toFixed(2),
      item.time
    ]);
    const csvCell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const csv = [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fraudshield-analysis-history.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }



  function exportPdfReport() {
    if (!history.length) return;
    const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
    const rows = history.map(item => `<tr><td>${safe(item.id)}</td><td>₹${Number(item.amount).toLocaleString('en-IN')}</td><td>${safe(item.risk)}</td><td>${(Number(item.probability) * 100).toFixed(1)}%</td><td>${safe(item.time)}</td></tr>`).join('');
    const report = window.open('', '_blank');
    if (!report) {
      setError('Please allow pop-ups for this site to create your PDF report.');
      return;
    }
    report.document.write(`<!doctype html><html><head><title>WFraudN@X Report</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#18232c;margin:36px;line-height:1.5}
      h1{margin:0;color:#203d2b} .sub{color:#657580;margin:6px 0 24px}
      .summary{display:flex;gap:12px;margin:20px 0}.card{border:1px solid #d8e0e4;border-radius:8px;padding:14px;flex:1}
      .card span{display:block;color:#657580;font-size:12px}.card strong{font-size:24px}
      .high{color:#b63e3e}.medium{color:#986b17}.low{color:#38733c}
      h2{font-size:17px;margin-top:28px}table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #e1e7ea}th{background:#f1f5f3}
      .note{margin-top:28px;padding:12px;background:#f5f7f6;color:#56656d;font-size:11px}
      @media print{body{margin:18mm}.summary{break-inside:avoid}tr{break-inside:avoid}}
    </style></head><body>
      <h1>WFraudN@X</h1><p class="sub">Transaction risk analysis report · Generated ${safe(new Date().toLocaleString())}</p>
      <div class="summary">
        <div class="card"><span>Total analysed</span><strong>${history.length}</strong></div>
        <div class="card"><span>High risk</span><strong class="high">${highCount}</strong></div>
        <div class="card"><span>Medium risk</span><strong class="medium">${mediumCount}</strong></div>
        <div class="card"><span>Low risk</span><strong class="low">${lowCount}</strong></div>
      </div>
      <h2>Recent transaction analyses</h2>
      <table><thead><tr><th>Transaction ID</th><th>Amount</th><th>Risk</th><th>Fraud probability</th><th>Time</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="note"><strong>Important:</strong> This report is generated from a synthetic educational demo model. It is not a financial audit, a confirmed fraud finding, or advice for real financial decisions. History is stored only in this browser.</p>
      <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
    report.document.close();
  }

  return <main className="dashboard-shell">
    <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
    <header className="dashboard-topbar">
      <a className="brand-lockup" href="#home" aria-label="WFraudN@X home"><div className="brand-mark"><Icon name="shield" size={27}/></div><div><h1>WFraudN<span>@X</span></h1><p>AI-POWERED FRAUD DETECTION</p></div></a>
      <nav className="top-navigation" aria-label="Main navigation"><a className="active" href="#home">⌂ <span>Dashboard</span></a><a href="#analytics"><Icon name="chart"/> <span>Analytics</span></a><a href="#history"><Icon name="clock"/> <span>History</span></a><a href="#analyzer"><Icon name="shield"/> <span>Analyzer</span></a></nav>
      <div className="top-status"><span className={'api-indicator ' + apiStatus}></span><span>{apiStatus === 'checking' ? 'Connecting' : apiStatus === 'offline' ? 'API offline' : 'System online'}</span></div>
    </header>
    <div className="dashboard-layout">
      <aside className="side-rail"><a className="rail-active" href="#home">⌂ <span>Dashboard</span></a><a href="#analytics"><Icon name="chart"/> <span>Analytics</span></a><a href="#history"><Icon name="clock"/> <span>Transaction History</span></a><a href="#analyzer"><Icon name="search"/> <span>Run Analysis</span></a><div className="rail-trust"><div className="rail-shield"><Icon name="shield" size={31}/></div><strong>Smart Security</strong><span>Safer transactions</span></div></aside>
      <div className="dashboard-content">
        <section className="hero-section" id="home">
          <div className="hero-copy"><p className="eyebrow">INTELLIGENT TRANSACTION PROTECTION</p><h2>Know the Risk.<br/><em>Before it Escalates.</em></h2><p>AI-powered fraud detection for a safer, smarter tomorrow.</p><a className="hero-cta" href="#analyzer"><Icon name="search"/> Run Fraud Analysis <span>→</span></a></div>
          <div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="shield-platform"></div><div className="hero-shield"><Icon name="shield" size={112}/><span className="shield-lock">⌑</span></div><div className="holo-chip chip-left">▰</div><div className="holo-chip chip-right">▥</div><div className="holo-chip chip-bottom">◇</div></div>
        </section>
        <section className="metric-grid" aria-label="Dashboard summary">
          <article className="metric-card metric-cyan"><div className="metric-icon">▣</div><span>Total Analyses</span><strong>{history.length}</strong><small>Saved on this device</small><div className="metric-spark spark-cyan"></div></article>
          <article className="metric-card metric-red"><div className="metric-icon">!</div><span>High Risk</span><strong>{highCount}</strong><small>From saved analyses</small><div className="metric-spark spark-red"></div></article>
          <article className="metric-card metric-green"><div className="metric-icon">✓</div><span>Low Risk</span><strong>{lowCount}</strong><small>From saved analyses</small><div className="metric-spark spark-green"></div></article>
          <article className="metric-card metric-violet"><div className="metric-icon">◎</div><span>Model</span><strong>AI / ML</strong><small>Random Forest demo</small><div className="metric-spark spark-violet"></div></article>
        </section>
        <section className="insight-grid" id="analytics">
          <article className="glass-panel risk-overview"><div className="section-title"><div><p className="eyebrow">LIVE FROM THIS SESSION</p><h3>Fraud Risk Overview</h3></div><span className="live-pill">● Local data</span></div>
            <div className="risk-content"><div className="donut-wrap"><div className="risk-donut"><div><strong>{history.length ? Math.round(history.reduce((sum,item)=>sum+Number(item.probability||0),0)/history.length*100) : 0}%</strong><span>Avg. score</span></div></div></div><div className="risk-legend"><p><i className="legend-low"></i> Low Risk <b>{lowCount}</b></p><p><i className="legend-medium"></i> Medium Risk <b>{mediumCount}</b></p><p><i className="legend-high"></i> High Risk <b>{highCount}</b></p></div></div><p className="panel-footnote">Based on saved analyses in this browser. No account-wide data is collected.</p>
          </article>
          <article className="glass-panel trend-panel"><div className="section-title"><div><p className="eyebrow">ACTIVITY SNAPSHOT</p><h3>Transaction Trend</h3></div><span className="trend-tag">Recent checks</span></div><div className="trend-chart"><div className="chart-ylabels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="chart-plot"><div className="chart-gridlines"><i></i><i></i><i></i><i></i><i></i></div><svg viewBox="0 0 520 180" preserveAspectRatio="none" role="img" aria-label="Illustrative transaction activity trend"><defs><linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#12baff" stopOpacity=".35"/><stop offset="1" stopColor="#12baff" stopOpacity="0"/></linearGradient><linearGradient id="trendStroke"><stop stopColor="#00d9ff"/><stop offset="1" stopColor="#a13cff"/></linearGradient></defs><path d="M0 143 C55 138 60 112 115 115 S185 80 230 88 S300 35 345 65 S405 92 450 48 S490 42 520 26 L520 180 L0 180Z" fill="url(#trendFill)"/><path d="M0 143 C55 138 60 112 115 115 S185 80 230 88 S300 35 345 65 S405 92 450 48 S490 42 520 26" fill="none" stroke="url(#trendStroke)" strokeWidth="3" vectorEffect="non-scaling-stroke"/><g fill="#07132b" stroke="#48d9ff" strokeWidth="2"><circle cx="0" cy="143" r="4"/><circle cx="115" cy="115" r="4"/><circle cx="230" cy="88" r="4"/><circle cx="345" cy="65" r="4"/><circle cx="450" cy="48" r="4"/><circle cx="520" cy="26" r="4"/></g></svg><div className="chart-xlabels"><span>Earlier</span><span>Recent</span><span>Latest</span></div></div></div><p className="panel-footnote">Decorative trend illustration — not connected to transaction telemetry.</p></article>
        </section>
        <section className="activity-grid" id="history">
          <article className="glass-panel recent-panel"><div className="section-title"><div><p className="eyebrow">YOUR DEVICE HISTORY</p><h3>Recent Activity</h3></div><a href="#analyzer">New analysis →</a></div>
            {history.length ? <div className="recent-list">{history.slice(0,4).map(item=><div className="recent-row" key={item.id}><span className={'activity-mark '+item.risk.toLowerCase()}>{item.risk.toLowerCase()==='high'?'!':'✓'}</span><div><strong>{item.risk} risk analysis</strong><small>{item.time}</small></div><b>₹{Number(item.amount).toLocaleString('en-IN')}</b></div>)}</div> : <div className="empty-activity"><span>◷</span><strong>No analyses yet</strong><p>Run your first transaction check to see activity here.</p><a href="#analyzer">Start an analysis</a></div>}
          </article>
          <article className="glass-panel indicators-panel"><div className="section-title"><div><p className="eyebrow">WHAT THE MODEL CHECKS</p><h3>Top Risk Indicators</h3></div></div><div className="indicator-grid"><div><span className="indicator-icon cyan">⌖</span><strong>Location</strong><small>Distance from home</small></div><div><span className="indicator-icon violet">▤</span><strong>Amount</strong><small>Transaction value</small></div><div><span className="indicator-icon amber">◷</span><strong>Frequency</strong><small>Recent transaction count</small></div><div><span className="indicator-icon green">◎</span><strong>International</strong><small>Cross-border activity</small></div></div></article>
        </section>
        <section className="analyzer-section" id="analyzer">
          <div className="section-intro"><p className="eyebrow">INTERACTIVE MODEL WORKSPACE</p><h2>Run a Fraud Analysis</h2><p>Enter sample transaction details to receive a risk estimate from the demo model.</p></div>
          <section className="panel input-panel">
            <div className="panel-heading"><div><p className="eyebrow"><Icon name="shield" size={13}/> TRANSACTION INPUT</p><h3>Analyse a transaction</h3></div><span className="step">01 / INPUT</span></div>
            <div className="sample-toolbar"><span className="sample-label">QUICK TEST SCENARIOS</span><div className="sample-buttons">{samples.map(sample=><button type="button" className="sample-button" key={sample.label} onClick={()=>loadSample(sample)}><Icon name={sample.icon} size={14}/>{sample.label}</button>)}</div></div>
            <form onSubmit={submit}>
              <label>Transaction amount (₹)<input type="number" min="0" value={form.amount} onChange={e=>update('amount',Number(e.target.value))}/></label>
              <label>Transaction hour (0–23)<input type="number" min="0" max="23" value={form.hour} onChange={e=>update('hour',Number(e.target.value))}/></label>
              <label>Distance from home (km)<input type="number" min="0" value={form.distance_from_home_km} onChange={e=>update('distance_from_home_km',Number(e.target.value))}/></label>
              <label>Transactions in last 24 hours<input type="number" min="0" value={form.transactions_last_24h} onChange={e=>update('transactions_last_24h',Number(e.target.value))}/></label>
              <label className="wide">Merchant risk score <strong>{Number(form.merchant_risk).toFixed(2)}</strong><input type="range" min="0" max="1" step="0.05" value={form.merchant_risk} onChange={e=>update('merchant_risk',Number(e.target.value))}/></label>
              <label className="toggle"><input type="checkbox" checked={form.is_international} onChange={e=>update('is_international',e.target.checked)}/> International transaction</label>
              <div className="form-actions"><button disabled={loading || apiStatus==='offline'} className={loading?'analyzing':''}>{loading&&<span className="spinner" aria-hidden="true"/>}{loading?'Analysing transaction…':<><Icon name="search" size={16}/> Run fraud analysis</>}</button><button type="button" className="reset-form" onClick={resetForm} disabled={loading}><Icon name="rotate" size={15}/> Reset inputs</button></div>
            </form>
            {error&&<p className="error" role="alert">{error}</p>}
          </section>
          {result&&<section className="result panel result-enter" aria-live="polite"><div className="panel-heading"><div><p className="eyebrow"><Icon name="activity" size={13}/> MODEL OUTPUT</p><h3>Risk assessment</h3></div><span className={'risk '+result.risk_level.toLowerCase()}>{result.risk_level} RISK</span></div><div className="score">{displayScore.toFixed(1)}<small>%</small></div><div className="meter"><span className={result.risk_level.toLowerCase()} style={{width:displayScore+'%'}}/></div><p className="muted">Estimated fraud probability · synthetic demo model</p><h4>Recommended next step</h4><p>{result.recommended_action}</p><h4>Signals detected</h4><ul>{result.signals.map((signal,index)=><li className="signal-enter" style={{animationDelay:(index*90)+'ms'}} key={signal}>{signal}</li>)}</ul></section>}
          <section className="analytics panel">
            <div className="panel-heading"><div><p className="eyebrow"><Icon name="chart" size={13}/> SAVED OVERVIEW</p><h3>Analysis History & Reports</h3></div><div className="history-actions"><button type="button" className="export-history" onClick={exportHistory} disabled={!history.length}>↓ Export CSV</button><button type="button" className="export-pdf" onClick={exportPdfReport} disabled={!history.length}>▤ Save PDF</button><button type="button" className="clear-history" onClick={()=>setHistory([])} disabled={!history.length}>Clear history</button></div></div>
            <div className="stat-grid"><div className="stat-card"><span>Analysed</span><strong>{history.length}</strong></div><div className="stat-card"><span>High risk</span><strong className="stat-high">{highCount}</strong></div><div className="stat-card"><span>Medium risk</span><strong className="stat-medium">{mediumCount}</strong></div><div className="stat-card"><span>Low risk</span><strong className="stat-low">{lowCount}</strong></div></div>
            <div className="distribution"><div className="distribution-label"><span>Risk distribution</span><span>{history.length} checks</span></div><div className="distribution-bar"><i className="bar-high" style={{width:(highCount/total*100)+'%'}}/><i className="bar-medium" style={{width:(mediumCount/total*100)+'%'}}/><i className="bar-low" style={{width:(lowCount/total*100)+'%'}}/></div><div className="legend"><span><i className="dot-high"/> High</span><span><i className="dot-medium"/> Medium</span><span><i className="dot-low"/> Low</span></div></div>
            <h4><Icon name="clock" size={15}/> Recent transactions</h4><div className="history-list">{history.map(item=><div className="history-row" key={item.id}><div><strong>₹{Number(item.amount).toLocaleString('en-IN')}</strong><small>{item.time}</small></div><span className={'risk '+item.risk.toLowerCase()}>{item.risk}</span><strong className="history-score">{(item.probability*100).toFixed(1)}%</strong></div>)}</div>
            <p className="muted small-note">History is stored only in this browser. This is a synthetic educational demo, not a production banking system. Do not enter real customer or payment information.</p>
          </section>
        </section>
        <section className="closing-banner"><div className="closing-emblem"><Icon name="shield" size={56}/></div><div><h3>Build a Safer Digital World</h3><p>Prevent fraud. Protect your users. Grow with confidence.</p></div><a href="#analyzer">Explore the demo <span>→</span></a></section>
        <footer className="dashboard-footer"><a className="footer-brand" href="#home"><Icon name="shield" size={27}/> WFraudN<span>@X</span></a><div><a href="#analyzer">About the demo</a><a href="#history">History</a><a href="mailto:smabduljabbar.co@gmail.com">Contact</a></div><small>Portfolio project · Educational use only</small></footer>
      </div>
    </div>
  </main>;
}
}
