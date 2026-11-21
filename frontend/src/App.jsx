import { useEffect, useState } from 'react';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const initial = { amount: 850, hour: 2, distance_from_home_km: 420, is_international: true, transactions_last_24h: 8, merchant_risk: 0.8 };

export default function App() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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


  return <main className="shell">
    <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
    <header className="topbar"><div className="brand-mark">F</div><div><p className="eyebrow">INTELLIGENT TRANSACTION MONITORING</p><h1>FraudShield <span>AI</span></h1></div></header>
    <section className="intro reveal">
      <div><p className="eyebrow">RISK ANALYSIS WORKSPACE</p><h2>Know the risk.<br/><em>Before it escalates.</em></h2><p className="muted">Submit transaction details to estimate fraud risk using a machine-learning model.</p></div>
      <div className="status"><i/> MODEL API · DEMO</div>
    </section>
    <section className="panel input-panel reveal delay-one">
      <div className="panel-heading"><div><p className="eyebrow">TRANSACTION INPUT</p><h3>Analyse a transaction</h3></div><span className="step">01 / INPUT</span></div>
      <form onSubmit={submit}>
        <label>Transaction amount (₹)<input type="number" min="0" value={form.amount} onChange={e=>update('amount', Number(e.target.value))}/></label>
        <label>Transaction hour (0–23)<input type="number" min="0" max="23" value={form.hour} onChange={e=>update('hour', Number(e.target.value))}/></label>
        <label>Distance from home (km)<input type="number" min="0" value={form.distance_from_home_km} onChange={e=>update('distance_from_home_km', Number(e.target.value))}/></label>
        <label>Transactions in last 24 hours<input type="number" min="0" value={form.transactions_last_24h} onChange={e=>update('transactions_last_24h', Number(e.target.value))}/></label>
        <label className="wide">Merchant risk score <strong>{Number(form.merchant_risk).toFixed(2)}</strong><input type="range" min="0" max="1" step="0.05" value={form.merchant_risk} onChange={e=>update('merchant_risk', Number(e.target.value))}/></label>
        <label className="toggle"><input type="checkbox" checked={form.is_international} onChange={e=>update('is_international', e.target.checked)}/> International transaction</label>
        <button disabled={loading} className={loading ? 'analyzing' : ''}>{loading && <span className="spinner" aria-hidden="true"/>}{loading ? 'Analysing transaction…' : 'Run fraud analysis →'}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    {result && <section className="result panel result-enter" aria-live="polite">
      <div className="panel-heading"><div><p className="eyebrow">MODEL OUTPUT</p><h3>Risk assessment</h3></div><span className={'risk ' + result.risk_level.toLowerCase()}>{result.risk_level} RISK</span></div>
      <div className="score">{displayScore.toFixed(1)}<small>%</small></div>
      <div className="meter"><span className={result.risk_level.toLowerCase()} style={{width: displayScore + '%'}}/></div>
      <p className="muted">Estimated fraud probability · synthetic demo model</p>
      <h4>Recommended next step</h4><p>{result.recommended_action}</p><h4>Signals detected</h4>
      <ul>{result.signals.map((signal,index)=><li className="signal-enter" style={{animationDelay: (index*90) + 'ms'}} key={signal}>{signal}</li>)}</ul>
    </section>}

    {history.length > 0 && <section className="analytics panel result-enter">
      <div className="panel-heading"><div><p className="eyebrow">SAVED OVERVIEW</p><h3>Analysis activity</h3></div><div className="history-actions"><button type="button" className="export-history" onClick={exportHistory}>↓ Export CSV</button><button type="button" className="clear-history" onClick={() => setHistory([])}>Clear history</button></div></div>
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
      <h4>Recent transactions</h4>
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