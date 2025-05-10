import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatService } from '../services/ChatService';
import './Sidebar.css';

type SidebarProps = {
  doResetDashboard: () => void;
};

interface RecentChat {
  id: string;
  title: string;
  characterId: string;
  characterName?: string;
  avatar?: string;
  lastUpdated?: any;
}

const Sidebar: React.FC<SidebarProps> = ({ doResetDashboard }) => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const chats = await ChatService.getRecentChats(10);
        setRecentChats(chats);
      } catch (error) {
        console.error("Error fetching recent chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentChats();
  }, []);

  // Function to handle chat click
  const handleChatClick = (chatId: string, characterId: string) => {
    navigate(`/chat/${characterId}/${chatId}`);
  };

  // Function to create a new chat
  const handleNewChat = () => {
    navigate('/chat');
  };

  // Group chats by date (today, yesterday, older)
  const todayChats: RecentChat[] = [];
  const yesterdayChats: RecentChat[] = [];
  const olderChats: RecentChat[] = [];

  // Get today and yesterday dates for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Group chats based on their last message timestamp
  recentChats.forEach(chat => {
    if (!chat.lastUpdated) {
      olderChats.push(chat);
      return;
    }

    const chatDate = chat.lastUpdated.toDate?.() || new Date(chat.lastUpdated);
    chatDate.setHours(0, 0, 0, 0);

    if (chatDate.getTime() === today.getTime()) {
      todayChats.push(chat);
    } else if (chatDate.getTime() === yesterday.getTime()) {
      yesterdayChats.push(chat);
    } else {
      olderChats.push(chat);
    }
  });

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-header">
          <h1
            className="sidebar-title"
            onClick={() => navigate('/')}
          >
            Sentra
          </h1>
          <span
            className="chat-item"
            onClick={handleNewChat}
            title="Create new Chat"
            style={{
              cursor: 'pointer',
              fontSize: '20px',
              marginLeft: '10px'
            }}
            >✏️</span>
        </div>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search Chat History"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="chat-history">
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.5)", padding: "10px" }}>Loading chats...</div>
          ) : (
            <>
              {todayChats.length > 0 && (
                <div className="history-section">
                  <h3 className="section-header">Today</h3>
                  {todayChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="chat-item"
                      onClick={() => handleChatClick(chat.id, chat.characterId)}
                    >
                      <div className="avatar">
                        {chat.avatar ? (
                          <img src={chat.avatar} alt={chat.characterName || 'Character'} width="40" height="40" />
                        ) : (
                          (chat.characterName?.[0] || 'C').toUpperCase()
                        )}
                      </div>
                      <span>{chat.title || chat.characterName || 'Chat'}</span>
                    </div>
                  ))}
                </div>
              )}

              {yesterdayChats.length > 0 && (
                <div className="history-section">
                  <h3 className="section-header">Yesterday</h3>
                  {yesterdayChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="chat-item"
                      onClick={() => handleChatClick(chat.id, chat.characterId)}
                    >
                      <div className="avatar">
                        {chat.avatar ? (
                          <img src={chat.avatar} alt={chat.characterName || 'Character'} width="40" height="40" />
                        ) : (
                          (chat.characterName?.[0] || 'C').toUpperCase()
                        )}
                      </div>
                      <span>{chat.title || chat.characterName || 'Chat'}</span>
                    </div>
                  ))}
                </div>
              )}

              {olderChats.length > 0 && (
                <div className="history-section">
                  <h3 className="section-header">Older</h3>
                  {olderChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="chat-item"
                      onClick={() => handleChatClick(chat.id, chat.characterId)}
                    >
                      <div className="avatar">
                        {chat.avatar ? (
                          <img src={chat.avatar} alt={chat.characterName || 'Character'} width="40" height="40" />
                        ) : (
                          (chat.characterName?.[0] || 'C').toUpperCase()
                        )}
                      </div>
                      <span>{chat.title || chat.characterName || 'Chat'}</span>
                    </div>
                  ))}
                </div>
              )}

              {recentChats.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.5)", padding: "10px" }}>No chat history found</div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <p>Copyright Sentra {currentYear}</p>
      </div>
    </div>
  );
};

export default Sidebar;