import React, { useEffect, useState } from 'react';
import './Home.css';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import { getAuth } from 'firebase/auth';
import { FirebaseService } from '../services/FirebaseService';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

type HomeProps = {
  // Add any props as needed in the future
};

type HomeState = {
  // Add any state needed in the future
};

const Home: React.FC = () => {
  // Get Firestore and Storage instances
  const db = getFirestore();
  const storage = getStorage();

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
  const characterCollectionRef = collection(db, "characters");
  const [characterList, setCharacterList] = useState([]);

  // fetch the character data from Firestore
  useEffect(() => {
    const getCharacterList = async () => {
      try {
        const data = await getDocs(characterCollectionRef);
        const filteredData = data.docs.map((doc) => ({
          ...doc.data(),
        }));
        setCharacterList(filteredData);
      } catch (err) {
        console.error(err);
      }
    };

    getCharacterList();
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
        {/* template for the display of each character */}
        {/* <div className="character-card">
          <div className="character-image"></div>
          <div className="character-info">
            <h3 className="character-name">Character 1</h3>
            <p className="character-author">by &lt;author&gt;</p>
          </div>
        </div> */}
        {characterList.length > 0 ? (
          characterList.map((char) => (
            <div key={char.id} className="character-card">
              <div
                className="character-image"
                style={{
                  backgroundImage: `url(${char.imageUrl || "/placeholder.png"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div className="character-info">
                <h3 className="character-name">{char.name}</h3>
                <p className="character-author">by {char.author || "Unknown"}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No character available yet.</p>
        )}
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