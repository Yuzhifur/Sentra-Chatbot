import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface ChatTitleEditorProps {
  chatId: string;
  initialTitle: string;
}

const ChatTitleEditor: React.FC<ChatTitleEditorProps> = ({ chatId, initialTitle }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(initialTitle || 'Untitled Chat');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update local title when prop changes
    setTitle(initialTitle || 'Untitled Chat');
  }, [initialTitle]);

  useEffect(() => {
    // Focus input when editing starts
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const saveTitle = async () => {
    if (title === initialTitle || !title.trim()) {
      // If unchanged or empty, just cancel editing
      if (!title.trim()) {
        setTitle(initialTitle || 'Untitled Chat');
      }
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const db = getFirestore();
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to update chat title');
      }

      // Update title in main chat document
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        title: title.trim()
      });

      // Also update title in user's chat history
      const userChatHistoryRef = doc(db, "users", currentUser.uid, "chatHistory", chatId);
      await updateDoc(userChatHistoryRef, {
        title: title.trim()
      });

      console.log('Chat title updated successfully');
    } catch (error) {
      console.error('Error updating chat title:', error);
      // Revert to original title on error
      setTitle(initialTitle || 'Untitled Chat');
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    saveTitle();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTitle(initialTitle || 'Untitled Chat');
      setIsEditing(false);
    }
  };

  return (
    <div className="chat-title-container">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="chat-title-input"
          value={title}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          maxLength={50}
          placeholder="Enter chat title"
        />
      ) : (
        <h1 
          className="chat-title" 
          onClick={handleClick}
          title="Click to edit title"
        >
          {title}
          <span className="edit-icon">✏️</span>
        </h1>
      )}
    </div>
  );
};

export default ChatTitleEditor;