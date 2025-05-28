import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getDocs, collection, query, where, getFirestore, getDoc, doc } from 'firebase/firestore';
import { ChatService } from '../services/ChatService';
import ScenarioSelectionPopup from './ScenarioSelectionPopup';
import './CharacterChatPopup.css';

interface ChatHistoryItem {
  id: string;
  title: string;
  characterId: string;
  lastUpdated: any;
}

interface CharacterChatPopupProps {
  characterId: string;
  characterName: string;
  onClose: () => void;
}

const CharacterChatPopup: React.FC<CharacterChatPopupProps> = ({
  characterId,
  characterName,
  onClose
}) => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showScenarioPopup, setShowScenarioPopup] = useState<boolean>(false);
  const [characterData, setCharacterData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          console.error("User not authenticated");
          setLoading(false);
          return;
        }

        // Fetch character data first
        const db = getFirestore();
        const characterDoc = await getDoc(doc(db, "characters", characterId));
        
        if (characterDoc.exists()) {
          setCharacterData(characterDoc.data());
        }

        // Fetch chat history
        const chatHistoryRef = collection(db, "users", currentUser.uid, "chatHistory");
        const q = query(chatHistoryRef, where("characterId", "==", characterId));

        const querySnapshot = await getDocs(q);
        const chats: ChatHistoryItem[] = [];

        querySnapshot.forEach((doc) => {
          chats.push({
            id: doc.id,
            title: doc.data().title || `Chat with ${characterName}`,
            characterId: doc.data().characterId || characterId,
            lastUpdated: doc.data().lastUpdated
          });
        });

        // Sort by last message time (most recent first)
        chats.sort((a, b) => {
          const timeA = a.lastUpdated?.toDate?.() || 0;
          const timeB = b.lastUpdated?.toDate?.() || 0;
          return timeB - timeA;
        });

        setChatHistory(chats);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [characterId, characterName]);

  const handleNewChat = () => {
    // Show scenario selection popup instead of directly creating chat
    setShowScenarioPopup(true);
  };

  const handleChatSelect = (chatId: string) => {
    // Close the popup to prevent multiple clicks
    onClose();
    // Use the sessionId parameter name to match the route definition
    navigate(`/chat/${characterId}/${chatId}`);
  };

  const handleScenarioPopupClose = () => {
    setShowScenarioPopup(false);
  };

  return (
    <>
      <div className="chat-popup-overlay" onClick={onClose}>
        <div className="chat-popup-content" onClick={(e) => e.stopPropagation()}>
          <div className="chat-popup-header">
            <h2>Chats with {characterName}</h2>
            <button className="chat-popup-close" onClick={onClose}>×</button>
          </div>

          <div className="chat-popup-options">
            {/* New Chat Option */}
            <div
              className="chat-option new-chat"
              onClick={handleNewChat}
            >
              <div className="chat-option-icon">+</div>
              <div className="chat-option-text">Start New Chat</div>
            </div>

            {/* Existing Chats */}
            {loading ? (
              <div className="chat-loading">Loading chat history...</div>
            ) : (
              <>
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className="chat-option history-chat"
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <div className="chat-option-content"></div>
                      <div className="chat-option-title">{chat.title}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-history">No previous chats with this character</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Selection Popup */}
      {showScenarioPopup && characterData && (
        <ScenarioSelectionPopup
          characterId={characterId}
          characterName={characterName}
          defaultScenario={characterData.scenario || ''}
          onClose={() => {
            setShowScenarioPopup(false);
            onClose(); // Also close the main popup
          }}
        />
      )}
    </>
  );
};

export default CharacterChatPopup;