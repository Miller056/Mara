
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { Artifact } from '../types';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    onClick: () => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    onClick 
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);
    const [feedback, setFeedback] = useState<'helpful' | 'unhelpful' | null>(() => {
        const saved = localStorage.getItem(`adhci-feedback-${artifact.id}`);
        return (saved === 'helpful' || saved === 'unhelpful') ? saved : null;
    });

    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    const handleFeedback = (e: React.MouseEvent, type: 'helpful' | 'unhelpful') => {
        e.stopPropagation();
        const newValue = feedback === type ? null : type;
        setFeedback(newValue);
        if (newValue) {
            localStorage.setItem(`adhci-feedback-${artifact.id}`, newValue);
        } else {
            localStorage.removeItem(`adhci-feedback-${artifact.id}`);
        }
    };

    const isStreaming = artifact.status === 'streaming';

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isStreaming ? 'generating' : ''}`}
            onClick={onClick}
            role="button"
            aria-pressed={isFocused}
            aria-labelledby={`title-${artifact.id}`}
            aria-busy={isStreaming}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        >
            <div className="artifact-header">
                <span id={`title-${artifact.id}`} className="artifact-style-tag">
                    {artifact.styleName} {isStreaming ? '(Creating...)' : ''}
                </span>
            </div>
            <div className="artifact-card-inner">
                {isStreaming && (
                    <div className="generating-overlay" aria-hidden="true">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}
                <iframe 
                    srcDoc={artifact.html} 
                    title={`Interactive Tool: ${artifact.styleName}`} 
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                    className="artifact-iframe"
                    aria-hidden={isStreaming}
                />
            </div>
            <div className="artifact-footer" onClick={(e) => e.stopPropagation()}>
                <span className="feedback-label">Was this helpful?</span>
                <div className="feedback-actions">
                    <button 
                        className={`feedback-btn ${feedback === 'helpful' ? 'active' : ''}`}
                        onClick={(e) => handleFeedback(e, 'helpful')}
                        aria-label={`Mark ${artifact.styleName} as helpful`}
                        aria-pressed={feedback === 'helpful'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M7 10v12" />
                            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                        </svg>
                    </button>
                    <button 
                        className={`feedback-btn ${feedback === 'unhelpful' ? 'active' : ''}`}
                        onClick={(e) => handleFeedback(e, 'unhelpful')}
                        aria-label={`Mark ${artifact.styleName} as not helpful`}
                        aria-pressed={feedback === 'unhelpful'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17 14V2" />
                            <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ArtifactCard;
S