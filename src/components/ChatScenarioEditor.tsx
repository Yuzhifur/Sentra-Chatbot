import React, { useState, useEffect } from 'react';
import { ChatService } from '../services/ChatService';
import './ChatScenarioEditor.css';

interface ChatScenarioEditorProps {
  chatId: string;
  initialScenario: string;
  characterName: string;
  onScenarioUpdate?: (newScenario: string) => void;
}

const ChatScenarioEditor: React.FC<ChatScenarioEditorProps> = ({
  chatId,
  initialScenario,
  characterName,
  onScenarioUpdate
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [scenario, setScenario] = useState<string>(initialScenario || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setScenario(initialScenario || '');
  }, [initialScenario]);

  const handleEdit = () => {
    setIsEditing(true);
    setIsExpanded(true);
    setError(null);
  };

  const handleCancel = () => {
    setScenario(initialScenario || '');
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      setError(null);

      await ChatService.updateChatScenario(chatId, scenario);
      
      setIsEditing(false);
      
      // Notify parent component if callback provided
      if (onScenarioUpdate) {
        onScenarioUpdate(scenario);
      }
    } catch (error) {
      console.error("Error updating scenario:", error);
      setError(error instanceof Error ? error.message : 'Failed to update scenario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScenario(e.target.value);
  };

  const toggleExpanded = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const displayScenario = scenario || `No specific scenario set for this chat with ${characterName}.`;
  const shouldTruncate = !isExpanded && !isEditing && displayScenario.length > 150;
  const truncatedScenario = shouldTruncate 
    ? displayScenario.substring(0, 150) + '...' 
    : displayScenario;

  return (
    <div className="chat-scenario-editor">
      <div className="scenario-header">
        <h4 className="scenario-title">
          <span className="scenario-icon">🎭</span>
          Current Scenario
        </h4>
        {!isEditing && (
          <button
            className="scenario-edit-btn"
            onClick={handleEdit}
            title="Edit scenario"
          >
            ✏️
          </button>
        )}
      </div>

      {error && <div className="scenario-error">{error}</div>}

      <div className="scenario-content">
        {isEditing ? (
          <div className="scenario-editing">
            <textarea
              className="scenario-textarea"
              value={scenario}
              onChange={handleChange}
              placeholder={`Describe the setting and context for your chat with ${characterName}...`}
              rows={6}
              disabled={isSaving}
            />
            <div className="scenario-edit-actions">
              <button
                className="scenario-save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="scenario-cancel-btn"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="scenario-display">
            <p 
              className={`scenario-text ${shouldTruncate ? 'truncated' : ''}`}
              onClick={toggleExpanded}
            >
              {truncatedScenario}
            </p>
            {shouldTruncate && (
              <button 
                className="scenario-expand-btn"
                onClick={toggleExpanded}
              >
                Show more
              </button>
            )}
            {isExpanded && !shouldTruncate && displayScenario.length > 150 && (
              <button 
                className="scenario-expand-btn"
                onClick={toggleExpanded}
              >
                Show less
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatScenarioEditor;