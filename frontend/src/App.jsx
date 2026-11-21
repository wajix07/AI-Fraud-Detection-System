import { useEffect, useState } from 'react';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const initial = { amount: 850, hour: 2, distance_from_home_km: 420, is_international: true, transactions_last_24h: 8, merchant_risk: 0.8 };

export default function App() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayScore, setDisplayScore] = useState(0);

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
    } catch (err) {
      setError(err.message + '. Check the API URL and confirm that the backend is running.');
    } finally { setLoading(false); }
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
    <footer>PORTFOLIO PROJECT · EDUCATIONAL USE ONLY · NOT FOR REAL FINANCIAL DECISIONS</footer>
  </main>;
}