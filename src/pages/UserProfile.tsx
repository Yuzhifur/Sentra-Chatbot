import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserSettingsPopup from '../components/UserSettingsPopup';
import { getAuth } from 'firebase/auth';
import { FirebaseService } from '../services/FirebaseService';
import './UserProfile.css';
import CharacterChatPopup from '../components/CharacterChatPopup';
import { collection, getFirestore } from 'firebase/firestore';
import { FriendData } from '../services/FirebaseService';

type UserData = {
  username: string;
  displayName: string;
  userAvatar: string;
  userDescription: string;
  userCharacters: string[];
  userLikedCharacters: string[];
};

type Character = {
  id: string;
  docId: string;
  name: string;
  avatar: string;
  authorDisplayName: string;
  characterDescription: string;
  tags: string[];
};

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from URL if available
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState<boolean>(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [likedCharacters, setLikedCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showChatPopup, setShowChatPopup] = useState<boolean>(false);
  const [characterForChat, setCharacterForChat] = useState<{id: string, name: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'characters' | 'liked' | 'friends'>('characters');
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendData[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<'friends' | 'pending' | 'none'>('none');
  const [friendCount, setFriendCount] = useState<number>(0);
  const [isProcessingFriend, setIsProcessingFriend] = useState<boolean>(false);

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

  useEffect(() => {
    // Fetch character data once we have user data
    const fetchLikedCharacters = async () => {
      if (userData && userData.userLikedCharacters && userData.userLikedCharacters.length > 0) {
        try {
          // If viewing own profile, use the getUserLikedCharacters service
          if (isOwnProfile) {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (currentUser) {
              const userLikedChars = await FirebaseService.getUserLikedCharacters(currentUser.uid);
              setLikedCharacters(userLikedChars);
              console.log(userLikedChars)
            }
          } else {
            // For other users, fetch characters from their userLikedCharacters array
            // This would depend on your character retrieval service
            const userLikedChars = await Promise.all(
              userData.userLikedCharacters.map(async (charId) => {
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

            setCharacters(userLikedChars.filter(char => char !== null) as Character[]);
          }
        } catch (error) {
          console.error("Error fetching liked characters:", error);
        }
      }
    };

    fetchLikedCharacters();
  }, [userData, isOwnProfile]);

  useEffect(() => {
    const fetchFriendsData = async () => {
      if (!userData) return;

      try {
        // Get friend count
        const auth = getAuth();  // modify
        const count = await FirebaseService.getFriendCount(userId || (isOwnProfile ? auth.currentUser?.uid : ''));
        setFriendCount(count);

        // If viewing own profile, get friends and requests
        if (isOwnProfile) {
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            const { friends, pendingRequests } = await FirebaseService.getFriendsAndRequests(currentUser.uid);
            setFriends(friends);
            setPendingRequests(pendingRequests);
          }
        } else if (userId) {
          // If viewing another user's profile, check friendship status
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            const status = await FirebaseService.checkFriendshipStatus(currentUser.uid, userId);
            setFriendshipStatus(status);
          }
        }
      } catch (error) {
        console.error("Error fetching friends data:", error);
      }
    };

    fetchFriendsData();
  }, [userData, userId, isOwnProfile]);

  // Add friend management functions
  const handleSendFriendRequest = async () => {
    if (!userId || isProcessingFriend) return;

    try {
      setIsProcessingFriend(true);
      await FirebaseService.sendFriendRequest(userId);
      setFriendshipStatus('pending');
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert(error instanceof Error ? error.message : 'Failed to send friend request');
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!userId || isProcessingFriend) return;

    const confirmed = window.confirm('Are you sure you want to remove this friend?');
    if (!confirmed) return;

    try {
      setIsProcessingFriend(true);
      await FirebaseService.removeFriend(userId);
      setFriendshipStatus('none');
      setFriendCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error removing friend:", error);
      alert(error instanceof Error ? error.message : 'Failed to remove friend');
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleAcceptFriendRequest = async (requesterId: string) => {
    try {
      await FirebaseService.acceptFriendRequest(requesterId);

      // Move from pending to friends
      const acceptedRequest = pendingRequests.find(req => req.userId === requesterId);
      if (acceptedRequest) {
        acceptedRequest.pending = false;
        setFriends(prev => [...prev, acceptedRequest]);
        setPendingRequests(prev => prev.filter(req => req.userId !== requesterId));
        setFriendCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert(error instanceof Error ? error.message : 'Failed to accept friend request');
    }
  };

  const handleDeclineFriendRequest = async (requesterId: string) => {
    try {
      await FirebaseService.declineFriendRequest(requesterId);
      setPendingRequests(prev => prev.filter(req => req.userId !== requesterId));
    } catch (error) {
      console.error("Error declining friend request:", error);
      alert(error instanceof Error ? error.message : 'Failed to decline friend request');
    }
  };

  const handleFriendClick = (friendId: string) => {
    navigate(`/profile/${friendId}`);
  };

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

  const handleDeleteCharacter = async (characterId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this character?");
    if (!confirmed) return;
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to delete a character');
      }

      // Delete from Firestore
      await FirebaseService.deleteCharacter(currentUser.uid, characterId);
      await FirebaseService.deleteLikedCharacter(currentUser.uid, characterId);

      // Update UI by removing the deleted character from local state
      setCharacters(prev =>
        prev.filter(character => character.docId !== characterId)
      );
    } catch (error: any) {
      console.error('Error deleting character:', error);
      alert(error.message || 'Failed to delete character. Please try again.');
    }
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

  const handleUnlikeCharacter = async (characterId: string) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to unlike a character');
      }

      // Delete from Firestore
      await FirebaseService.deleteLikedCharacter(currentUser.uid, characterId);

      // Update UI by removing the deleted character from local state
      setLikedCharacters(prev =>
        prev.filter(character => character.docId !== characterId)
      );
    } catch (error: any) {
      console.error('Error unliking character:', error);
      alert(error.message || 'Failed to unliking character. Please try again.');
    }
  };

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

        {/* Stats - Modified to show friend count and Add/Remove friend button */}
        <div className="user-stats">
          <span>{friendCount} Friends</span>
          {!isOwnProfile && userData && (
            <>
              <span>|</span>
              <span>{userData.username}</span>
              <span>|</span>
              {friendshipStatus === 'friends' ? (
                <button
                  className="friend-action-button remove"
                  onClick={handleRemoveFriend}
                  disabled={isProcessingFriend}
                >
                  Remove Friend
                </button>
              ) : friendshipStatus === 'pending' ? (
                <span className="friend-pending">Request Pending</span>
              ) : (
                <button
                  className="friend-action-button add"
                  onClick={handleSendFriendRequest}
                  disabled={isProcessingFriend}
                >
                  Add Friend
                </button>
              )}
            </>
          )}
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
          {isOwnProfile && (
            <button
              className={`user-tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Friends
            </button>
          )}
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
                      <div>
                        <span>
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
                        </span>
                        <span>
                          <button
                            className="character-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCharacter(character.docId);
                            }}
                            title="Delete character"
                          >
                            ❌
                          </button>
                        </span>
                      </div>
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
            <div className="user-characters-grid">
              {likedCharacters.length > 0 ? (
                likedCharacters.map((character) => (
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
                      <div>
                        <span>
                          <button
                            className="character-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlikeCharacter(character.docId);
                            }}
                            title="Unlike character"
                          >
                            ♥️
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="user-empty-state">
                  {isOwnProfile ? "You have no liked characters" : "This user doesn't have any liked characters."}
                </div>
              )}
            </div>
          )}

          {activeTab === 'friends' && isOwnProfile && (
            <div className="user-friends-section">
              {/* Pending Friend Requests */}
              {pendingRequests.length > 0 && (
                <div className="friend-requests-section">
                  <h3 className="section-subtitle">Friend Requests</h3>
                  <div className="friend-requests-list">
                    {pendingRequests.map((request) => (
                      <div key={request.userId} className="friend-request-item">
                        <div className="friend-info" onClick={() => handleFriendClick(request.userId)}>
                          <div className="friend-avatar">
                            {request.userAvatar ? (
                              <img src={request.userAvatar} alt={request.userDisplayName} />
                            ) : (
                              request.userDisplayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="friend-details">
                            <div className="friend-display-name">{request.userDisplayName}</div>
                            <div className="friend-username">@{request.userUsername}</div>
                          </div>
                        </div>
                        <div className="friend-request-actions">
                          <button
                            className="friend-accept-btn"
                            onClick={() => handleAcceptFriendRequest(request.userId)}
                            title="Accept friend request"
                          >
                            ✓
                          </button>
                          <button
                            className="friend-decline-btn"
                            onClick={() => handleDeclineFriendRequest(request.userId)}
                            title="Decline friend request"
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <div className="friends-list-section">
                <h3 className="section-subtitle">Friends ({friends.length})</h3>
                {friends.length > 0 ? (
                  <div className="friends-list">
                    {friends.map((friend) => (
                      <div
                        key={friend.userId}
                        className="friend-item"
                        onClick={() => handleFriendClick(friend.userId)}
                      >
                        <div className="friend-avatar">
                          {friend.userAvatar ? (
                            <img src={friend.userAvatar} alt={friend.userDisplayName} />
                          ) : (
                            friend.userDisplayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="friend-details">
                          <div className="friend-display-name">{friend.userDisplayName}</div>
                          <div className="friend-username">@{friend.userUsername}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="user-empty-state">
                    You haven't added any friends yet.
                  </div>
                )}
              </div>
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
            {selectedCharacter.avatar && (
              <img src={selectedCharacter.avatar} alt={selectedCharacter.name} style={{ width: "100%", borderRadius: "8px" }} />
            )}
            <button
              className="chat-item"
              onClick={() => handleStartChat(selectedCharacter.docId, selectedCharacter.name)}
              style={{
                cursor: 'pointer',
                fontSize: '15px',
                marginLeft: '10px',
                display: 'inline-block'
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