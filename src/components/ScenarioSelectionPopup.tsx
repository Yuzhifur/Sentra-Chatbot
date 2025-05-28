import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatService } from '../services/ChatService';
import { FirebaseService } from '../services/FirebaseService';
import './ScenarioSelectionPopup.css';

interface ScenarioSelectionPopupProps {
  characterId: string;
  characterName: string;
  defaultScenario: string;
  onClose: () => void;
}

const ScenarioSelectionPopup: React.FC<ScenarioSelectionPopupProps> = ({
  characterId,
  characterName,
  defaultScenario,
  onClose
}) => {
  const [customScenario, setCustomScenario] = useState<string>(defaultScenario || '');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Set initial scenario from character default
  useEffect(() => {
    setCustomScenario(defaultScenario || '');
  }, [defaultScenario]);

  const handleStartChat = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      setError(null);

      // Create chat with custom scenario (or empty string to use character default)
      const chatId = await ChatService.createChatSession(
        characterId, 
        customScenario.trim() || undefined
      );

      // Close popup
      onClose();

      // Navigate to the new chat
      navigate(`/chat/${characterId}/${chatId}`);
    } catch (error) {
      console.error("Error creating chat with scenario:", error);
      setError(error instanceof Error ? error.message : 'Failed to create chat');
      setIsCreating(false);
    }
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomScenario(e.target.value);
  };

  const resetToDefault = () => {
    setCustomScenario(defaultScenario || '');
  };

  const clearScenario = () => {
    setCustomScenario('');
  };

  return (
    <div className="scenario-popup-overlay" onClick={onClose}>
      <div className="scenario-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="scenario-popup-header">
          <h2>Set Scenario for Chat with {characterName}</h2>
          <button className="scenario-popup-close" onClick={onClose}>×</button>
        </div>

        <div className="scenario-popup-body">
          {error && <div className="scenario-error">{error}</div>}
          
          <div className="scenario-section">
            <label htmlFor="scenario-input" className="scenario-label">
              Chat Scenario (Optional)
            </label>
            <textarea
              id="scenario-input"
              className="scenario-textarea"
              value={customScenario}
              onChange={handleScenarioChange}
              placeholder="Describe the setting, situation, or context for this chat. Leave empty to use the character's default scenario."
              rows={6}
              disabled={isCreating}
            />
            
            <div className="scenario-info">
              <p className="scenario-help-text">
                This scenario will be used for this specific chat only. You can customize it to create unique roleplay situations.
              </p>
              
              {defaultScenario && (
                <div className="default-scenario-preview">
                  <h4>Character's Default Scenario:</h4>
                  <p className="default-scenario-text">{defaultScenario}</p>
                </div>
              )}
            </div>
          </div>

          <div className="scenario-buttons">
            <div className="scenario-buttons-left">
              {defaultScenario && (
                <button
                  type="button"
                  className="scenario-button-secondary"
                  onClick={resetToDefault}
                  disabled={isCreating}
                >
                  Reset to Default
                </button>
              )}
              <button
                type="button"
                className="scenario-button-secondary"
                onClick={clearScenario}
                disabled={isCreating}
              >
                Clear
              </button>
            </div>
            
            <div className="scenario-buttons-right">
              <button
                type="button"
                className="scenario-button-cancel"
                onClick={onClose}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="scenario-button-primary"
                onClick={handleStartChat}
                disabled={isCreating}
              >
                {isCreating ? 'Creating Chat...' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioSelectionPopup;