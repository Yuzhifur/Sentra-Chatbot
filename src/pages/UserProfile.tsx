import React from 'react';
import Sidebar from '../components/Sidebar';
import './ProfilePage.css'; // Import your CSS file

const ProfilePage: React.FC = () => {
  return (
    <div className="profile-page">
      {/* Sidebar */}
      <Sidebar doResetDashboard={() => {}} />

      {/* Main Content */}
      <div className="main-content">

        {/* User Avatar */}
        <div className="avatar">
          S
        </div>

        {/* Username */}
        <h1 className="username">User's Name</h1> // Replace with actual username

        {/* Stats */}
        <div className="stats">
          <span>X Followers</span> |// Replace with actual follower count
          <span>X Following</span> |// Replace with actual following count
          <span>X Interactions</span>// Replace with actual interaction count
        </div>

        {/* Settings Buttons */}
        <div className="settings-buttons">
          <button className="settings-button">Settings</button>
          <button className="settings-button">Share</button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className="tab active">Characters</button>
          <button className="tab">Liked</button>
          <button className="tab">Personas</button>
          <button className="tab">Voices</button>
        </div>

        {/* Empty State */}
        <div className="empty-state">
          You haven't made any Characters yet.
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
