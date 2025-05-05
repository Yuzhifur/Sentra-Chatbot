import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import './ChatHistory.css';

interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const ChatHistory: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChatHistory = async () => {
      setLoading(true);
      
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          setError("Please log in to view chat history");
          setLoading(false);
          return;
        }
        
        const db = getFirestore();
        const chatSessionsRef = collection(db, "chatSessions");
        const q = query(
          chatSessionsRef,
          where("metadata.userId", "==", user.uid),
          orderBy("metadata.lastUpdated", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const sessions: ChatHistoryItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const messages = data.messages || [];
          
          // Get the last user or assistant message to use as title
          const lastContentMessage = [...messages]
            .reverse()
            .find(msg => msg.role === 'user' || msg.role === 'assistant');
            
          const title = lastContentMessage?.content || 'New Conversation';
          const lastMessage = messages.length > 0 
            ? messages[messages.length - 1].content.substring(0, 50) + (messages[messages.length - 1].content.length > 50 ? '...' : '')
            : 'No messages yet';
            
          sessions.push({
            id: doc.id,
            title: title.substring(0, 30) + (title.length > 30 ? '...' : ''),
            lastMessage,
            timestamp: data.metadata.lastUpdated.toDate()
          });
        });
        
        setChatSessions(sessions);
      } catch (err) {
        console.error("Error fetching chat history:", err);
        setError("Failed to load chat history");
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatHistory();
  }, []);
  
  const handleChatSelect = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Group chats by date
  const groupedChats: { [key: string]: ChatHistoryItem[] } = {};
  
  chatSessions.forEach(session => {
    const dateKey = formatDate(session.timestamp);
    if (!groupedChats[dateKey]) {
      groupedChats[dateKey] = [];
    }
    groupedChats[dateKey].push(session);
  });
  
  if (loading) {
    return <div className="chat-history-loading">Loading chat history...</div>;
  }
  
  if (error) {
    return <div className="chat-history-error">{error}</div>;
  }
  
  return (
    <div className="chat-history-container">
      {Object.keys(groupedChats).length > 0 ? (
        Object.entries(groupedChats).map(([date, sessions]) => (
          <div key={date} className="chat-history-group">
            <h3 className="chat-history-date">{date}</h3>
            <div className="chat-history-items">
              {sessions.map(session => (
                <div 
                  key={session.id} 
                  className="chat-history-item"
                  onClick={() => handleChatSelect(session.id)}
                >
                  <div className="chat-item-title">{session.title}</div>
                  <div className="chat-item-preview">{session.lastMessage}</div>
                  <div className="chat-item-time">
                    {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="chat-history-empty">
          <p>No chat history found</p>
          <button 
            className="new-chat-button"
            onClick={() => navigate('/chat')}
          >
            Start New Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;