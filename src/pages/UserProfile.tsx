import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserSettingsPopup from '../components/UserSettingsPopup';
import { getAuth } from 'firebase/auth';
import { FirebaseService } from '../services/FirebaseService';
import './UserProfile.css';
import CharacterChatPopup from '../components/CharacterChatPopup';

type UserData = {
  username: string;
  displayName: string;
  userAvatar: string;
  userDescription: string;
  userCharacters: string[];
};

type Character = {
  id: string;
  docId: string;
  name: string;
  avatar: string;
  authorDisplayName: string;
  characterDescription: string;
};

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from URL if available
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'characters' | 'liked'>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showChatPopup, setShowChatPopup] = useState<boolean>(false);
  const [characterForChat, setCharacterForChat] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        // Determine if we're looking at our own profile or someone else's
        if (userId) {
          // Looking at another user's profile
          const data = await FirebaseService.getUserData(userId);
          if (data) {
            setUserData(data as UserData);
            setIsOwnProfile(currentUser?.uid === userId);
          } else {
            // User not found, redirect to home
            navigate('/');
          }
        } else if (currentUser) {
          // Looking at own profile
          const data = await FirebaseService.getUserData(currentUser.uid);
          if (data) {
            setUserData(data as UserData);
            setIsOwnProfile(true);
          }
        } else {
          // Not logged in, redirect to login
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  useEffect(() => {
    // Fetch character data once we have user data
    const fetchCharacters = async () => {
      if (userData && userData.userCharacters && userData.userCharacters.length > 0) {
        try {
          const fetchedCharacters = [];

          // If viewing own profile, use the getUserCharacters service
          if (isOwnProfile) {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (currentUser) {
              const userChars = await FirebaseService.getUserCharacters(currentUser.uid);
              setCharacters(userChars);
            }
          } else {
            // For other users, fetch characters from their userCharacters array
            // This would depend on your character retrieval service
            const userChars = await Promise.all(
              userData.userCharacters.map(async (charId) => {
                try {
                  const charData = await FirebaseService.getCharacterById(charId);
                  return {
                    ...charData,
                    docId: charId
                  };
                } catch (err) {
                  console.error(`Error fetching character ${charId}:`, err);
                  return null;
                }
              })
            );

            setCharacters(userChars.filter(char => char !== null) as Character[]);
          }
        } catch (error) {
          console.error("Error fetching characters:", error);
        }
      }
    };

    fetchCharacters();
  }, [userData, isOwnProfile]);

  const handleLogout = async () => {
    try {
      await FirebaseService.logOut();
      navigate('/'); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSaveSettings = async (bio: string, displayName: string, profilePicture: File | null) => {
    try {
      if (userData && isOwnProfile) {
        // Update bio and displayName
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const updatedData = {
          ...userData,
          userDescription: bio,
          displayName: displayName || userData.displayName
        };

        // Update profile picture if provided
        if (profilePicture) {
          try {
            const profilePictureUrl = await FirebaseService.uploadAndGetProfilePicture(
              currentUser.uid,
              profilePicture
            );

            if (profilePictureUrl) {
              updatedData.userAvatar = profilePictureUrl;
            }
          } catch (error) {
            console.error("Error uploading profile picture:", error);
          }
        }

        // Save updated data to Firebase
        await FirebaseService.updateUserData(currentUser.uid, updatedData);
        setUserData(updatedData);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setShowSettingsPopup(false);
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleEditCharacter = (characterId: string) => {
    // Navigate to character edit page
    navigate(`/character-edit/${characterId}`);
  };

  const handleStartChat = (characterId: string, characterName: string) => {
    setCharacterForChat({ id: characterId, name: characterName });
    setShowChatPopup(true);
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <Sidebar doResetDashboard={() => {}} />
        <div className="user-main-content">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      {/* Sidebar */}
      <Sidebar doResetDashboard={() => {}} />

      {/* Main Content */}
      <div className="user-main-content">
        {/* User Avatar */}
        <div className="user-avatar">
          {userData?.userAvatar ? (
            <img
              src={userData.userAvatar}
              alt={userData.displayName || userData.username}
              className="user-avatar-image"
            />
          ) : (
            (userData?.username ? userData.username.charAt(0).toUpperCase() : 'U')
          )}
        </div>

        {/* Username */}
        <h1 className="user-username">{userData?.displayName || userData?.username || 'User'}</h1>

        {/* Stats */}
        <div className="user-stats">
          <span>0 Followers</span> |
          <span>0 Following</span>
        </div>

        {/* Bio */}
        <div className="user-bio">
          <p>{userData?.userDescription || 'No bio available'}</p>
        </div>

        {/* Settings Buttons - Only show for own profile */}
        {isOwnProfile && (
          <div className="user-settings-buttons">
            <button
              className="user-settings-button"
              onClick={() => setShowSettingsPopup(true)}
            >
              Settings
            </button>
            <button className="user-settings-button">Share</button>
            <button
              className="user-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="user-tabs">
          <button
            className={`user-tab ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => setActiveTab('characters')}
          >
            Characters
          </button>
          <button
            className={`user-tab ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => setActiveTab('liked')}
          >
            Liked
          </button>
        </div>

        {/* Tab Content */}
        <div className="user-tab-content">
          {activeTab === 'characters' && (
            <div className="user-characters-grid">
              {characters.length > 0 ? (
                characters.map((character) => (
                  <div key={character.docId || `char-${character.id}`} className="character-item">
                    <div
                      className="character-item-content"
                      onClick={() => handleCharacterClick(character)}
                    >
                      <div className="character-item-image">
                        {character.avatar ? (
                          <img src={character.avatar} alt={character.name} />
                        ) : (
                          <div className="character-item-image-placeholder">
                            {character.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="character-item-name">{character.name}</div>
                    </div>
                    {isOwnProfile && (
                      <button
                        className="character-item-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCharacter(character.docId);
                        }}
                        title="Edit character"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="user-empty-state">
                  {isOwnProfile ? "You haven't made any Characters yet." : "This user hasn't made any Characters yet."}
                </div>
              )}
            </div>
          )}

          {activeTab === 'liked' && (
            <div className="user-empty-state">
              {isOwnProfile ? "You haven't liked any Characters yet." : "This user hasn't liked any Characters yet."}
            </div>
          )}
        </div>
      </div>

      {/* Settings Popup */}
      {showSettingsPopup && (
        <UserSettingsPopup
          onClose={() => setShowSettingsPopup(false)}
          onSave={handleSaveSettings}
          currentBio={userData?.userDescription || ''}
          currentDisplayName={userData?.displayName || ''}
        />
      )}

      {/* Character Popup */}
      {selectedCharacter && (
        <div className="modal-overlay" onClick={() => setSelectedCharacter(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCharacter(null)}>×</button>
            <h1>{selectedCharacter.name}</h1>
            <p><strong>Author:</strong> {selectedCharacter.authorDisplayName || "Unknown"}</p>
            <p><strong>Description:</strong> {selectedCharacter.characterDescription || "No description provided."}</p>
            {selectedCharacter.avatar && (
              <img src={selectedCharacter.avatar} alt={selectedCharacter.name} style={{ width: "100%", borderRadius: "8px" }} />
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

      {/* Chat Popup */}
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

export default UserProfile;