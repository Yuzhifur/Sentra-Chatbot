import React, { useEffect, useState } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { FirebaseService } from '../services/FirebaseService';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
          const userData = await FirebaseService.getUserData(currentUser.uid);
          if (userData) {
            setUsername(userData.username);
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

  return (
    <div className="main-content">
      {/* Top search bar and user profile */}
      <div className="search-bar-container">
        <div className="main-search-bar">
          <input
            type="text"
            className="main-search-input"
            placeholder="Search Here for Characters"
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="user-profile" onClick={() => navigate('/profile')}>
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>

      {/* Welcome Message */}
      {!loading && (
        <div className="welcome-message">
          Welcome, <span className="username-highlight">{username || 'User'}</span>!
        </div>
      )}

      {/* Featured Characters Section */}
      <h2 className="section-title">Featured</h2>
      <div className="featured-container">
        {/* This would be populated dynamically from database */}
        <div className="character-card">
          <div className="character-image"></div>
          <div className="character-info">
            <h3 className="character-name">Character 1</h3>
            <p className="character-author">by &lt;author&gt;</p>
          </div>
        </div>
        <div className="character-card">
          <div className="character-image"></div>
          <div className="character-info">
            <h3 className="character-name">Character 2</h3>
            <p className="character-author">by &lt;author&gt;</p>
          </div>
        </div>
        <div className="character-card">
          <div className="character-image"></div>
          <div className="character-info">
            <h3 className="character-name">Character 3</h3>
            <p className="character-author">by &lt;author&gt;</p>
          </div>
        </div>
      </div>

      {/* Character Creation Section */}
      <h2 className="section-title">Character Creation</h2>
      <div className="creation-container">
        {/* Fixed element: Portal to character creation */}
        <div className="creation-card" onClick={() => navigate('/character-creation')}>
          <p>Go to Character Creation</p>
        </div>
        {/* Templates section - would be dynamic eventually */}
        <div className="template-card">
          <p>Template 1</p>
        </div>
        <div className="template-card">
          <p>Template 2</p>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <a href="#">About</a>
        <a href="#">Policies</a>
        <a href="#">Blog</a>
      </div>
    </div>
  );
}

export default Home;