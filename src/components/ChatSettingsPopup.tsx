// src/components/ChatSettingsPopup.tsx (Updated)
import React, { useState, useEffect } from 'react';
import { CFMService } from '../services/CFMService';
import './ChatSettingsPopup.css';

interface ChatSettingsPopupProps {
  onClose: () => void;
  chatId?: string; // NEW: Add chatId prop
}

type TokenLimit = 256 | 512 | 1024;

const ChatSettingsPopup: React.FC<ChatSettingsPopupProps> = ({ onClose, chatId }) => {
  const [selectedTokenLimit, setSelectedTokenLimit] = useState<TokenLimit>(1024);
  const [isCFMEnabled, setIsCFMEnabled] = useState<boolean>(false);
  const [isEnablingCFM, setIsEnablingCFM] = useState<boolean>(false);
  const [cfmError, setCfmError] = useState<string | null>(null);

  // Load saved token limit from localStorage on component mount
  useEffect(() => {
    const savedTokenLimit = localStorage.getItem('chatTokenLimit');
    if (savedTokenLimit) {
      const limit = parseInt(savedTokenLimit) as TokenLimit;
      if ([256, 512, 1024].includes(limit)) {
        setSelectedTokenLimit(limit);
      }
    }
  }, []);

  // NEW: Check CFM status
  useEffect(() => {
    const checkCFMStatus = async () => {
      if (chatId) {
        const enabled = await CFMService.isCFMEnabled(chatId);
        setIsCFMEnabled(enabled);
      }
    };

    checkCFMStatus();
  }, [chatId]);

  const handleTokenLimitChange = (limit: TokenLimit) => {
    setSelectedTokenLimit(limit);
  };

  // NEW: Handle CFM toggle
  const handleCFMToggle = async () => {
    if (!chatId || isCFMEnabled || isEnablingCFM) return;

    // const confirmed = window.confirm(
    //   'Enable Cross-Friends Memory (CFM) for this chat?\n\n' +
    //   '⚠️ Warning: This action cannot be undone.\n\n' +
    //   'CFM allows your friends to reference memories from this chat when they use @mentions. ' +
    //   'The character will remember key details about your interactions that can be shared with friends.'
    // );

    // if (!confirmed) return;

    try {
      setIsEnablingCFM(true);
      setCfmError(null);

      await CFMService.enableCFM(chatId);
      setIsCFMEnabled(true);

    } catch (error) {
      console.error('Error enabling CFM:', error);
      setCfmError(error instanceof Error ? error.message : 'Failed to enable CFM');
    } finally {
      setIsEnablingCFM(false);
    }
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('chatTokenLimit', selectedTokenLimit.toString());

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('tokenLimitChanged', {
      detail: { tokenLimit: selectedTokenLimit }
    }));

    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Get description for each token limit
  const getTokenDescription = (limit: TokenLimit): string => {
    switch (limit) {
      case 256:
        return "Short responses - Quick and concise replies";
      case 512:
        return "Medium responses - Balanced length and detail";
      case 1024:
        return "Long responses - Detailed and comprehensive replies";
    }
  };

  return (
    <div className="chat-settings-overlay" onClick={onClose}>
      <div className="chat-settings-content" onClick={(e) => e.stopPropagation()}>
        <div className="chat-settings-header">
          <h2>Chat Settings</h2>
          <button className="chat-settings-close" onClick={onClose}>×</button>
        </div>

        <div className="chat-settings-body">
          {/* Response Length Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Response Length</h3>
            <p className="settings-section-description">
              Choose how long AI responses should be. This setting applies to all chats.
            </p>

            <div className="token-options">
              {([256, 512, 1024] as TokenLimit[]).map((limit) => (
                <div
                  key={limit}
                  className={`token-option ${selectedTokenLimit === limit ? 'selected' : ''}`}
                  onClick={() => handleTokenLimitChange(limit)}
                >
                  <div className="token-option-header">
                    <div className="token-option-radio">
                      <input
                        type="radio"
                        name="tokenLimit"
                        value={limit}
                        checked={selectedTokenLimit === limit}
                        onChange={() => handleTokenLimitChange(limit)}
                      />
                    </div>
                    <div className="token-option-title">
                      {limit} tokens
                    </div>
                  </div>
                  <div className="token-option-description">
                    {getTokenDescription(limit)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NEW: CFM Section */}
          {chatId && (
            <div className="settings-section">
              <h3 className="settings-section-title">Cross-Friends Memory (CFM)</h3>
              <p className="settings-section-description">
                Allow friends to access this character's memories of you through @mentions.
                ⚠️ Warning: This action cannot be undone.
              </p>

              <div className="cfm-option">
                <div className="cfm-toggle-container">
                  <label className="cfm-toggle-label">
                    <input
                      type="checkbox"
                      checked={isCFMEnabled}
                      onChange={handleCFMToggle}
                      disabled={isCFMEnabled || isEnablingCFM}
                    />
                    <span className="cfm-toggle-text">
                      {isCFMEnabled ? 'CFM Enabled' : 'Enable CFM'}
                    </span>
                  </label>
                  {isCFMEnabled && (
                    <span className="cfm-enabled-badge">✓ Active</span>
                  )}
                </div>

                {cfmError && (
                  <div className="cfm-error">{cfmError}</div>
                )}

                <div className="cfm-info">
                  {isCFMEnabled ? (
                    <p className="cfm-info-text">
                      <strong>CFM is active.</strong> Friends can use @{localStorage.getItem('currentUsername') || 'yourname'} to reference this character's memories of you.
                    </p>
                  ) : (
                    <p className="cfm-info-text">
                      Once enabled, this character will maintain shareable memories of your interactions.
                      <strong> This cannot be disabled once activated.</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-settings-footer">
          <button className="settings-button cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="settings-button save" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsPopup;