import React, { Component } from 'react';
import './Home.css';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';


type HomeProps = {
  // Add any props as needed in the future
};

type HomeState = {
  // Add any state needed in the future
};

const Home: React.FC = () => {
  const navigate = useNavigate();

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
          U
        </div>
      </div>

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
        <div className="creation-card">
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