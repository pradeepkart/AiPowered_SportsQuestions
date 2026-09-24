import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { inferRequest, sports, validatePairs } from './request.js'; //checks backend response and returns a validated request object
import './styles.css';

const modes = [{ id: 'questions', label: 'Questions only' }, { id: 'answers', label: 'Answers only' }, { id: 'both', label: 'Questions & answers' }];

function App() {
  const [sport, setSport] = useState('cricket');
  const [mode, setMode] = useState('both'); // questions, answers, or both
  const [query, setQuery] = useState(''); //search query entered by user
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const activeRequest = useRef(null);
  const copyTimer = useRef(null);
  useEffect(() => () => { activeRequest.current?.abort(); clearTimeout(copyTimer.current); }, []);

  async function generate(event) {
    event.preventDefault();
    if (loading) return;
    setError('');
    if (!query.trim()) { setError('Enter a topic or question to get started.'); return; }
    let request;
    try { request = inferRequest(query, sport, mode); } catch (err) { setError(err.message); return; }
    setSport(request.sport);
    setMode(request.mode);
    setLoading(true);
    setResult(null);
    setCopied(false);
    clearTimeout(copyTimer.current);
    const controller = new AbortController();
    activeRequest.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180000);
    try {
      const response = await fetch(`/api/${request.sport}?prompt=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 502
        ? 'The AI generator is unavailable. Check that Ollama is running and its model is installed, then try again.'
        : `Could not generate your set (${response.status}). Please try again.`);
      const pairs = validatePairs(await response.json());
      setResult({ pairs, sport: request.sport, query: query.trim() });
    } catch (err) {
      if (err.name !== 'AbortError') setError(err instanceof TypeError ? 'Cannot reach the server. Make sure the backend is running on port 8080.' : err.message);
      else if (timedOut) setError('Generation took longer than three minutes. Please try again with a simpler topic.');
    } finally {
      clearTimeout(timeout);
      activeRequest.current = null;
      setLoading(false);
    }
  }

  async function copyResults() {
    const text = result.pairs.map((pair, index) => `${index + 1}. ${mode === 'answers' ? pair.answer : pair.question}${mode === 'both' ? `\nAnswer: ${pair.answer}` : ''}`).join('\n\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); copyTimer.current = setTimeout(() => setCopied(false), 2000); }
    catch { setError('Clipboard access is unavailable. You can select and copy your results directly.'); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="./" aria-label="Playbook home"><span className="brand-mark">p<span>.</span></span>playbook<span className="brand-dot">.</span></a>
      <span className="header-label">A little curiosity. A lot of game.</span>
      <span className="ai-badge"><span /> AI-powered learning</span>
    </header>
    <main>
      <section className="hero">
        <div className="eyebrow"><span>✦</span> YOUR NEXT LEVEL STARTS HERE</div>
        <h1>Know the game.<br /><span>Own the conversation.</span></h1>
        <p>Big fan or just getting started? Turn any sports topic into<br className="desktop-break" /> a fresh set of questions and answers. Let curiosity play.</p>
      </section>
      <section className="workspace" aria-label="Sports question generator">
        <form onSubmit={generate}>
          <div className="section-label"><span className="step">01</span><h2>Pick your playing field</h2><span className="muted small">5 sports. Endless curiosity.</span></div>
          <div className="sports-grid">{sports.map(item => <button type="button" className={`sport-card ${sport === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSport(item.id)} aria-pressed={sport === item.id} disabled={loading}><span className="sport-icon" aria-hidden="true">{item.icon}</span><span>{item.name}</span><span className="selection-dot" /></button>)}</div>
          <div className="section-label prompt-label"><span className="step">02</span><label htmlFor="query">What are you curious about?</label></div>
          <div className="search-box"><span className="search-icon" aria-hidden="true">⌕</span><input id="query" value={query} onChange={event => setQuery(event.target.value)} placeholder="e.g. Give me 10 questions and answers about cricket rules" maxLength={1000} disabled={loading} aria-describedby="search-help" /><button className="generate-button" disabled={loading} type="submit">{loading ? <><span className="spinner" /> Generating</> : <>Generate <span aria-hidden="true">↗</span></>}</button></div>
          <p id="search-help" className="input-help">Ask for questions, answers, or both — we’ll match your request.</p>
          <div className="options-row"><span className="muted small">Show me</span><div className="mode-group" role="group" aria-label="Display format">{modes.map(item => <button type="button" key={item.id} aria-pressed={mode === item.id} className={mode === item.id ? 'active' : ''} onClick={() => { setMode(item.id); setCopied(false); }} disabled={loading}>{item.label}</button>)}</div><span className="set-size">✦ &nbsp; 10 per set</span></div>
        </form>
      </section>
      {error && <div className="error" role="alert">{error}</div>}
      <section className="results" aria-label="Generated results" aria-busy={loading}>
        {loading ? <div className="empty-state loading-state" role="status"><div className="empty-icon"><span className="spinner" /></div><h2>Putting your set together<span className="animated-dots">…</span></h2><p>A fresh round of sports knowledge is on its way.<br />The first generation can take a few minutes.</p><button className="text-button" onClick={() => activeRequest.current?.abort()}>Cancel generation</button></div> : result ? <>
          <div className="results-heading"><div><div className="eyebrow">YOUR PERSONAL PLAYBOOK</div><h2>{sports.find(item => item.id === result.sport).name} · {result.pairs.length} {mode === 'both' ? 'questions & answers' : mode}</h2><p>{result.query}</p></div><button className="copy-button" onClick={copyResults}>{copied ? '✓ Copied' : 'Copy set ↗'}</button></div>
          {result.pairs.length < 10 && <p className="partial-notice" role="status">The generator returned {result.pairs.length} of 10 pairs. Generate again for a fresh set.</p>}
          <ol className="result-grid">{result.pairs.map((pair, index) => <li className="result-card" key={index}><span className="result-number">{String(index + 1).padStart(2, '0')}</span><div>{mode !== 'answers' && <h3>{pair.question}</h3>}{mode !== 'questions' && <div className={mode === 'both' ? 'answer with-question' : 'answer'}><span className="answer-label">ANSWER</span><p>{pair.answer}</p></div>}</div></li>)}</ol>
        </> : <div className="empty-state"><div className="empty-icon" aria-hidden="true">✦</div><h2>Your next “I didn’t know that” awaits.</h2><p>Choose a sport, ask away, and make room for something new.</p><div className="suggestions"><span>Try a topic</span>{sports.slice(0, 3).map(item => <button key={item.id} onClick={() => { setSport(item.id); setQuery(`Give me 10 questions and answers about ${item.topic.toLowerCase()}`); setMode('both'); document.getElementById('query').focus(); }}>{item.topic} <span aria-hidden="true">↗</span></button>)}</div></div>}
      </section>
      <div className="bottom-note"><span>✧ Made for curious minds and match-day debates.</span><span>AI can make mistakes. Double-check the close calls.</span></div>
    </main>
    <footer><span className="footer-brand">playbook.</span><span>Stay curious. Keep playing.</span><span>SPORTS × KNOWLEDGE</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
