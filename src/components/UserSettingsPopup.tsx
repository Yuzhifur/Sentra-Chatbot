import React, { useState } from 'react';
import './UserSettingsPopup.css';

type UserSettingsPopupProps = {
  onClose: () => void;
  onSave: (bio: string, profilePicture: File | null) => void;
  currentBio: string;
};

const UserSettingsPopup: React.FC<UserSettingsPopupProps> = ({ onClose, onSave, currentBio }) => {
  const [bio, setBio] = useState<string>(currentBio);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const handleSave = () => {
    onSave(bio, profilePicture);
    onClose();
  };

  return (
    <div className="user-settings-popup">
      <div className="user-settings-popup-content">
        <h2>Edit Profile</h2>
        <label>
          Bio:
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Enter your bio"
          />
        </label>
        <label>
          Profile Picture:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
          />
        </label>
        <div className="user-settings-popup-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPopup;