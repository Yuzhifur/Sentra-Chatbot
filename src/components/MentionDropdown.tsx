// src/components/MentionDropdown.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService, FriendData } from '../services/FirebaseService';
import './MentionDropdown.css';

interface MentionDropdownProps {
  searchTerm: string;
  onSelect: (username: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({
  searchTerm,
  onSelect,
  onClose,
  position
}) => {
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const { friends: friendsList } = await FirebaseService.getFriendsAndRequests(
          FirebaseService.getCurrentUserId()
        );
        setFriends(friendsList);
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  // Filter friends based on search term
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = friends.filter(friend =>
      friend.userUsername.toLowerCase().includes(term) ||
      friend.userDisplayName.toLowerCase().includes(term)
    );
    setFilteredFriends(filtered);
    setSelectedIndex(0);
  }, [searchTerm, friends]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredFriends.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredFriends[selectedIndex]) {
            handleSelect(filteredFriends[selectedIndex].userUsername);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredFriends, selectedIndex, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelect = (username: string) => {
    onSelect(username);
    onClose();
  };

  if (loading) {
    return (
      <div
        ref={dropdownRef}
        className="mention-dropdown"
        style={{ top: position.top, left: position.left }}
      >
        <div className="mention-dropdown-loading">Loading friends...</div>
      </div>
    );
  }

  if (filteredFriends.length === 0) {
    return (
      <div
        ref={dropdownRef}
        className="mention-dropdown"
        style={{ top: position.top, left: position.left }}
      >
        <div className="mention-dropdown-empty">
          {friends.length === 0
            ? "No friends to mention"
            : "No matching friends"}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="mention-dropdown"
      style={{ top: position.top, left: position.left }}
    >
      {filteredFriends.map((friend, index) => (
        <div
          key={friend.userId}
          className={`mention-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => handleSelect(friend.userUsername)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="mention-dropdown-avatar">
            {friend.userAvatar ? (
              <img src={friend.userAvatar} alt={friend.userDisplayName} />
            ) : (
              <div className="mention-dropdown-avatar-placeholder">
                {friend.userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="mention-dropdown-info">
            <div className="mention-dropdown-name">{friend.userDisplayName}</div>
            <div className="mention-dropdown-username">@{friend.userUsername}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MentionDropdown;