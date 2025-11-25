import React, { useState } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useProjectStore } from '../stores/projectStore';
import { DocumentViewer } from './DocumentViewer';
import type { Mode, Document } from '../types';

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
  const { documents } = useDocumentStore();
  const { currentProjectId } = useProjectStore();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const projectDocuments = documents.filter(d => d.projectId === currentProjectId);

  if (projectDocuments.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="font-serif">No documents yet</p>
        <p className="text-sm mt-2">Save conversations as documents to track your research</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y-2 divide-black">
        {projectDocuments.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDocument(doc)}
            className="w-full text-left p-4 min-h-[80px]"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold truncate flex-1">{doc.title}</h3>
              <StageIndicator
                currentStage={doc.currentStage}
                stageHistory={doc.stageHistory}
              />
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {doc.content.substring(0, 150)}...
            </p>
          </button>
        ))}
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </>
  );
};
