import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch recent chats - extracted for reusability
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

  // Initial fetch on component mount
  useEffect(() => {
    fetchRecentChats();
  }, []);

  // Refetch chats when navigating back to home or when URL changes to/from chat routes
  useEffect(() => {
    // Check if we're navigating to home or away from a chat
    const currentPath = location.pathname;

    // Refetch if we're on home page or just navigated away from a chat
    if (currentPath === '/' || currentPath.startsWith('/profile') || currentPath.startsWith('/character-creation')) {
      fetchRecentChats();
    }
  }, [location.pathname]);

  // Listen for focus events (when user comes back to the tab/window)
  useEffect(() => {
    const handleFocus = () => {
      fetchRecentChats();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for custom events when chat list needs updating
  useEffect(() => {
    const handleChatListUpdate = () => {
      fetchRecentChats();
    };

    window.addEventListener('chatListUpdated', handleChatListUpdate);
    return () => window.removeEventListener('chatListUpdated', handleChatListUpdate);
  }, []);

  // Function to handle chat click
  const handleChatClick = (chatId: string, characterId: string) => {
    navigate(`/chat/${characterId}/${chatId}`);
  };

  // Function to create a new chat
  const handleNewChat = () => {
    navigate('/chat');
  };

  // Function to delete a existed chat
  const handleDeleteChat = async (chatId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) return;

    try {
      await ChatService.deleteChatSession(chatId);
      setRecentChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error("Failed to delete chat:", error);
      alert("Failed to delete chat.");
    }
  }

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

  // Function to get display title
  const getDisplayTitle = (chat: RecentChat) => {
    // Use custom title if available
    if (chat.title) {
      return chat.title;
    }
    // Fallback to "Chat with {characterName}"
    if (chat.characterName) {
      return `Chat with ${chat.characterName}`;
    }
    // Last resort
    return "Chat";
  };

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
                      <div key={chat.id} className="chat-item">
                        <div
                            onClick={() => handleChatClick(chat.id, chat.characterId)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', width: 0.85 }}
                        >
                          <div className="avatar">
                            {chat.avatar ? (
                                <img src={chat.avatar} alt={chat.characterName || 'Character'} width="40" height="40" />
                            ) : (
                                (chat.characterName?.[0] || 'C').toUpperCase()
                            )}
                          </div>
                          <div className="chat-item-content">
                            <span className="chat-item-title">{getDisplayTitle(chat)}</span>
                          </div>
                        </div>
                        <button className="delete-button" onClick={() => handleDeleteChat(chat.id)} title="Delete chat">🗑️</button>
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
                      <div className="chat-item-content">
                        <span className="chat-item-title">{getDisplayTitle(chat)}</span>
                      </div>
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
                      <div className="chat-item-content">
                        <span className="chat-item-title">{getDisplayTitle(chat)}</span>
                      </div>
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