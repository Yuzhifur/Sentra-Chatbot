import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

type SidebarProps = {
  doResetDashboard: () => void; // Function to reset dashboard to default content
};

const Sidebar: React.FC<SidebarProps> = ({ doResetDashboard }) => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate(); // For page navigation

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-header">
          <h1
            className="sidebar-title"
            onClick={doResetDashboard}
          >
            Sentra
          </h1>
          <span
            className="chat-item"
            onClick={() => navigate('./chat')}
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
          <div className="history-section">
            <h3 className="section-header">Today</h3>
            {/* These will be dynamically populated when connected to database */}
            <div className="chat-item">
              <div className="avatar"></div>
              <span>Character 1</span>
            </div>
            <div className="chat-item">
              <div className="avatar"></div>
              <span>Character 2</span>
            </div>
            <div className="chat-item">
              <div className="avatar"></div>
              <span>Character 3</span>
            </div>
          </div>

          <div className="history-section">
            <h3 className="section-header">Yesterday</h3>
            {/* To be populated dynamically */}
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <p>Copyright Sentra {currentYear}</p>
      </div>
    </div>
  );
};

export default Sidebar;