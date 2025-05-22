import React, { useEffect, useState } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { FirebaseService } from '../services/FirebaseService';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import SearchBar from '../components/SearchBar';
import CharacterChatPopup from '../components/CharacterChatPopup';

const Home: React.FC = () => {
  // Get Firestore and Storage instances
  const db = getFirestore();
  const storage = getStorage();  // for images for the popup

  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);
  const [showChatPopup, setShowChatPopup] = useState<boolean>(false);
  const [characterForChat, setCharacterForChat] = useState<{id: string, name: string} | null>(null);

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
  const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null);

  // fetch the character data from Firestore
  useEffect(() => {
    const getCharacterList = async () => {
      try {
        const data = await getDocs(characterCollectionRef);
  
        const characterPromises = data.docs.map(async (doc) => {
          const docData = doc.data();
  
          return {
            ...docData,
            docId: doc.id,  // Store the document ID separately
          };
        });
  
        const characterList = await Promise.all(characterPromises);
        setCharacterList(characterList);
      } catch (err) {
        console.error(err);
      }
    };
  
    getCharacterList();
  }, []);

  // get the URL of placeholder.png from Storage
  useEffect(() => {
    const loadPlaceholder = async () => {
      try {
        const placeholderRef = ref(storage, "placeholder.png");
        const url = await getDownloadURL(placeholderRef);
        setPlaceholderUrl(url);
      } catch (error) {
        console.error("Error loading placeholder image:", error);
      }
    };

    loadPlaceholder();
  }, []);

  const handleStartChat = (characterId: string, characterName: string) => {
    setCharacterForChat({ id: characterId, name: characterName });
    setShowChatPopup(true);
  };

  return (
    <div className="main-content">
      {/* Top search bar and user profile */}
      <div className="search-bar-container">
        <SearchBar />
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
        {/* Populate character info from firestore database */}
        {characterList.length > 0 ? (
          characterList.map((char) => (
            <div
              key={char.id}
              className="character-card"
              onClick={() => setSelectedCharacter(char)}
            >
              <div
                className="character-image"
                style={{
                  backgroundImage: `url(${char.avatar || placeholderUrl || ""})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div className="character-info">
                <h3 className="character-name">{char.name}</h3>
                <p className="character-author">by {char.authorDisplayName || "Unknown"}</p>
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

      {/* Character Popup */}
      {selectedCharacter && (
        <div className="modal-overlay" onClick={() => setSelectedCharacter(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCharacter(null)}>×</button>
            <h1>{selectedCharacter.name}</h1>
            <br />
            <p><strong>Author:</strong> {selectedCharacter.authorDisplayName || "Unknown"}</p>
            <br />
            <p><strong>Description:</strong> {selectedCharacter.characterDescription || "No description provided."}</p>
            <br />
            <p><strong>Tags:</strong>{" "}
            {selectedCharacter.tags && selectedCharacter.tags.length > 0
              ? selectedCharacter.tags.map(tag => `${tag}`).join(", ")
              : "No tags provided."}
            </p>
            <br />
            {selectedCharacter.imageUrl && (
              <img src={selectedCharacter.imageUrl} alt={selectedCharacter.name} style={{ width: "100%", borderRadius: "8px" }} />
            )}
            <button
              className="chat-item"
              onClick={() => handleStartChat(selectedCharacter.docId, selectedCharacter.name)}
              style={{
                cursor: 'pointer',
                fontSize: '15px',
                marginLeft: '10px'
              }}
            >
              Let's Chat! ✏️
            </button>
          </div>
        </div>
      )}

      {/* Chat History Popup */}
      {showChatPopup && characterForChat && (
        <CharacterChatPopup
          characterId={characterForChat.id}
          characterName={characterForChat.name}
          onClose={() => setShowChatPopup(false)}
        />
      )}
    </div>
  );
};

export default Home;