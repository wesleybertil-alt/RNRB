import React from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useProjectStore } from '../stores/projectStore';
import type { Mode } from '../types';

const STAGE_ORDER: Mode[] = ['draft', 'research', 'synthesis', 'writing'];

interface StageIndicatorProps {
  currentStage: Mode;
  stageHistory: { stage: Mode }[];
}

const StageIndicator: React.FC<StageIndicatorProps> = ({ currentStage, stageHistory }) => {
  const completedStages = new Set(stageHistory.map(h => h.stage));

  return (
    <div className="flex items-center gap-1">
      {STAGE_ORDER.map((stage, index) => {
        const isCurrent = stage === currentStage;
        const isCompleted = completedStages.has(stage);

        return (
          <React.Fragment key={stage}>
            {/* Stage dot */}
            <span
              className={`
                w-2 h-2 rounded-full
                ${isCurrent ? 'bg-black' : 'border border-black bg-white'}
              `}
            />
            {/* Connector line */}
            {index < STAGE_ORDER.length - 1 && (
              <span
                className={`
                  w-2 h-0.5
                  ${isCompleted ? 'bg-black' : 'bg-transparent'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const DocumentList: React.FC = () => {
  const { documents, deleteDocument, promoteDocument } = useDocumentStore();
  const { currentProjectId } = useProjectStore();

  const projectDocuments = documents.filter(d => d.projectId === currentProjectId);

  if (projectDocuments.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="font-serif">No documents yet</p>
      </div>
    );
  }

  const getNextStage = (currentStage: Mode): Mode | null => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      return STAGE_ORDER[currentIndex + 1];
    }
    return null;
  };

  return (
    <div className="divide-y-2 divide-black">
      {projectDocuments.map((doc) => {
        const nextStage = getNextStage(doc.currentStage);

        return (
          <div key={doc.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold truncate flex-1">{doc.title}</h3>
              <StageIndicator
                currentStage={doc.currentStage}
                stageHistory={doc.stageHistory}
              />
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {doc.content.substring(0, 150)}...
            </p>
            <div className="flex gap-2">
              {nextStage && (
                <button
                  onClick={() => promoteDocument(doc.id, nextStage)}
                  className="text-xs px-2 py-1 border border-black min-h-[32px]"
                >
                  → {nextStage}
                </button>
              )}
              <button
                onClick={() => deleteDocument(doc.id)}
                className="text-xs px-2 py-1 border border-black text-gray-600 min-h-[32px]"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
