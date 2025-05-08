import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAuth } from 'firebase/auth';
import { FirebaseService } from '../services/FirebaseService';
import './UserProfile.css';

type UserData = {
  username: string;
  displayName: string;
  userAvatar: string;
  userDescription: string;
  userCharacters: string[];
};

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
          const data = await FirebaseService.getUserData(currentUser.uid);
          if (data) {
            setUserData(data as UserData);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await FirebaseService.logOut();
      navigate('/'); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="user-profile-page">
      {/* Sidebar */}
      <Sidebar doResetDashboard={() => {}} />

      {/* Main Content */}
      <div className="user-main-content">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <>
            {/* User Avatar */}
            <div className="user-avatar">
              {userData?.username ? userData.username.charAt(0).toUpperCase() : 'U'}
            </div>

            {/* Username */}
            <h1 className="user-username">{userData?.displayName || 'User'}</h1>

            {/* Stats */}
            <div className="user-stats">
              <span>0 Followers</span> |
              <span>0 Following</span> |
              <span>0 Interactions</span>
            </div>

            {/* Settings Buttons */}
            <div className="user-settings-buttons">
              <button className="user-settings-button">Settings</button>
              <button className="user-settings-button">Share</button>
              <button
                className="user-logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
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
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;