import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDown, ArrowRight, AudioLines, Check, CheckCircle2,
  ChevronRight, Clock3, FileImage, MessageCircle, Play, RotateCcw,
  SkipForward, Sparkles, Volume2
} from 'lucide-react';
import './clue-journey.css';

const CLUE_TYPES = {
  chat: { label: 'MESSAGE RECORD', short: 'CHAT', Icon: MessageCircle },
  image: { label: 'PHOTO / VISUAL RECORD', short: 'PHOTO', Icon: FileImage },
  audio: { label: 'AUDIO RECORDING', short: 'AUDIO', Icon: AudioLines }
};

function getState(item) {
  if (item?.mediaUrl) return 'ready';
  if (['pending', 'processing', 'failed', 'not_configured'].includes(item?.mediaStatus)) return item.mediaStatus;
  if (item?.type === 'chat') return 'ready';
  return 'not_configured';
}

function EvidenceContents({ item, onImageOpen }) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [audioLoadFailed, setAudioLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
    setAudioLoadFailed(false);
  }, [item?.evidenceId, item?.mediaUrl]);

  if (!item) return null;

  if (item.type === 'chat') {
    const messages = item.content?.messages || [];
    return (
      <div className="cj-chat-wrap">
        <div className="cj-chat-topline">
          <span><MessageCircle size={14} /> RECOVERED MESSAGE THREAD</span>
          <small>FICTIONAL CASE MATERIAL</small>
        </div>
        {messages.length ? (
          <div className="cj-chat-log">
            {messages.map((message, index) => (
              <div className={`cj-chat-message ${index % 2 ? 'is-right' : ''}`} key={`${message.sender}-${index}`}>
                <span>{message.sender || 'Unknown sender'}</span>
                <p>{message.text || 'Message content unavailable.'}</p>
                <time>{message.time || 'TIME NOT RECORDED'}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="cj-content-fallback">
            <MessageCircle size={22} />
            <b>Message contents were not returned</b>
            <p>{item.content?.description || item.teaser || 'The evidence record is present, but the message thread is empty.'}</p>
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'image') {
    const description = item.content?.description || item.description || item.teaser || 'No scene description was supplied in this evidence record.';
    const status = getState(item);
    const canShowImage = Boolean(item.mediaUrl) && !imageLoadFailed;
    return (
      <div className="cj-image-detail">
        {canShowImage ? (
          <button className="cj-generated-image" type="button" onClick={() => onImageOpen?.(item.mediaUrl, item.title)}>
            <img
              src={item.mediaUrl}
              alt={`Fictional reconstruction for ${item.title}`}
              onError={() => setImageLoadFailed(true)}
            />
            <span>OPEN FULL-SIZE IMAGE <ChevronRight size={14} /></span>
          </button>
        ) : (
          <div className={`cj-image-pending cj-state-${imageLoadFailed ? 'failed' : status}`}>
            <div className="cj-image-placeholder-art">
              <FileImage size={38} />
              <span>{imageLoadFailed ? 'IMAGE FILE UNAVAILABLE' : 'VISUAL EVIDENCE RECORD'}</span>
              <small>{imageLoadFailed ? 'Recovered description shown at right' : 'SCENE RECONSTRUCTION'}</small>
            </div>
            <div className="cj-image-pending-copy">
              <b>{imageLoadFailed ? 'The image could not be loaded' : status === 'processing' ? 'Preparing the scene' : status === 'pending' ? 'Scene queued for generation' : status === 'failed' ? 'Image generation unavailable' : 'Visual reconstruction not attached'}</b>
              <p>{description}</p>
              <small>{imageLoadFailed
                ? 'The saved media link did not load. The original evidence description is preserved below.'
                : status === 'failed'
                  ? 'The image provider did not return a file. The evidence description remains available for investigation.'
                  : 'No generated image file is attached to this clue yet. The scene description below is the case source material.'}</small>
            </div>
          </div>
        )}
        <div className="cj-evidence-caption">
          <span>RECOVERED SCENE DESCRIPTION</span>
          <p>{description}</p>
        </div>
        <div className="cj-fiction-note">FICTIONAL CASE MATERIAL — A MISSING IMAGE IS NOT A MISSING EVIDENCE RECORD</div>
      </div>
    );
  }

  const transcript = item.transcript || item.content?.transcript || item.teaser || 'No transcript was supplied in this evidence record.';
  const canPlayAudio = Boolean(item.mediaUrl) && !audioLoadFailed;
  return (
    <div className="cj-audio-detail">
      {canPlayAudio ? (
        <div className="cj-audio-player">
          <div className="cj-audio-player-icon"><AudioLines size={24} /><span>VOICE EVIDENCE</span></div>
          <audio controls preload="metadata" src={item.mediaUrl} onError={() => setAudioLoadFailed(true)}>
            Your browser does not support audio playback.
          </audio>
          <div className="cj-audio-meta"><span><Volume2 size={13} /> FICTIONAL RECORDING</span><span>CASE AUDIO</span></div>
        </div>
      ) : (
        <div className="cj-audio-unavailable">
          <AudioLines size={25} />
          <div>
            <b>{audioLoadFailed ? 'Audio file could not be loaded' : 'Recovered transcript available'}</b>
            <span>{audioLoadFailed
              ? 'The recording link failed, but the original transcript is preserved below.'
              : 'No playable audio file is attached. You can still inspect the recovered words below.'}</span>
          </div>
        </div>
      )}
      <div className="cj-transcript">
        <span>RECOVERED TRANSCRIPT</span>
        <p>“{transcript}”</p>
      </div>
      <div className="cj-fiction-note">FICTIONAL GAME AUDIO — TRANSCRIPT REMAINS AVAILABLE WITHOUT AN AUDIO FILE</div>
    </div>
  );
}

export default function ClueJourney({
  evidence = [],
  discoveredIds = [],
  selected = null,
  busyEvidence = '',
  onInspect,
  onClearSelection,
  onImageOpen
}) {
  const [skippedIds, setSkippedIds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [enteredSteps, setEnteredSteps] = useState(() => new Set([0]));
  const stepRefs = useRef([]);
  const evidenceKey = evidence.map(item => item.evidenceId).join('|');
  const discovered = useMemo(() => new Set(discoveredIds), [discoveredIds]);
  const total = evidence.length;
  const reviewedInView = evidence.filter(item => discovered.has(item.evidenceId) || item.discovered).length;
  const visibleProgress = total ? Math.round(((Math.min(activeIndex + 1, total)) / total) * 100) : 0;

  useEffect(() => {
    stepRefs.current = stepRefs.current.slice(0, evidence.length);
    setActiveIndex(0);
    setEnteredSteps(new Set([0]));

    const nodes = stepRefs.current.filter(Boolean);
    if (!('IntersectionObserver' in window)) {
      setEnteredSteps(new Set(nodes.map((_, index) => index)));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      const newlyVisible = entries.filter(entry => entry.isIntersecting);
      if (!newlyVisible.length) return;
      setEnteredSteps(current => {
        const next = new Set(current);
        newlyVisible.forEach(entry => {
          const index = Number(entry.target.dataset.stepIndex);
          if (Number.isFinite(index)) next.add(index);
        });
        return next;
      });
    }, { root: null, rootMargin: '-12% 0px -18% 0px', threshold: [0.01, 0.16, 0.35, 0.6] });

    nodes.forEach(node => observer.observe(node));

    // Keep the active clue tied to the viewport, not just the observer's last callback.
    const updateActiveClue = () => {
      const anchor = window.innerHeight * 0.43;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      stepRefs.current.forEach((node, index) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const center = rect.top + Math.min(rect.height, window.innerHeight * 0.8) / 2;
        const distance = Math.abs(center - anchor);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      setActiveIndex(current => current === nearestIndex ? current : nearestIndex);
    };

    window.addEventListener('scroll', updateActiveClue, { passive: true });
    window.addEventListener('resize', updateActiveClue);
    updateActiveClue();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateActiveClue);
      window.removeEventListener('resize', updateActiveClue);
    };
  }, [evidenceKey]);

  function scrollToStep(index) {
    const bounded = Math.max(0, Math.min(index, total - 1));
    const target = stepRefs.current[bounded];
    if (target) {
      setActiveIndex(bounded);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function skipStep(item, index) {
    setSkippedIds(current => current.includes(item.evidenceId) ? current : [...current, item.evidenceId]);
    if (selected?.evidenceId === item.evidenceId) onClearSelection?.();
    if (index < total - 1) scrollToStep(index + 1);
    else document.getElementById('cj-finish')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function inspectStep(item, index) {
    setActiveIndex(index);
    setSkippedIds(current => current.filter(id => id !== item.evidenceId));
    await onInspect?.(item);
    window.setTimeout(() => {
      const detail = stepRefs.current[index]?.querySelector('.cj-clue-detail');
      detail?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  function nextStep(index) {
    if (index < total - 1) scrollToStep(index + 1);
    else document.getElementById('cj-finish')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (!total) {
    return <div className="cj-empty"><FileImage size={24} /><b>No evidence in this view</b><span>Change the filters to see the case files.</span></div>;
  }

  return (
    <div className="clue-journey">
      <div className="cj-sticky-progress">
        <div className="cj-sticky-topline">
          <div><span className="cj-eyebrow">FIELDWORK / EVIDENCE SEQUENCE</span><strong>Clue {Math.min(activeIndex + 1, total)} <small>of {total}</small></strong></div>
          <div className="cj-progress-stats"><b>{reviewedInView}</b> reviewed <i /> <b>{skippedIds.length}</b> skipped</div>
        </div>
        <div className="cj-progress-track"><i style={{ width: `${visibleProgress}%` }} /></div>
        <div className="cj-scroll-cue">
          <span className="cj-scroll-prompt"><ArrowDown size={13} /> SCROLL TO REVEAL THE NEXT FILE</span>
          <span className="cj-scroll-current" aria-live="polite">NOW VIEWING: {evidence[Math.min(activeIndex, total - 1)]?.title || 'CASE FILE'}</span>
          <span>SKIP ANY CLUE</span>
        </div>
      </div>

      <div className="cj-steps">
        {evidence.map((item, index) => {
          const type = CLUE_TYPES[item.type] || CLUE_TYPES.image;
          const TypeIcon = type.Icon;
          const isReviewed = discovered.has(item.evidenceId) || item.discovered;
          const isSkipped = skippedIds.includes(item.evidenceId) && !isReviewed;
          const isSelected = selected?.evidenceId === item.evidenceId;
          const isBusy = busyEvidence === item.evidenceId;
          const mediaState = getState(item);

          return (
            <section
              className={`cj-step ${activeIndex === index ? 'is-current' : ''} ${enteredSteps.has(index) ? 'is-entered' : 'is-upcoming'} ${isReviewed ? 'is-reviewed' : ''} ${isSkipped ? 'is-skipped' : ''}`}
              key={item.evidenceId}
              data-step-index={index}
              ref={node => { stepRefs.current[index] = node; }}
            >
              <div className="cj-step-rail">
                <span className="cj-step-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="cj-step-line" />
              </div>

              <article className="cj-clue-card">
                <div className="cj-card-topline">
                  <span className={`cj-type-pill cj-type-${item.type}`}><TypeIcon size={14} /> {type.short}</span>
                  <span className="cj-file-code">EVIDENCE / {String(item.evidenceId || '').toUpperCase()}</span>
                  <span className={`cj-state-pill cj-state-pill-${isReviewed ? 'reviewed' : isSkipped ? 'skipped' : mediaState}`}>
                    {isReviewed ? 'REVIEWED' : isSkipped ? 'SKIPPED FOR NOW' : mediaState === 'ready' ? 'AVAILABLE' : mediaState === 'processing' ? 'GENERATING' : mediaState === 'pending' ? 'QUEUED' : mediaState === 'failed' ? 'MEDIA FAILED' : 'DESCRIPTION AVAILABLE'}
                  </span>
                </div>

                <div className="cj-clue-heading">
                  <div>
                    <span className="cj-clue-kicker">CLUE {String(index + 1).padStart(2, '0')} / {total}</span>
                    <h3>{item.title}</h3>
                    <p>{item.teaser || 'A new item has been added to the case file.'}</p>
                  </div>
                  <div className="cj-clue-index-art"><TypeIcon size={25} /><span>{String(index + 1).padStart(2, '0')}</span></div>
                </div>

                {!isReviewed && !isSkipped && (
                  <div className="cj-action-row">
                    <button className="cj-button cj-button-primary" type="button" onClick={() => inspectStep(item, index)} disabled={isBusy}>
                      {isBusy ? <Activity size={15} className="cj-spin" /> : <Play size={14} />}
                      {isBusy ? 'OPENING EVIDENCE…' : 'INSPECT THIS CLUE'}
                    </button>
                    <button className="cj-button cj-button-quiet" type="button" onClick={() => skipStep(item, index)}>
                      <SkipForward size={14} /> SKIP FOR NOW
                    </button>
                  </div>
                )}

                {isSkipped && (
                  <div className="cj-skipped-note">
                    <span>This clue is skipped locally. It is NOT marked as discovered and earns no evidence points.</span>
                    <button type="button" onClick={() => inspectStep(item, index)}><RotateCcw size={13} /> REVIEW THIS CLUE</button>
                  </div>
                )}

                {isReviewed && !isSelected && !item.content && (
                  <div className="cj-reviewed-row">
                    <span><CheckCircle2 size={15} /> This evidence has been added to your investigation progress.</span>
                    <button type="button" onClick={() => inspectStep(item, index)}>REOPEN FILE <ChevronRight size={14} /></button>
                  </div>
                )}

                {(isSelected || (isReviewed && Boolean(item.content))) && (
                  <div className="cj-clue-detail">
                    <EvidenceContents item={isSelected ? selected : item} onImageOpen={onImageOpen} />
                    <div className="cj-detail-actions">
                      <span><Check size={14} /> {isSelected ? 'EVIDENCE OPENED · PROGRESS RECORDED' : 'PREVIOUSLY REVIEWED · MATERIAL RESTORED'}</span>
                      <button type="button" onClick={() => nextStep(index)}>
                        {index < total - 1 ? 'CONTINUE TO NEXT CLUE' : 'FINISH EVIDENCE REVIEW'}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {isReviewed && !isSelected && (
                  <button className="cj-continue-link" type="button" onClick={() => nextStep(index)}>
                    CONTINUE SCROLLING <ArrowDown size={13} />
                  </button>
                )}
              </article>
            </section>
          );
        })}
      </div>

      <div className="cj-finish" id="cj-finish">
        <div className="cj-finish-icon"><Sparkles size={20} /></div>
        <div className="cj-finish-copy">
          <span className="cj-eyebrow">END OF EVIDENCE SEQUENCE</span>
          <h3>Ready to make your next move?</h3>
          <p>{reviewedInView} of {total} visible clues reviewed. {skippedIds.length ? `${skippedIds.length} skipped clue(s) remain available above.` : 'You can revisit any clue before accusing a suspect.'}</p>
        </div>
        <button className="cj-button cj-button-outline" type="button" onClick={() => scrollToStep(0)}><RotateCcw size={14} /> BACK TO FIRST CLUE</button>
      </div>
      <div className="cj-score-note">Only inspected evidence counts towards your investigation score. Skipping is always allowed.</div>
    </div>
  );
}

