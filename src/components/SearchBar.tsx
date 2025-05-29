import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import CharacterChatPopup from './CharacterChatPopup';
import './SearchBar.css';

type SearchBarProps = {
  placeholder?: string;
  className?: string;
};

// Base type for search results
interface BaseSearchResult {
  type: string;
  id: string;
  avatar: string;
}

// User-specific search result
interface UserResult extends BaseSearchResult {
  type: 'user';
  username: string;
  displayName: string;
}

// Character-specific search result
interface CharacterResult extends BaseSearchResult {
  type: 'character';
  intId: string;
  name: string;
  authorDisplayName: string;
  characterDescription: string;
  docId: string; // Add docId for consistency with home.tsx
  tags: string[];
}

// Union type for all possible search results
type SearchResult = UserResult | CharacterResult;

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search Here for Characters",
  className = ""
}) => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterResult | null>(null);
  const [showChatPopup, setShowChatPopup] = useState<boolean>(false);
  const [characterForChat, setCharacterForChat] = useState<{id: string, name: string} | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle clicks outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search function that triggers on text change
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchText.trim()) {
        performSearch(searchText);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300); // debounce for 300ms

    return () => clearTimeout(debounceTimeout);
  }, [searchText]);

  const performSearch = async (text: string) => {
    setIsLoading(true);
    const results: SearchResult[] = [];
    const db = getFirestore();

    try {
      // Part 1: Search for username match (case insensitive)
      const usersRef = collection(db, "users");
      const usersQuery = query(
        usersRef,
        where("username", ">=", text.toLowerCase()),
        where("username", "<=", text.toLowerCase() + "\uf8ff")
      );

      const userSnapshot = await getDocs(usersQuery);
      userSnapshot.forEach((doc) => {
        const userData = doc.data();
        results.push({
          type: 'user',
          id: doc.id,
          username: userData.username || "",
          displayName: userData.displayName || userData.username || "",
          avatar: userData.userAvatar || "",
        });
      });

      // Part 2: Search for exact int ID match if the search is a number
      if (/^\d+$/.test(text)) {
        const charactersRef = collection(db, "characters");
        const intIdQuery = query(
          charactersRef,
          where("id", "==", text)
        );

        const intIdSnapshot = await getDocs(intIdQuery);
        intIdSnapshot.forEach((doc) => {
          const charData = doc.data();
          results.push({
            type: 'character',
            id: doc.id,
            docId: doc.id, // Add docId for consistency
            intId: charData.id || "",
            name: charData.name || "Unnamed Character",
            avatar: charData.avatar || "",
            authorDisplayName: charData.authorDisplayName || "Unknown",
            characterDescription: charData.characterDescription || "",
            tags: charData.tags || [],
          });
        });
      }

      // Part 3: Search for character name match (case insensitive)
      const charsRef = collection(db, "characters");
      const nameQuery = query(
        charsRef,
        where("name", ">=", text),
        where("name", "<=", text + "\uf8ff")
      );

      const nameSnapshot = await getDocs(nameQuery);
      nameSnapshot.forEach((doc) => {
        const charData = doc.data();
        // Skip if this character was already added via int ID search
        if (!results.some(r => r.type === 'character' && r.id === doc.id)) {
          results.push({
            type: 'character',
            id: doc.id,
            docId: doc.id, // Add docId for consistency
            intId: charData.id || "",
            name: charData.name || "Unnamed Character",
            avatar: charData.avatar || "",
            authorDisplayName: charData.authorDisplayName || "Unknown",
            characterDescription: charData.characterDescription || "",
            tags: charData.tags || [],
          });
        }
      });

      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user') {
      // Navigate to the user's profile
      navigate(`/profile/${result.id}`);
    } else {
      // Show character popup
      setSelectedCharacter(result);
    }
    setShowDropdown(false);
  };

  const closeCharacterPopup = () => {
    setSelectedCharacter(null);
  };

  const handleStartChat = (characterId: string, characterName: string) => {
    setCharacterForChat({ id: characterId, name: characterName });
    setShowChatPopup(true);
    // Close character popup when opening chat popup
    setSelectedCharacter(null);
  };

  return (
    <div className={`search-bar-container ${className}`} ref={searchRef}>
      <div className="main-search-bar">
        <input
          type="text"
          className="main-search-input"
          placeholder={placeholder}
          value={searchText}
          onChange={handleSearchChange}
          onFocus={() => searchText.trim() && setShowDropdown(searchResults.length > 0)}
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="search-results-dropdown">
          {isLoading ? (
            <div className="search-loading">Searching...</div>
          ) : (
            <>
              {/* Part 1: User Results */}
              {searchResults.filter(r => r.type === 'user').map((result, index) => {
                const userResult = result as UserResult;
                return (
                  <div
                    key={`user-${index}`}
                    className="search-result user-result"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="result-left">
                      <div className="result-avatar">
                        {userResult.avatar ?
                          <img src={userResult.avatar} alt={userResult.displayName} /> :
                          userResult.displayName.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="result-name">{userResult.displayName}</div>
                    </div>
                    <div className="result-type">User</div>
                  </div>
                );
              })}

              {/* Part 2 & 3: Character Results */}
              {searchResults.filter(r => r.type === 'character').map((result, index) => {
                const charResult = result as CharacterResult;
                return (
                  <div
                    key={`character-${index}`}
                    className="search-result character-result"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="result-left">
                      <div className="result-avatar">
                        {charResult.avatar ?
                          <img src={charResult.avatar} alt={charResult.name} /> :
                          charResult.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="result-name">{charResult.name}</div>
                      <div className="result-id">#{charResult.intId}</div>
                    </div>
                    <div className="result-type">Character</div>
                  </div>
                );
              })}

              {searchResults.length === 0 && (
                <div className="no-results">No results found</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Character Popup */}
      {selectedCharacter && (
        <div className="modal-overlay" onClick={closeCharacterPopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeCharacterPopup}>×</button>
            <h1>{selectedCharacter.name}</h1>
            <br />
            <p><strong>ID:</strong> #{selectedCharacter.intId}</p>
            <br />
            <p><strong>Author:</strong> {selectedCharacter.authorDisplayName}</p>
            <br />
            <p><strong>Description:</strong> {selectedCharacter.characterDescription || "No description provided."}</p>
            <br />
            <p><strong>Tags:</strong>{" "}
            {selectedCharacter.tags && selectedCharacter.tags.length > 0
              ? selectedCharacter.tags.map(tag => `${tag}`).join(", ")
              : "No tags provided."}
            </p>
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

export default SearchBar;