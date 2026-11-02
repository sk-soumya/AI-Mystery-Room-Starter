import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowLeft, ArrowRight, AudioLines,
  BadgeCheck, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight,
  Clock3, FileImage, Fingerprint, Image as ImageIcon, Lightbulb, LoaderCircle,
  LockKeyhole, Menu, MessageCircle, Play, Radio, Search, Shield, ShieldAlert,
  Sparkles, Target, UserRound, Volume2, X, Zap, Sun, CloudSun, Moon
} from 'lucide-react';
import { api } from './api';
import ClueJourney from './ClueJourney';

const DIFFICULTIES = [
  { id: 'easy', name: 'Easy', suspects: 3, evidence: 5, hints: 2, label: 'A clear trail to follow', score: 100, tone: 'mint', description: 'A focused case with a few moving parts.' },
  { id: 'medium', name: 'Medium', suspects: 4, evidence: 7, hints: 3, label: 'A tangled investigation', score: 150, tone: 'amber', description: 'Conflicting alibis and carefully placed red herrings.' },
  { id: 'hard', name: 'Hard', suspects: 5, evidence: 9, hints: 3, label: 'For sharp-eyed detectives', score: 200, tone: 'rose', description: 'A layered case where every minute matters.' }
];

const TYPE_META = {
  chat: { label: 'Message evidence', short: 'CHAT', icon: MessageCircle },
  image: { label: 'Photographic evidence', short: 'PHOTO', icon: FileImage },
  audio: { label: 'Audio recording', short: 'AUDIO', icon: AudioLines }
};

const SCENARIO_PRESETS = [
  {
    title: 'The locked office',
    text: 'A technology company CEO is found missing from a locked penthouse office at 11:45 PM. Three employees had access to the floor. The security cameras went dark for exactly seven minutes, and a deleted message was recovered from the office tablet.'
  },
  {
    title: 'The gallery theft',
    text: 'A priceless miniature disappears from a private gallery during a thunderstorm. The display room was locked, but the maintenance corridor was briefly accessible. Three staff members give conflicting accounts of where they were.'
  },
  {
    title: 'The midnight call',
    text: 'A hotel owner receives a silent phone call at midnight, and a valuable key vanishes from the front desk minutes later. A voicemail, a corridor photograph and a staff group chat may reveal who entered the restricted wing.'
  }
];

const GENERATION_STAGES = [
  'Reading the premise',
  'Building suspect profiles',
  'Connecting the timeline',
  'Preparing the evidence board',
  'Sealing the solution'
];

function getMediaState(evidence) {
  if (evidence?.mediaUrl) return 'ready';
  if (['pending', 'processing', 'failed', 'not_configured'].includes(evidence?.mediaStatus)) return evidence.mediaStatus;
  if (evidence?.type === 'chat') return 'ready';
  return 'not_configured';
}

function mediaText(evidence) {
  const status = getMediaState(evidence);
  if (status === 'ready') return evidence.type === 'chat' ? 'CHAT LOG READY' : 'MEDIA READY';
  if (status === 'pending') return 'QUEUED FOR GENERATION';
  if (status === 'processing') return 'GENERATING IN BACKGROUND';
  if (status === 'failed') return 'GENERATION FAILED';
  return 'TRANSCRIPT / DESCRIPTION AVAILABLE';
}

const SHADE_MODES = [
  { id: 'cloud', label: 'CLOUD', detail: 'Cool, crisp white', Icon: Sun },
  { id: 'sand', label: 'WARM', detail: 'Soft paper warmth', Icon: CloudSun },
  { id: 'mist', label: 'MIST', detail: 'Calm green-grey', Icon: Moon }
];

