import React, { useState } from 'react';
import './UserSettingsPopup.css';

type UserSettingsPopupProps = {
  onClose: () => void;
  onSave: (bio: string, displayName: string, profilePicture: File | null) => void;
  currentBio: string;
  currentDisplayName: string;
};

const UserSettingsPopup: React.FC<UserSettingsPopupProps> = ({
  onClose,
  onSave,
  currentBio,
  currentDisplayName
}) => {
  const [bio, setBio] = useState<string>(currentBio);
  const [displayName, setDisplayName] = useState<string>(currentDisplayName);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(bio, displayName, profilePicture);
  };

  return (
    <div className="user-settings-popup">
      <div className="user-settings-popup-content">
        <h2>Edit Profile</h2>

        <div className="settings-form-group">
          <label>Display Name:</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
          />
          <p className="settings-help-text">This is how your name will appear to others</p>
        </div>

        <div className="settings-form-group">
          <label>Bio:</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Enter your bio"
            rows={4}
          />
        </div>

        <div className="settings-form-group">
          <label>Profile Picture:</label>
          <div className="profile-picture-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              id="profile-picture-input"
              className="profile-picture-input"
            />
            <label htmlFor="profile-picture-input" className="profile-picture-button">
              Choose File
            </label>
            {previewUrl && (
              <div className="profile-picture-preview">
                <img src={previewUrl} alt="Profile preview" />
              </div>
            )}
          </div>
        </div>

        <div className="user-settings-popup-buttons">
          <button className="save-button" onClick={handleSave}>Save</button>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPopup;