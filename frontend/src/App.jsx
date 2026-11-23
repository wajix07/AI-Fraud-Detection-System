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
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    wallet: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M16 14h2"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z"/><path d="M12 9v4M12 16h.01"/></>
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
  const [copiedResult, setCopiedResult] = useState(false);
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
  async function copyResult() {
    if (!result) return;
    const summary = [
      'WFraudN@X — Transaction Risk Assessment',
      'Risk level: ' + result.risk_level,
      'Estimated fraud probability: ' + (Number(result.fraud_probability) * 100).toFixed(1) + '%',
      'Recommended action: ' + result.recommended_action,
      'Signals detected: ' + (result.signals || []).join('; '),
      'Educational demo model — not a confirmed fraud finding.'
    ].join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedResult(true);
    } catch {
      setError('Could not copy automatically. Please allow clipboard access in your browser.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError(''); setResult(null); setCopiedResult(false);
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

  return <main className="shell">
    <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark">W</div><div><p className="eyebrow">AI-POWERED FRAUD DETECTION</p><h1>WFraudN<span>@X</span></h1></div></div>{!isInstalled && (installPrompt || isIOS) && <button type="button" className="install-app" onClick={installApp}>Install App ↓</button>}</header>
    {showInstallHelp && <div className="install-help" role="status">To install on iPhone: open this page in Safari, tap the Share icon, then choose <strong>Add to Home Screen</strong>.</div>}
    <section className="intro reveal">
      <div><p className="eyebrow">RISK ANALYSIS WORKSPACE</p><h2>Know the risk.<br/><em>Before it escalates.</em></h2><p className="muted">Submit transaction details to estimate fraud risk using a machine-learning model.</p></div>
      <div className={'status status-' + apiStatus}><i/> API {apiStatus === 'checking' ? 'CHECKING' : apiStatus.toUpperCase()} · DEMO</div>
    </section>
    <section className="panel input-panel reveal delay-one">
      <div className="panel-heading"><div><p className="eyebrow"><Icon name="shield" size={13}/> TRANSACTION INPUT</p><h3>Analyse a transaction</h3></div><span className="step">01 / INPUT</span></div>
      <div className="sample-toolbar">
        <span className="sample-label">QUICK TEST SCENARIOS</span>
        <div className="sample-buttons">{samples.map(sample => <button type="button" className="sample-button" key={sample.label} onClick={() => loadSample(sample)}><Icon name={sample.icon} size={14}/>{sample.label}</button>)}</div>
      </div>
      <form onSubmit={submit}>
        <label><span className="field-label"><Icon name="wallet" size={14}/> Transaction amount (₹)</span><input type="number" min="0" value={form.amount} onChange={e=>update('amount', Number(e.target.value))}/></label>
        <label><span className="field-label"><Icon name="clock" size={14}/> Transaction hour (0–23)</span><input type="number" min="0" max="23" value={form.hour} onChange={e=>update('hour', Number(e.target.value))}/></label>
        <label><span className="field-label"><Icon name="pin" size={14}/> Distance from home (km)</span><input type="number" min="0" value={form.distance_from_home_km} onChange={e=>update('distance_from_home_km', Number(e.target.value))}/></label>
        <label><span className="field-label"><Icon name="activity" size={14}/> Transactions in last 24 hours</span><input type="number" min="0" value={form.transactions_last_24h} onChange={e=>update('transactions_last_24h', Number(e.target.value))}/></label>
        <label className="wide"><span className="field-label"><Icon name="shield" size={14}/> Merchant risk score</span> <strong>{Number(form.merchant_risk).toFixed(2)}</strong><input type="range" min="0" max="1" step="0.05" value={form.merchant_risk} onChange={e=>update('merchant_risk', Number(e.target.value))}/></label>
        <label className="toggle"><input type="checkbox" checked={form.is_international} onChange={e=>update('is_international', e.target.checked)}/> <span className="field-label"><Icon name="globe" size={14}/> International transaction</span></label>
        <div className="form-actions"><button disabled={loading || apiStatus === 'offline'} className={loading ? 'analyzing' : ''}>{loading && <span className="spinner" aria-hidden="true"/>}{loading ? 'Analysing transaction…' : <><Icon name="search" size={16}/> Run fraud analysis</>}</button><button type="button" className="reset-form" onClick={resetForm} disabled={loading}><Icon name="rotate" size={15}/> Reset inputs</button></div>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    {result && <section className="result panel result-enter" aria-live="polite">
      <div className="panel-heading"><div><p className="eyebrow"><Icon name="activity" size={13}/> MODEL OUTPUT</p><h3>Risk assessment</h3></div><div className="result-actions"><span className={'risk ' + result.risk_level.toLowerCase()}>{result.risk_level} RISK</span><button type="button" className="copy-result" onClick={copyResult}><Icon name={copiedResult ? 'check' : 'copy'} size={14}/>{copiedResult ? 'Copied' : 'Copy summary'}</button></div></div>
      <div className="score">{displayScore.toFixed(1)}<small>%</small></div>
      <div className="meter"><span className={result.risk_level.toLowerCase()} style={{width: displayScore + '%'}}/></div>
      <p className="muted">Estimated fraud probability · synthetic demo model</p>
      <h4>Recommended next step</h4><p>{result.recommended_action}</p><h4>Signals detected</h4>
      <ul>{result.signals.map((signal,index)=><li className="signal-enter" style={{animationDelay: (index*90) + 'ms'}} key={signal}>{signal}</li>)}</ul>
    </section>}

    {history.length > 0 && <section className="analytics panel result-enter">
      <div className="panel-heading"><div><p className="eyebrow"><Icon name="chart" size={13}/> SAVED OVERVIEW</p><h3>Analysis activity</h3></div><div className="history-actions"><button type="button" className="export-history" onClick={exportHistory}>↓ Export CSV</button><button type="button" className="export-pdf" onClick={exportPdfReport}>▤ Save PDF</button><button type="button" className="clear-history" onClick={() => setHistory([])}>Clear history</button></div></div>
      <div className="stat-grid">
        <div className="stat-card"><span>Analysed</span><strong>{history.length}</strong></div>
        <div className="stat-card"><span>High risk</span><strong className="stat-high">{highCount}</strong></div>
        <div className="stat-card"><span>Medium risk</span><strong className="stat-medium">{mediumCount}</strong></div>
        <div className="stat-card"><span>Low risk</span><strong className="stat-low">{lowCount}</strong></div>
      </div>
      <div className="distribution"><div className="distribution-label"><span>Risk distribution</span><span>{history.length} checks</span></div>
        <div className="distribution-bar"><i className="bar-high" style={{width: (highCount/total*100)+'%'}}/><i className="bar-medium" style={{width: (mediumCount/total*100)+'%'}}/><i className="bar-low" style={{width: (lowCount/total*100)+'%'}}/></div>
        <div className="legend"><span><i className="dot-high"/> High</span><span><i className="dot-medium"/> Medium</span><span><i className="dot-low"/> Low</span></div>
      </div>
      <h4><Icon name="clock" size={15}/> Recent transactions</h4>
      <div className="history-list">{history.map(item => <div className="history-row" key={item.id}>
        <div><strong>₹{Number(item.amount).toLocaleString('en-IN')}</strong><small>{item.time}</small></div>
        <span className={'risk '+item.risk.toLowerCase()}>{item.risk}</span>
        <strong className="history-score">{(item.probability*100).toFixed(1)}%</strong>
      </div>)}</div>
      <p className="muted small-note">Saved in this browser on this device, including after refresh. Clearing browser data or using another browser/device will not carry this history over. Demo data only — do not enter real customer or payment information.</p>
    </section>}
    <footer>PORTFOLIO PROJECT · EDUCATIONAL USE ONLY · NOT FOR REAL FINANCIAL DECISIONS</footer>
  </main>;
}