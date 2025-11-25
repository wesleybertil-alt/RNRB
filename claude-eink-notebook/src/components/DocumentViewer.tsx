import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import type { Document, Mode } from '../types';
import { forceEinkRefresh, isPenInput } from '../lib/eink-utils';

const STAGE_ORDER: Mode[] = ['draft', 'research', 'synthesis', 'writing'];
const STAGE_LABELS: Record<Mode, string> = {
  draft: 'Draft',
  research: 'Research',
  synthesis: 'Synthesis',
  writing: 'Writing'
};

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const { promoteDocument, updateDocument, deleteDocument, documents } = useDocumentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(document.content);
  const [editedTitle, setEditedTitle] = useState(document.title);
  const [showLineage, setShowLineage] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // E-ink refresh on modal open
  useEffect(() => {
    forceEinkRefresh(modalRef.current);
  }, []);

  // Handle scroll end for e-ink
  const handleScrollEnd = useCallback(() => {
    forceEinkRefresh(contentRef.current);
  }, []);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScrollEnd]);

  // Stylus support for editing
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPenInput(e.nativeEvent)) {
      forceEinkRefresh(textareaRef.current);
    }
  }, []);

  const nextStage = (() => {
    const currentIndex = STAGE_ORDER.indexOf(document.currentStage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      return STAGE_ORDER[currentIndex + 1];
    }
    return null;
  })();

  const handleSaveEdit = () => {
    updateDocument(document.id, {
      title: editedTitle,
      content: editedContent
    });
    setIsEditing(false);
  };

  const handlePromote = () => {
    if (nextStage) {
      promoteDocument(document.id, nextStage);
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument(document.id);
      onClose();
    }
  };

  // Get lineage documents
  const lineageDocuments = document.stageHistory
    .map(h => documents.find(d => d.id === h.documentId))
    .filter((d): d is Document => d !== undefined);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-50"
        onClick={onClose}
        style={{ touchAction: 'manipulation' }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed inset-2 md:inset-8 bg-white border-2 border-black z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-black">
          <div className="flex justify-between items-start mb-2">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 border-2 border-black p-2 font-serif font-semibold text-lg mr-4 min-h-[48px]"
                style={{ touchAction: 'manipulation' }}
              />
            ) : (
              <h2 className="font-serif font-semibold text-lg flex-1">{document.title}</h2>
            )}
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center text-xl touch-target"
              style={{ touchAction: 'manipulation' }}
              aria-label="Close document"
            >
              ×
            </button>
          </div>

          {/* Stage indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold uppercase tracking-wide">Stage:</span>
            <span className="px-2 py-1 border-2 border-black">
              {STAGE_LABELS[document.currentStage]}
            </span>
            {document.stageHistory.length > 0 && (
              <button
                onClick={() => setShowLineage(!showLineage)}
                className="text-gray-600 underline min-h-[32px] px-2"
              >
                {showLineage ? 'Hide' : 'Show'} Lineage ({document.stageHistory.length})
              </button>
            )}
          </div>

          {/* Lineage view */}
          {showLineage && document.stageHistory.length > 0 && (
            <div className="mt-4 p-3 bg-[#F5F5F5] border-2 border-black">
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-2">Document Lineage</h3>
              <div className="space-y-2">
                {document.stageHistory.map((h, index) => {
                  const histDoc = lineageDocuments[index];
                  return (
                    <div key={h.documentId} className="flex items-center gap-2 text-sm">
                      <span className="w-20 font-semibold">{STAGE_LABELS[h.stage]}:</span>
                      <span className="text-gray-600">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </span>
                      {histDoc && (
                        <span className="text-gray-500 truncate flex-1">
                          ({histDoc.content.substring(0, 50)}...)
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="w-20">{STAGE_LABELS[document.currentStage]}:</span>
                  <span>Current</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-4 scrollable"
          style={{
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onPointerUp={handlePointerUp}
              className="w-full h-full min-h-[300px] border-2 border-black p-4 font-serif resize-none stylus-input"
              style={{
                touchAction: 'pan-y pinch-zoom',
                WebkitUserSelect: 'text',
                userSelect: 'text',
              }}
            />
          ) : (
            <div
              className="font-serif whitespace-pre-wrap leading-relaxed selectable-text"
              style={{
                WebkitUserSelect: 'text',
                userSelect: 'text',
              }}
            >
              {document.content}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(document.content);
                  setEditedTitle(document.title);
                }}
                className="py-2 px-4 border-2 border-black min-h-[48px] touch-target"
                style={{ touchAction: 'manipulation' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="py-2 px-4 border-2 border-black bg-black text-white font-semibold min-h-[48px] touch-target"
                style={{ touchAction: 'manipulation' }}
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="py-2 px-4 border-2 border-black min-h-[48px] touch-target"
                style={{ touchAction: 'manipulation' }}
              >
                Edit
              </button>
              {nextStage && (
                <button
                  onClick={handlePromote}
                  className="py-2 px-4 border-2 border-black bg-black text-white font-semibold min-h-[48px] touch-target"
                  style={{ touchAction: 'manipulation' }}
                >
                  Promote to {STAGE_LABELS[nextStage]} →
                </button>
              )}
              <button
                onClick={handleDelete}
                className="py-2 px-4 border-2 border-black text-gray-600 min-h-[48px] ml-auto touch-target"
                style={{ touchAction: 'manipulation' }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
