// src/components/ChatSettingsPopup.tsx
import React, { useState, useEffect } from 'react';
import './ChatSettingsPopup.css';

interface ChatSettingsPopupProps {
  onClose: () => void;
}

type TokenLimit = 256 | 512 | 1024;

const ChatSettingsPopup: React.FC<ChatSettingsPopupProps> = ({ onClose }) => {
  const [selectedTokenLimit, setSelectedTokenLimit] = useState<TokenLimit>(1024);

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

  const handleTokenLimitChange = (limit: TokenLimit) => {
    setSelectedTokenLimit(limit);
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