function Shell({ children, compact = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shadePickerOpen, setShadePickerOpen] = useState(false);
  const [shade, setShade] = useState(() => {
    try {
      const saved = window.localStorage.getItem('casefile-view-shade');
      return SHADE_MODES.some(mode => mode.id === saved) ? saved : 'cloud';
    } catch {
      return 'cloud';
    }
  });
  const activeShade = SHADE_MODES.find(mode => mode.id === shade) || SHADE_MODES[0];
  const ShadeIcon = activeShade.Icon;

  useEffect(() => {
    try { window.localStorage.setItem('casefile-view-shade', shade); } catch { /* Storage may be disabled. */ }
  }, [shade]);

  function chooseShade(nextShade) {
    setShade(nextShade);
    setShadePickerOpen(false);
  }

  return (
    <div className="app-shell" data-shade={shade}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Casefile home">
          <span className="brand-mark"><Fingerprint size={19} /></span>
          <span className="brand-word">CASE<span>FILE</span><small>AI MYSTERY ROOM</small></span>
        </Link>
        <nav className={`top-nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>The Room</Link>
          <Link to="/create" onClick={() => setMenuOpen(false)}>Create a case</Link>
          <span className="nav-status"><i /> SYSTEM ONLINE</span>
        </nav>
        <div className="topbar-right">
          <div className="shade-control">
            <button className="shade-toggle" type="button" onClick={() => setShadePickerOpen(open => !open)} title="Choose a page shade" aria-label={`Choose page shade. Current shade: ${activeShade.label}`} aria-expanded={shadePickerOpen} aria-controls="shade-picker">
              <ShadeIcon size={15} />
              <span>PAGE SHADE / {activeShade.label}</span>
              <i className={`shade-swatch shade-swatch-${shade}`} />
              <ChevronDown size={12} className={shadePickerOpen ? 'rotate-180' : ''} />
            </button>
            {shadePickerOpen && (
              <div className="shade-picker" id="shade-picker" role="group" aria-label="Select page shade">
                <span className="shade-picker-label">CHOOSE YOUR VIEW</span>
                {SHADE_MODES.map(mode => {
                  const ModeIcon = mode.Icon;
                  return (
                    <button key={mode.id} type="button" className={`shade-option ${shade === mode.id ? 'is-selected' : ''}`} onClick={() => chooseShade(mode.id)} aria-pressed={shade === mode.id}>
                      <span className={`shade-option-swatch shade-swatch-${mode.id}`}><ModeIcon size={14} /></span>
                      <span><b>{mode.label}</b><small>{mode.detail}</small></span>
                      {shade === mode.id && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <span className="system-pill"><i /> LIVE INVESTIGATION SYSTEM</span>
          <button className="mobile-menu" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle navigation">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>
      <main className={compact ? 'main-compact' : ''}>{children}</main>
      <footer className="footer">
        <span>CASEFILE / AI MYSTERY ROOM</span>
        <span><Shield size={12} /> ALL CASES & EVIDENCE ARE FICTIONAL</span>
      </footer>
    </div>
  );
}

function Home() {
  return (
    <Shell>
      <section className="hero hero-redesign">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> AN INTERACTIVE DETECTIVE EXPERIENCE</div>
          <h1>Every clue has<br />a <em>story.</em><br />Every story has a secret.</h1>
          <p className="hero-text">Step inside a case built around your imagination. Inspect messages, examine photographic evidence, listen to fictional recordings and decide who is telling the truth.</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" to="/create"><Sparkles size={17} /> CREATE YOUR MYSTERY <ArrowRight size={17} /></Link>
            <span className="hero-note"><LockKeyhole size={14} /> The culprit stays sealed until your accusation.</span>
          </div>
          <div className="hero-stats">
            <div><strong>03—05</strong><span>SUSPECTS</span></div>
            <div><strong>05—09</strong><span>EVIDENCE FILES</span></div>
            <div><strong>01</strong><span>HIDDEN CULPRIT</span></div>
          </div>
        </div>
        <div className="hero-art" aria-label="Illustration of a classified case file">
          <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
          <div className="hero-glow" />
          <div className="case-file-card">
            <div className="file-top"><span>CONFIDENTIAL / CASE FILE</span><span className="redacted">CLASSIFIED</span></div>
            <div className="file-stamp"><Fingerprint size={58} /><span>UNSOLVED</span></div>
            <div className="file-lines"><i /><i /><i /><i /></div>
            <div className="file-bottom"><span>THE TRUTH IS<br />IN THE DETAILS</span><span className="file-number">#001</span></div>
          </div>
          <div className="floating-note note-left"><MessageCircle size={17} /><span>RECOVERED CHAT<br /><b>11:42 PM</b></span></div>
          <div className="floating-note note-right"><AudioLines size={17} /><span>VOICE EVIDENCE<br /><b>00:18 SEC</b></span></div>
          <div className="floating-chip chip-top"><span className="pulse-dot" /> EVIDENCE INCOMING</div>
          <div className="pin pin-one" /><div className="pin pin-two" /><div className="pin pin-three" />
        </div>
      </section>

      <section className="how-section how-redesign">
        <div className="section-heading"><div className="eyebrow centered">THE INVESTIGATION LOOP</div><h2>Three moves. One truth.</h2><p>Every case is assembled around the premise you provide.</p></div>
        <div className="steps-grid">
          <article className="step-card"><span className="step-no">01 / CREATE</span><div className="step-icon"><BookOpen /></div><h3>Set the scene</h3><p>Give the case a premise, choose a difficulty and let the mystery engine build the suspects and their motives.</p><span className="step-arrow"><ArrowDownRight size={17} /></span></article>
          <article className="step-card"><span className="step-no">02 / INVESTIGATE</span><div className="step-icon"><Search /></div><h3>Follow the evidence</h3><p>Open fictional chat logs, inspect images, listen to recordings and compare every timeline detail.</p><span className="step-arrow"><ArrowDownRight size={17} /></span></article>
          <article className="step-card"><span className="step-no">03 / SOLVE</span><div className="step-icon"><Target /></div><h3>Name the culprit</h3><p>Make one final accusation. Reveal the solution, review the reasoning and see your detective score.</p><span className="step-arrow"><ArrowDownRight size={17} /></span></article>
        </div>
      </section>
      <section className="home-bottom"><div><span className="eyebrow">THE FILE IS WAITING</span><h2>Think you can spot<br />the detail everyone missed?</h2></div><Link to="/create" className="button button-primary">OPEN A NEW CASE <ArrowRight size={16} /></Link></section>
    </Shell>
  );
}

function Create() {
  const [premise, setPremise] = useState('A rare antique watch vanished from a locked hotel suite during a storm. Three people had a reason to enter the corridor, but only one could have known the safe code.');
  const [difficulty, setDifficulty] = useState('easy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(0);
  const [showPresets, setShowPresets] = useState(false);
  const navigate = useNavigate();
  const selected = DIFFICULTIES.find(d => d.id === difficulty) || DIFFICULTIES[0];

  useEffect(() => {
    if (!loading) { setStage(0); return undefined; }
    const timer = setInterval(() => setStage(value => Math.min(value + 1, GENERATION_STAGES.length - 1)), 2300);
    return () => clearInterval(timer);
  }, [loading]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (premise.trim().length < 20) return setError('Add at least 20 characters so the mystery has enough context.');
    setLoading(true);
    try {
      const data = await api.createCase({ premise: premise.trim(), difficulty });
      navigate(`/case/${data.caseId}`);
    } catch (err) {
      setError(err.message || 'The case could not be created. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell compact>
      <div className="page-wrap create-layout">
        <div className="create-heading">
          <Link to="/" className="back-link"><ArrowLeft size={15} /> BACK TO THE ROOM</Link>
          <div className="page-kicker">NEW INVESTIGATION / CASE INTAKE</div>
          <h1 className="page-title">Build your <em>mystery.</em></h1>
          <p className="page-subtitle">Start with a small detail. We'll turn it into a case full of people, motives, timelines and evidence.</p>
        </div>
        <form className="create-panel create-panel-redesign" onSubmit={submit}>
          <div className="form-section-label"><span className="form-step">01</span><div><b>THE CASE PREMISE</b><small>What happened? Where? What feels suspicious?</small></div><span className="character-count">{premise.length}/1200</span></div>
          <textarea id="premise" value={premise} maxLength={1200} onChange={e => setPremise(e.target.value)} placeholder="A priceless object disappeared during a private gallery event..." disabled={loading} />
          <div className="field-help"><Lightbulb size={14} /> Keep the case fictional. Include a location, a time and one suspicious detail.</div>
          <div className="preset-toggle-row"><button type="button" className="text-action" onClick={() => setShowPresets(v => !v)}><Sparkles size={14} /> {showPresets ? 'HIDE STARTING IDEAS' : 'NEED A STARTING IDEA?'} <ChevronDown size={14} className={showPresets ? 'rotate-180' : ''} /></button></div>
          {showPresets && <div className="preset-grid">{SCENARIO_PRESETS.map(preset => <button key={preset.title} type="button" className="preset-card" onClick={() => { setPremise(preset.text); setShowPresets(false); }}><b>{preset.title}</b><span>{preset.text}</span><small>USE THIS PREMISE <ArrowRight size={12} /></small></button>)}</div>}
          <div className="form-divider" />
          <div className="form-section-label"><span className="form-step">02</span><div><b>CHOOSE YOUR DIFFICULTY</b><small>Higher difficulty means more suspects and evidence.</small></div></div>
          <div className="difficulty-grid difficulty-redesign">
            {DIFFICULTIES.map(d => <button type="button" key={d.id} onClick={() => setDifficulty(d.id)} className={`difficulty-card ${difficulty === d.id ? 'selected' : ''} ${d.tone}`} disabled={loading} aria-pressed={difficulty === d.id}>
              <span className="difficulty-topline"><span className="difficulty-check">{difficulty === d.id ? <Check size={13} /> : d.id === 'easy' ? '01' : d.id === 'medium' ? '02' : '03'}</span><span className="difficulty-best">{d.id === 'easy' ? 'STARTER' : d.id === 'hard' ? 'EXPERT' : 'BALANCED'}</span></span>
              <strong>{d.name}</strong><small>{d.label}</small><span className="difficulty-description">{d.description}</span>
              <span className="difficulty-meta"><b>{d.suspects}</b> SUSPECTS <i /> <b>{d.evidence}</b> FILES</span>
            </button>)}
          </div>
          <div className="case-spec-row case-spec-redesign"><div><span>YOUR CASE INCLUDES</span><strong>{selected.suspects} suspects · {selected.evidence} evidence files · {selected.hints} hints</strong></div><div><span>MAX BASE SCORE</span><strong>{selected.score} POINTS</strong></div></div>
          {error && <div className="error-banner"><AlertCircle size={16} /> {error}</div>}
          <button className="button button-primary submit-button" disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
            {loading ? 'ASSEMBLING YOUR CASE...' : 'GENERATE MYSTERY'}
            {!loading && <ArrowRight size={17} />}
          </button>
          {loading && <div className="generation-progress"><div className="generation-progress-top"><span>{GENERATION_STAGES[stage]}</span><span>STEP {stage + 1} / {GENERATION_STAGES.length}</span></div><div className="generation-progress-track"><i style={{ width: `${((stage + 1) / GENERATION_STAGES.length) * 100}%` }} /></div><small>Building the case. Keep this tab open.</small></div>}
          <p className="privacy-note"><LockKeyhole size={13} /> The culprit and solution stay sealed on the server until your accusation.</p>
        </form>
      </div>
    </Shell>
  );
}

function EvidenceViewer({ evidence, onImageOpen }) {
  if (!evidence) {
    return <div className="viewer-empty"><div className="viewer-empty-icon"><Search size={24} /></div><span className="eyebrow centered">EVIDENCE DESK</span><h3>Select a sealed file</h3><p>Open an evidence card to inspect its contents. The smallest detail may change the case.</p><div className="viewer-empty-hint"><LockKeyhole size={13} /> DISCOVERED FILES WILL APPEAR HERE</div></div>;
  }

  const meta = TYPE_META[evidence.type] || TYPE_META.image;
  const Icon = meta.icon;
  const mediaState = getMediaState(evidence);
  const isGenerated = evidence.generationMode !== 'demo';

  return (
    <div className="evidence-viewer evidence-viewer-redesign">
      <div className="viewer-head">
        <div><div className="viewer-type"><Icon size={14} /> {meta.label} <span className="viewer-id">FILE / {String(evidence.evidenceId || '').toUpperCase()}</span></div><h3>{evidence.title}</h3></div>
        <span className={`media-status status-${mediaState}`}>{mediaState === 'ready' ? <CheckCircle2 size={12} /> : mediaState === 'failed' ? <AlertCircle size={12} /> : <Activity size={12} />}{mediaText(evidence)}</span>
      </div>
      <div className="viewer-content viewer-content-redesign">
        {evidence.type === 'chat' ? (
          <div className="chat-viewer-wrap"><div className="chat-device"><div className="chat-device-top"><span className="chat-device-dot" /><b>RECOVERED CONVERSATION</b><span>END-TO-END / FICTIONAL</span></div><div className="chat-log">{(evidence.content?.messages || []).map((message, index) => <div className={`chat-message ${index % 2 ? 'outgoing' : 'incoming'}`} key={`${message.sender}-${index}`}><span className="chat-sender">{message.sender}</span><p>{message.text}</p><time>{message.time}</time></div>)}</div><div className="chat-device-bottom"><LockKeyhole size={11} /> ARCHIVED MESSAGE THREAD</div></div></div>
        ) : evidence.type === 'image' ? (
          <div className="image-evidence image-evidence-redesign">
            {evidence.mediaUrl ? <button className="evidence-image-button" type="button" onClick={() => onImageOpen(evidence.mediaUrl, evidence.title)}><img src={evidence.mediaUrl} alt={`Fictional evidence: ${evidence.title}`} /><span><ImageIcon size={13} /> OPEN FULL IMAGE</span></button> : <div className={`media-placeholder ${mediaState}`}><div className="media-placeholder-icon">{mediaState === 'processing' || mediaState === 'pending' ? <LoaderCircle className="spin" size={34} /> : <FileImage size={35} />}</div><b>{mediaState === 'pending' ? 'IMAGE QUEUED' : mediaState === 'processing' ? 'GENERATING FORENSIC IMAGE' : mediaState === 'failed' ? 'IMAGE GENERATION FAILED' : 'IMAGE NOT AVAILABLE'}</b><p>{mediaState === 'pending' || mediaState === 'processing' ? 'The case is open. Your visual evidence is being prepared in the background.' : mediaState === 'failed' ? 'The image provider returned an error. The evidence description remains available.' : 'This case has a text description, but no generated image file is attached.'}</p><span className="placeholder-foot"><Radio size={12} /> {isGenerated ? 'AI CASE / MEDIA NOT YET ATTACHED' : 'DEMO CASE / SAMPLE MEDIA NOT GENERATED'}</span></div>}
            <p className="evidence-description">{evidence.content?.description || evidence.teaser}</p>
          </div>
        ) : (
          <div className="audio-evidence audio-evidence-redesign">
            {evidence.mediaUrl ? <div className="audio-player-card"><div className="audio-player-art"><AudioLines size={28} /><span>VOICE EVIDENCE</span></div><audio controls preload="metadata" src={evidence.mediaUrl}>Your browser does not support audio playback.</audio><div className="audio-player-meta"><span><Volume2 size={12} /> FICTIONAL RECORDING</span><span>MP3 / CASE EVIDENCE</span></div></div> : <div className={`media-placeholder audio-placeholder-redesign ${mediaState}`}><div className="media-placeholder-icon">{mediaState === 'processing' || mediaState === 'pending' ? <LoaderCircle className="spin" size={32} /> : <AudioLines size={31} />}</div><b>{mediaState === 'pending' ? 'AUDIO QUEUED' : mediaState === 'processing' ? 'GENERATING VOICE RECORDING' : mediaState === 'failed' ? 'AUDIO GENERATION FAILED' : 'TRANSCRIPT AVAILABLE'}</b><p>{mediaState === 'pending' || mediaState === 'processing' ? 'The fictional recording is being prepared in the background.' : mediaState === 'failed' ? 'The voice provider returned an error. Read the recovered transcript below.' : 'No audio file is attached. The fictional transcript is preserved for investigation.'}</p></div>}
            <div className="transcript transcript-redesign"><div><span>TRANSCRIPT / FICTIONAL RECORDING</span><small><BadgeCheck size={12} /> VERIFIED CASE CONTENT</small></div><p>“{evidence.transcript || evidence.content?.transcript || evidence.teaser}”</p></div>
          </div>
        )}
      </div>
      <div className="viewer-footer"><BadgeCheck size={14} /> FICTIONAL GAME EVIDENCE — NEVER REAL-WORLD RECORDS <span>{mediaState === 'ready' ? 'FILE READY' : mediaState.toUpperCase()}</span></div>
    </div>
  );
}

function Investigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyEvidence, setBusyEvidence] = useState('');
  const [showAccuse, setShowAccuse] = useState(false);
  const [suspect, setSuspect] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [mobileTab, setMobileTab] = useState('evidence');
  const [showTimeline, setShowTimeline] = useState(false);
  const [expandedSuspect, setExpandedSuspect] = useState('');
  const [imageModal, setImageModal] = useState(null);

  const load = useCallback(async (quiet = false) => {
    try {
      const fresh = await api.getCase(id);
      setData(fresh);
      if (fresh.status === 'completed') navigate(`/case/${id}/result`);
      setError('');
      return fresh;
    } catch (err) {
      if (!quiet) setError(err.message || 'Unable to load this case.');
      return null;
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const discoveredIds = data?.progress?.discoveredEvidenceIds || [];
  const discovered = discoveredIds.length;
  const total = data?.evidence?.length || 0;
  const hintsUsed = data?.progress?.hintsUsed || 0;
  const percent = total ? Math.round((discovered / total) * 100) : 0;
  const hasMediaInProgress = (data?.evidence || []).some(ev => ['pending', 'processing'].includes(ev.mediaStatus));
  const statusSignature = (data?.evidence || []).map(ev => `${ev.evidenceId}:${ev.mediaStatus || ''}:${ev.mediaUrl || ''}`).join('|');

  useEffect(() => {
    if (!hasMediaInProgress) return undefined;
    let active = true;
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const fresh = await api.getCase(id);
        if (!active || !fresh) return;
        setData(fresh);
        setSelected(current => {
          if (!current) return current;
          const updated = (fresh.evidence || []).find(ev => ev.evidenceId === current.evidenceId);
          return updated ? { ...current, ...updated } : current;
        });
        if (!(fresh.evidence || []).some(ev => ['pending', 'processing'].includes(ev.mediaStatus)) || attempts >= 120) {
          clearInterval(timer);
        }
      } catch (pollError) {
        console.warn('Media status refresh failed:', pollError.message);
        if (attempts >= 120) clearInterval(timer);
      }
    }, 2500);
    return () => { active = false; clearInterval(timer); };
  }, [id, hasMediaInProgress, statusSignature]);

  async function openEvidence(ev) {
    setError('');
    setBusyEvidence(ev.evidenceId);
    setSelected(ev);
    setMobileTab('evidence');
    try {
      const result = await api.discover(id, ev.evidenceId);
      setSelected(current => ({ ...current, ...(result.evidence || {}) }));
      await load(true);
    } catch (err) {
      setError(err.message || 'Evidence could not be opened.');
    } finally {
      setBusyEvidence('');
    }
  }

  async function requestHint() {
    setError('');
    setBusy(true);
    try {
      const response = await api.hint(id);
      setHint(response.hint || 'Review the timeline and compare the alibis again.');
      await load(true);
    } catch (err) {
      setError(err.message || 'Hint request failed.');
    } finally {
      setBusy(false);
    }
  }

  async function accuse(e) {
    e.preventDefault();
    if (!suspect) return;
    setBusy(true);
    setError('');
    try {
      await api.accuse(id, suspect);
      navigate(`/case/${id}/result`);
    } catch (err) {
      setError(err.message || 'Accusation could not be submitted.');
      setBusy(false);
    }
  }

  const filteredEvidence = useMemo(() => {
    const list = data?.evidence || [];
    const term = query.trim().toLowerCase();
    return list.filter(ev => {
      const found = discoveredIds.includes(ev.evidenceId) || ev.discovered;
      const matchesFilter = filter === 'all' || (filter === 'discovered' ? found : ev.type === filter);
      const matchesQuery = !term || `${ev.title} ${ev.teaser} ${ev.type}`.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [data?.evidence, discoveredIds, filter, query]);

  if (error && !data) return <Shell><div className="page-wrap"><div className="error-banner"><AlertCircle size={16} />{error}</div><Link to="/create" className="button button-primary">CREATE ANOTHER CASE</Link></div></Shell>;
  if (!data) return <Shell><div className="loading-screen"><LoaderCircle className="spin" /><span>OPENING CASE FILE...</span></div></Shell>;

  return (
    <Shell compact>
      <div className="investigation-wrap investigation-redesign">
        <div className="investigation-top investigation-top-redesign">
          <div className="case-heading-block">
            <Link to="/" className="back-link"><ArrowLeft size={14} /> ALL CASES</Link>
            <div className="page-kicker">ACTIVE INVESTIGATION / {id.slice(-6).toUpperCase()}</div>
            <h1 className="case-title">{data.title}</h1>
            <p className="case-intro">{data.story}</p>
            <div className="case-meta-row"><span><Clock3 size={13} /> {String(data.difficulty || 'easy').toUpperCase()} CASE</span><span><Fingerprint size={13} /> {data.suspects.length} SUSPECTS</span><span><FileImage size={13} /> {total} EVIDENCE FILES</span></div>
          </div>
          <div className="case-status-card"><div className="case-status"><span className="status-dot" /> CASE OPEN <small>{String(data.difficulty || 'easy').toUpperCase()} MODE</small></div><div className="status-card-bottom"><span>CASE ID</span><b>{id.slice(0, 8).toUpperCase()}</b></div></div>
        </div>

        <section className="progress-card">
          <div className="progress-card-copy"><div><span className="micro-label">INVESTIGATION PROGRESS</span><strong>{discovered}<small> / {total} FILES REVIEWED</small></strong></div><div className="progress-percent">{percent}<small>%</small></div></div>
          <div className="progress-track progress-track-redesign"><i style={{ width: `${percent}%` }} /></div>
          <div className="progress-foot"><span>{total - discovered} files still sealed</span><span>{discovered === total && total > 0 ? 'ALL EVIDENCE REVIEWED' : 'EVERY DETAIL COUNTS'}</span></div>
        </section>

        <div className="investigation-mobile-tabs"><button className={mobileTab === 'evidence' ? 'active' : ''} onClick={() => setMobileTab('evidence')}><Fingerprint size={15} /> EVIDENCE BOARD</button><button className={mobileTab === 'suspects' ? 'active' : ''} onClick={() => setMobileTab('suspects')}><UserRound size={15} /> SUSPECTS ({data.suspects.length})</button></div>

        <div className="investigation-grid investigation-grid-redesign">
          <aside className={`side-panel side-panel-redesign ${mobileTab === 'suspects' ? 'mobile-visible' : ''}`}>
            <div className="panel-title panel-title-redesign"><span><UserRound size={15} /> SUSPECT DOSSIERS</span><b>{data.suspects.length}</b></div>
            <div className="suspect-list suspect-list-redesign">
              {data.suspects.map((s, i) => {
                const initials = String(s.name || 'S').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
                const isExpanded = expandedSuspect === s.suspectId;
                return <article className={`suspect-card suspect-card-redesign ${isExpanded ? 'expanded' : ''}`} key={s.suspectId}>
                  <button className="suspect-card-main" onClick={() => setExpandedSuspect(isExpanded ? '' : s.suspectId)} aria-expanded={isExpanded}>
                    <span className="suspect-avatar">{initials}</span>
                    <span className="suspect-copy"><b>{s.name}</b><small>{s.role}</small><span>{s.description}</span></span>
                    <ChevronDown size={15} className={isExpanded ? 'rotate-180' : ''} />
                  </button>
                  {isExpanded && <blockquote>“{s.publicStatement}”</blockquote>}
                  <div className="suspect-card-index">SUSPECT / {String(i + 1).padStart(2, '0')}</div>
                </article>;
              })}
            </div>
            <div className="hint-box hint-box-redesign">
              <div className="hint-heading"><Lightbulb size={15} /> INVESTIGATOR'S HINTS</div>
              <div className="hint-count"><b>{hintsUsed}</b><span>of {data.hintsAllowed} hints used</span><strong>{Math.max(0, data.hintsAllowed - hintsUsed)} LEFT</strong></div>
              {hint && <div className="hint-revealed"><span>NEW INTELLIGENCE</span><p>{hint}</p></div>}
              <button className="button button-quiet" onClick={requestHint} disabled={busy || hintsUsed >= data.hintsAllowed}><Lightbulb size={14} />{busy ? 'REQUESTING...' : 'REQUEST A HINT'}<span>{Math.max(0, data.hintsAllowed - hintsUsed)} LEFT</span></button>
            </div>
          </aside>

          <section className={`evidence-panel evidence-panel-redesign ${mobileTab === 'evidence' ? 'mobile-visible' : ''}`}>
            <div className="panel-title panel-title-redesign"><span><Fingerprint size={15} /> EVIDENCE BOARD</span><b>{discovered} / {total} FOUND</b></div>
            <div className="evidence-toolbar"><div className="evidence-filters"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>ALL FILES <span>{total}</span></button><button className={filter === 'discovered' ? 'active' : ''} onClick={() => setFilter('discovered')}>REVIEWED <span>{discovered}</span></button><button className={filter === 'chat' ? 'active' : ''} onClick={() => setFilter('chat')}>CHATS</button><button className={filter === 'image' ? 'active' : ''} onClick={() => setFilter('image')}>IMAGES</button><button className={filter === 'audio' ? 'active' : ''} onClick={() => setFilter('audio')}>AUDIO</button></div><label className="evidence-search"><Search size={14} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a clue..." aria-label="Search evidence" /><kbd>/</kbd></label></div>
            <ClueJourney
              evidence={filteredEvidence}
              discoveredIds={discoveredIds}
              selected={selected}
              busyEvidence={busyEvidence}
              onInspect={openEvidence}
              onClearSelection={() => setSelected(null)}
              onImageOpen={(src, title) => setImageModal({ src, title })}
            />
            {data.timeline?.length > 0 && <section className="timeline-panel"><button className="timeline-toggle" onClick={() => setShowTimeline(v => !v)}><span><Clock3 size={15} /> CASE TIMELINE <small>{data.timeline.length} EVENTS</small></span><ChevronDown size={16} className={showTimeline ? 'rotate-180' : ''} /></button>{showTimeline && <div className="timeline-list">{data.timeline.map((event, index) => <article className="timeline-item" key={`${event.time}-${index}`}><time>{event.time}</time><p>{event.event}</p></article>)}</div>}</section>}
          </section>
        </div>

        {error && <div className="error-banner page-error"><AlertCircle size={15} /> {error}</div>}

        <div className="accuse-bar accuse-bar-redesign"><div><div className="accuse-icon"><Target size={19} /></div><div><strong>Ready to make your accusation?</strong><span>Review your evidence before naming the culprit. This decision cannot be undone.</span></div></div><button className="button button-danger" onClick={() => setShowAccuse(true)}><Target size={16} /> ACCUSE A SUSPECT <ArrowRight size={15} /></button></div>
      </div>

      {showAccuse && <div className="modal-backdrop" onClick={() => setShowAccuse(false)}><form className="accuse-modal accuse-modal-redesign" onSubmit={accuse} onClick={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowAccuse(false)} aria-label="Close accusation"><X size={18} /></button><div className="modal-icon"><ShieldAlert size={22} /></div><div className="eyebrow">FINAL DECISION / CASE {id.slice(-6).toUpperCase()}</div><h2>Who did it?</h2><p>Choose the suspect whose story fails to hold up. Once submitted, your accusation is final.</p><div className="accuse-options">{data.suspects.map(s => <label key={s.suspectId} className={suspect === s.suspectId ? 'chosen' : ''}><input type="radio" name="suspect" value={s.suspectId} checked={suspect === s.suspectId} onChange={e => setSuspect(e.target.value)} /><span><b>{s.name}</b><small>{s.role}</small></span>{suspect === s.suspectId && <Check size={16} />}</label>)}</div>{error && <div className="error-banner">{error}</div>}<button className="button button-danger full" disabled={!suspect || busy}>{busy ? 'SUBMITTING...' : 'LOCK IN MY ACCUSATION'}</button></form></div>}
      {imageModal && <div className="image-modal-backdrop" onClick={() => setImageModal(null)}><button className="image-modal-close" onClick={() => setImageModal(null)} aria-label="Close image"><X size={20} /></button><div className="image-modal-content" onClick={e => e.stopPropagation()}><span>{imageModal.title}</span><img src={imageModal.src} alt={imageModal.title} /></div></div>}
    </Shell>
  );
}

function Result() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.result(id).then(setData).catch(err => setError(err.message)); }, [id]);
  if (error) return <Shell><div className="page-wrap"><div className="error-banner"><AlertCircle size={16} /> {error}</div><Link to={`/case/${id}`} className="button button-primary">BACK TO CASE</Link></div></Shell>;
  if (!data) return <Shell><div className="loading-screen"><LoaderCircle className="spin" /><span>UNSEALING THE TRUTH...</span></div></Shell>;
  const r = data.result;
  return (
    <Shell compact>
      <div className="page-wrap narrow result-wrap result-wrap-redesign">
        <div className="result-seal"><Fingerprint size={39} /><span>CASE CLOSED</span></div>
        <div className="eyebrow centered">INVESTIGATION COMPLETE / {id.slice(-6).toUpperCase()}</div>
        <h1 className="result-title">{r.isCorrect ? 'Sharp work, detective.' : 'The truth was hiding in plain sight.'}</h1>
        <p className="result-subtitle">{r.isCorrect ? 'Your accusation was correct. You connected the details and followed the evidence.' : 'Your accusation missed the mark. Review the solution and see where the trail led.'}</p>
        <div className={`verdict-card ${r.isCorrect ? 'correct' : 'incorrect'}`}><span>THE CULPRIT WAS</span><h2>{r.culprit.name}</h2><small>{r.culprit.role}</small><div className="verdict-stamp">{r.isCorrect ? 'CASE SOLVED' : 'REVEALED'}</div></div>
        <div className="score-card score-card-redesign"><div><span>YOUR DETECTIVE SCORE</span><strong>{r.score.total}<small> PTS</small></strong></div><div className="score-breakdown"><span>Correct accusation <b>{r.score.basePoints}</b></span><span>Evidence discovered <b>+{r.score.evidencePoints}</b></span><span>Hints used <b>−{r.score.hintPenalty}</b></span></div></div>
        <section className="solution-card solution-card-redesign"><div className="panel-title panel-title-redesign"><span><BookOpen size={16} /> THE CASE EXPLAINED</span><b>UNSEALED</b></div><h3>{r.solution.title || 'How it happened'}</h3><p>{r.solution.explanation}</p><div className="solution-details"><div><span>MOTIVE</span><p>{r.solution.motive}</p></div><div><span>OPPORTUNITY</span><p>{r.solution.opportunity}</p></div></div><div className="supporting-evidence"><span>KEY EVIDENCE</span>{(r.solution.evidenceReasoning || []).map((line, i) => <p key={i}><Check size={13} /> {line}</p>)}</div></section>
        <Link to="/create" className="button button-primary full"><Sparkles size={17} /> CREATE ANOTHER MYSTERY <ArrowRight size={17} /></Link>
        <Link to={`/case/${id}`} className="revisit-link">REVISIT CASE FILE</Link>
      </div>
    </Shell>
  );
}

export default function App() {
  return <Routes><Route path="/" element={<Home />} /><Route path="/create" element={<Create />} /><Route path="/case/:id" element={<Investigation />} /><Route path="/case/:id/result" element={<Result />} /><Route path="*" element={<Home />} /></Routes>;
}

