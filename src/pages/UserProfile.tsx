import React from 'react';
import Sidebar from '../components/Sidebar';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  return (
    <div className="user-profile-page">
      {/* Sidebar */}
      <Sidebar doResetDashboard={() => {}} />

      {/* Main Content */}
      <div className="user-main-content">

        {/* User Avatar */}
        <div className="user-avatar">
          S
        </div>

        {/* Username */}
        <h1 className="user-username">User's Name</h1> // Replace with actual username

        {/* Stats */}
        <div className="user-stats">
          <span>X Followers</span> |// Replace with actual follower count
          <span>X Following</span> |// Replace with actual following count
          <span>X Interactions</span>// Replace with actual interaction count
        </div>

        {/* Settings Buttons */}
        <div className="user-settings-buttons">
          <button className="user-settings-button">Settings</button>
          <button className="user-settings-button">Share</button>
        </div>

        {/* Tabs */}
        <div className="user-tabs">
          <button className="user-tab active">Characters</button>
          <button className="user-tab">Liked</button>
          <button className="user-tab">Personas</button>
          <button className="user-tab">Voices</button>
        </div>

        {/* Empty State */}
        <div className="user-empty-state">
          You haven't made any Characters yet.
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
