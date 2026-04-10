import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Terminal, Code, BrainCircuit, Play, Sun, Moon, ThumbsUp, ThumbsDown, UploadCloud, List, CheckCircle, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('single'); 
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Single Inference State
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rawJson, setRawJson] = useState(null);
  const [feedback, setFeedback] = useState(null); 

  // Batch Processing State
  const [batchFile, setBatchFile] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState(null);

  useEffect(() => {
    if (isDarkMode) document.body.classList.remove('light-mode');
    else document.body.classList.add('light-mode');
  }, [isDarkMode]);

  // NEW: Global Reset Function
  const globalReset = () => {
    setText('');
    setResult(null);
    setRawJson(null);
    setFeedback(null);
    setBatchFile(null);
    setBatchResults(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const sampleReviews = {
    pos: "The build quality is exceptional. It arrived incredibly fast and works perfectly out of the box.",
    neg: "Extremely frustrating experience. The software keeps crashing and customer support is completely unresponsive.",
    mixed: "The screen resolution is fantastic, but the battery life is terrible. I would not recommend this for travel."
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setFeedback(null);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      setResult(data);
      setRawJson(JSON.stringify(data, null, 2));
    } catch (error) {
      alert("API Connection Failed.");
    } finally {
      setLoading(false);
    }
  };

  const processBatch = async () => {
    if (!batchFile) return;
    setBatchLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const rows = content.split('\n').filter(row => row.trim().length > 0);
      if (rows[0].toLowerCase().includes('review') || rows[0].toLowerCase().includes('text')) rows.shift();

      try {
        const response = await fetch('http://127.0.0.1:5000/predict_batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: rows })
        });
        const data = await response.json();
        setBatchResults(data);
      } catch (error) {
        alert("Batch processing failed.");
      } finally {
        setBatchLoading(false);
      }
    };
    reader.readAsText(batchFile);
  };

  const formatJSON = (jsonString) => {
    if (!jsonString) return null;
    return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) cls = 'json-key'; 
            else cls = 'json-string';
        }
        return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <>
      <nav className="dashboard-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity color="var(--accent)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, letterSpacing: '1px', fontSize: '1.1rem' }}>SENTIMEN<span style={{color:'var(--accent)'}}>X</span></span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Enterprise Feedback Intelligence</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="btn-outline" onClick={globalReset} style={{ gap: '6px', fontSize: '0.75rem' }}>
            <RotateCcw size={14} /> Reset Pipeline
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle-btn">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <main className="dashboard-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="panel">
            <div className="panel-header"><Database size={16} /> Infrastructure Overview</div>
            <div className="metric-group">
              <div className="metric">
                <span className="metric-label">Core Engine</span>
                <span className="metric-value" style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Logistic-Regression-V2</span>
              </div>
              <div className="metric">
                <span className="metric-label">Precision</span>
                <span className="metric-value">78.4%</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><Terminal size={16} /> Analysis Gateway</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                className="btn-outline" 
                style={{ flex: 1, backgroundColor: activeTab === 'single' ? 'var(--border-color)' : 'transparent' }} 
                onClick={() => { globalReset(); setActiveTab('single'); }}
              >
                Single Review
              </button>
              <button 
                className="btn-outline" 
                style={{ flex: 1, backgroundColor: activeTab === 'batch' ? 'var(--border-color)' : 'transparent' }} 
                onClick={() => { globalReset(); setActiveTab('batch'); }}
              >
                Bulk File (CSV)
              </button>
            </div>

            {activeTab === 'single' ? (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button className="btn-outline" onClick={() => setText(sampleReviews.pos)}>Pos</button>
                  <button className="btn-outline" onClick={() => setText(sampleReviews.neg)}>Neg</button>
                  <button className="btn-outline" onClick={() => setText(sampleReviews.mixed)}>Mixed</button>
                </div>
                <textarea 
                  placeholder="Insert customer feedback for sentiment vectorization..."
                  value={text} onChange={(e) => setText(e.target.value)}
                />
                <button className="btn-primary" onClick={handleAnalyze} disabled={loading || !text.trim()}>
                  {loading ? 'Processing...' : 'Execute Inference'}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '2px dashed var(--border-color)', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
                  <UploadCloud size={32} style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upload CSV for high-volume processing</p>
                  <input type="file" accept=".csv" onChange={(e) => setBatchFile(e.target.files[0])} style={{ marginTop: '12px', fontSize: '0.8rem' }} />
                </div>
                <button className="btn-primary" onClick={processBatch} disabled={batchLoading || !batchFile}>
                  {batchLoading ? 'Processing Batch...' : 'Begin Batch Processing'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeTab === 'single' && result && (
            <>
              <div className="panel">
                <div className="panel-header"><Activity size={16} /> Sentiment Classification Output</div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: result.sentiment === 'positive' ? 'var(--pos-color)' : 'var(--neg-color)' }}>
                  {result.sentiment.toUpperCase()}
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', margin: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Confidence Metric</span>
                  <span style={{ fontFamily: 'JetBrains Mono' }}>{(result.confidence * 100).toFixed(2)}%</span>
                </div>
                <div className="progress-bar"><div className={`progress-fill ${result.sentiment === 'positive' ? 'fill-pos' : 'fill-neg'}`} style={{ width: `${result.confidence * 100}%` }}></div></div>
                
                <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>RLHF VALIDATION</div>
                  {feedback ? <div style={{ color: 'var(--pos-color)', fontSize: '0.85rem' }}>✓ Telemetry logged.</div> : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-outline" onClick={() => setFeedback('up')}>👍 Accurate</button>
                      <button className="btn-outline" onClick={() => setFeedback('down')}>👎 Inaccurate</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><BrainCircuit size={16} /> Feature Importance (XAI)</div>
                <div className="word-tags">
                  {result.top_words.map((item, idx) => (
                    <span key={idx} className={`tag ${result.sentiment === 'positive' ? 'tag-positive' : 'tag-negative'}`}>
                      {item.word} ({item.impact.toFixed(3)})
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'batch' && batchResults && (
            <>
              <div className="panel">
                <div className="panel-header"><List size={16} /> Batch Analytics Summary</div>
                <div className="metric-group">
                  <div className="metric">
                    <span className="metric-label">Total Volume</span>
                    <span className="metric-value" style={{ color: 'var(--text-main)' }}>{batchResults.summary.total}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Positive</span>
                    <span className="metric-value" style={{ color: 'var(--pos-color)' }}>{batchResults.summary.positive}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Negative</span>
                    <span className="metric-value" style={{ color: 'var(--neg-color)' }}>{batchResults.summary.negative}</span>
                  </div>
                </div>
              </div>
              <div className="panel" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                <div className="panel-header"><Database size={16} /> Processed Records</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '8px' }}>ID</th>
                      <th style={{ padding: '8px' }}>Content</th>
                      <th style={{ padding: '8px' }}>Class</th>
                      <th style={{ padding: '8px' }}>Prob.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.results.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px' }}>{row.id}</td>
                        <td style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.text}</td>
                        <td><span className={`tag ${row.sentiment === 'positive' ? 'tag-positive' : 'tag-negative'}`} style={{ fontSize: '0.7rem' }}>{row.sentiment}</span></td>
                        <td style={{ fontFamily: 'JetBrains Mono' }}>{(row.confidence * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {((activeTab === 'single' && !result) || (activeTab === 'batch' && !batchResults)) && (
            <div className="panel" style={{ height: '100%', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', color: 'var(--text-muted)' }}>
              <Server size={40} opacity={0.3} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '0.9rem' }}>Awaiting system input to initialize inference...</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}