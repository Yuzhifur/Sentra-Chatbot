import React from 'react';
import './Sidebar.css';

type SidebarProps = {
  doResetDashboard: () => void; // Function to reset dashboard to default content
};

const Sidebar: React.FC<SidebarProps> = ({ doResetDashboard }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2
          className="sidebar-title"
          onClick={doResetDashboard}
        >
          Sentra
        </h2>
      </div>
      {/* Additional sidebar items added here in the future */}
    </div>
  );
};

export default Sidebar;