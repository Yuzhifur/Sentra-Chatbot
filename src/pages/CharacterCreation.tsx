import React, { Component, MouseEvent, ChangeEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './CharacterCreation.css';
import Sidebar from '../components/Sidebar';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, arrayUnion, getDoc, setDoc, deleteDoc, getDocs, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseService } from '../services/FirebaseService';
import { CharacterService } from '../services/CharacterService';
import { ImageGenService } from '../services/ImageGenService'; // NEW IMPORT

// Functional wrapper component that provides navigate and params
const CharacterCreationWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { characterId } = useParams(); // Get characterId from URL if in edit mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [characterData, setCharacterData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!characterId);

  useEffect(() => {
    // If characterId is provided, we're in edit mode
    if (characterId) {
      setIsEditMode(true);
      // Fetch character data
      const fetchCharacterData = async () => {
        try {
          const data = await FirebaseService.getCharacterById(characterId);
          setCharacterData(data);
        } catch (error) {
          console.error("Error fetching character data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCharacterData();
    }
  }, [characterId]);

  if (loading) {
    return (
      <div className="character-creation-page">
        <Sidebar doResetDashboard={() => {}} />
        <div className="character-creation-main-content">
          <div className="loading-spinner">Loading character data...</div>
        </div>
      </div>
    );
  }

  return (
    <CharacterCreation
      isEditMode={isEditMode}
      initialData={characterData}
      characterId={characterId}
      return={() => navigate('/')}
    />
  );
};

type CharacterCreationProps = {
  return: () => void;
  isEditMode: boolean;
  initialData: any | null;
  characterId?: string;
}

type CharacterCreationState = {
  openSection: string | null;
  // Basic Info
  name: string;
  age: number | '';
  gender: string;
  species: string;
  characterDescription: string;
  characterBackground: string;
  family: string;
  relationshipStatus: string;
  residence: string;
  job: string;
  appearance: string;
  originalTags: string[];
  tags: string[];
  tagInput: string;

  // Personality
  temperament: string;
  talkingStyle: string;

  // Advanced
  specialAbility: string;
  scenario: string;
  outfit: string;

  // UI State
  loading: boolean;
  error: string | null;
  success: string | null;
  avatarFile: File | null;
  avatarPreview: string | null;

  // NEW: Avatar Generation State
  generatingAvatar: boolean;
  generationError: string | null;
  generationHint: string;
}
export class CharacterCreation extends Component<CharacterCreationProps, CharacterCreationState> {
  constructor(props: CharacterCreationProps) {
    super(props);

    // Initialize state with either initial data (edit mode) or defaults (create mode)
    const initialData = props.initialData || {};

    this.state = {
      openSection: 'basic',
      // Basic Info
      name: initialData.name || '',
      age: initialData.age || '',
      gender: initialData.gender || '',
      species: initialData.species || '',
      characterDescription: initialData.characterDescription || '',
      characterBackground: initialData.characterBackground || '',
      family: initialData.family || '',
      relationshipStatus: initialData.relationshipStatus || '',
      residence: initialData.residence || '',
      job: initialData.job || '',
      appearance: initialData.appearance || '',
      originalTags: initialData.tags || [],
      tags: initialData.tags || [],
      tagInput: '',

      // Personality
      temperament: initialData.temperament || '',
      talkingStyle: initialData.talkingStyle || '',

      // Advanced
      specialAbility: initialData.specialAbility || '',
      scenario: initialData.scenario || '',
      outfit: initialData.outfit || '',

      // UI State
      loading: false,
      error: null,
      success: null,
      avatarFile: null,
      avatarPreview: initialData.avatar || null,

      // NEW: Avatar Generation State
      generatingAvatar: false,
      generationError: null,
      generationHint: 'Fill in character details to generate an AI avatar.'
    };
  }

  updateGenerationHint = () => {
    const characterData = {
      name: this.state.name,
      age: typeof this.state.age === 'number' ? this.state.age : undefined,
      gender: this.state.gender,
      species: this.state.species,
      characterDescription: this.state.characterDescription,
      temperament: this.state.temperament,
      appearance: this.state.appearance,
      outfit: this.state.outfit,
      job: this.state.job,
      specialAbility: this.state.specialAbility
    };

    const hint = ImageGenService.getGenerationHint(characterData);
    this.setState({ generationHint: hint });
  };


  handleGenerateAvatar = async () => {
    this.setState({
      generatingAvatar: true,
      generationError: null
    });

    try {
      const characterData = {
        name: this.state.name,
        age: typeof this.state.age === 'number' ? this.state.age : undefined,
        gender: this.state.gender,
        species: this.state.species,
        characterDescription: this.state.characterDescription,
        temperament: this.state.temperament,
        appearance: this.state.appearance,
        outfit: this.state.outfit,
        job: this.state.job,
        specialAbility: this.state.specialAbility
      };

      // Generate avatar file
      const avatarFile = await ImageGenService.generateAvatar(characterData);

      // Set the generated avatar as the current avatar
      this.setState({
        avatarFile: avatarFile,
        avatarPreview: URL.createObjectURL(avatarFile),
        generatingAvatar: false,
        generationError: null
      });

    } catch (error) {
      console.error('Avatar generation failed:', error);
      this.setState({
        generatingAvatar: false,
        generationError: error instanceof Error ? error.message : 'Failed to generate avatar'
      });
    }
  };

  // NEW: Check if generation button should be enabled
  isGenerationEnabled = (): boolean => {
    const characterData = {
      name: this.state.name,
      characterDescription: this.state.characterDescription,
      temperament: this.state.temperament
    };

    return ImageGenService.validateMinimumFields(characterData) && !this.state.generatingAvatar;
  };

  toggleSection = (section: string) => {
    this.setState(prev => ({
      openSection: prev.openSection === section ? null : section
    }));
  };

  handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'age') {
      this.setState({
        [name]: value === '' ? '' : parseInt(value, 10) || 0
      } as any, this.updateGenerationHint);
    } else {
      this.setState({
        [name]: value
      } as any, this.updateGenerationHint);
    }
  };

  handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      this.setState({
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file)
      });
    }
  };

  validateForm = (): boolean => {
    const { name, age, gender, characterDescription, temperament } = this.state;

    if (!name || !age || !gender || !characterDescription || !temperament) {
      this.setState({ error: 'Please fill in at least the required fields: Name, Age, Gender, Character Description, and Temperament' });
      return false;
    }

    if (typeof age !== 'number') {
      this.setState({ error: 'Please enter a valid age' });
      return false;
    }

    return true;
  };

  uploadAvatar = async (characterId: string): Promise<string> => {
    if (!this.state.avatarFile) {
      // If no new avatar file but we're in edit mode, return the existing avatar URL
      if (this.props.isEditMode && this.props.initialData?.avatar) {
        return this.props.initialData.avatar;
      }
      return '';
    }

    const storage = getStorage();
    const storageRef = ref(storage, `characters/${characterId}/avatar.jpg`);

    await uploadBytes(storageRef, this.state.avatarFile);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  };

  // methods for hangling tags:
  handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value.replace(/[#,]/g, "");
    this.setState({ tagInput: filtered });
  };

  handleAddTag = () => {
    const newTag = this.state.tagInput.trim().toLowerCase();

    if (!newTag || this.state.tags.includes(newTag)) return;

    this.setState(prev => ({
      tags: [...prev.tags, newTag],
      tagInput: ''
    }));
  };

  handleRemoveTag = (tagToRemove: string) => {
    this.setState(prev => ({
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  doSubmitClick = async (_evt: MouseEvent<HTMLButtonElement>): Promise<void> => {
    if (!this.validateForm()) return;

    this.setState({ loading: true, error: null, success: null });

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to create or edit a character');
      }

      const db = getFirestore();

      if (this.props.isEditMode && this.props.characterId) {
        // Edit existing character
        const characterRef = doc(db, 'characters', this.props.characterId);

        // Upload avatar if provided
        let avatarURL = '';
        if (this.state.avatarFile) {
          avatarURL = await this.uploadAvatar(this.props.characterId);
        } else if (this.props.initialData?.avatar) {
          avatarURL = this.props.initialData.avatar;
        }

        // Update character document
        await updateDoc(characterRef, {
          name: this.state.name,
          age: typeof this.state.age === 'number' ? this.state.age : parseInt(this.state.age.toString(), 10) || 0,
          gender: this.state.gender,
          species: this.state.species || '',
          characterDescription: this.state.characterDescription,
          characterBackground: this.state.characterBackground || '',
          family: this.state.family || '',
          relationshipStatus: this.state.relationshipStatus || '',
          residence: this.state.residence || '',
          job: this.state.job || '',
          appearance: this.state.appearance || '',
          temperament: this.state.temperament,
          talkingStyle: this.state.talkingStyle || '',
          specialAbility: this.state.specialAbility || '',
          scenario: this.state.scenario || '',
          outfit: this.state.outfit || '',
          tags: this.state.tags,
          ...(avatarURL ? { avatar: avatarURL } : {})
        });

        const characterId = this.props.characterId!;
        const newTags = this.state.tags;
        const oldTags = this.state.originalTags;

        // Tags to add and remove
        const addedTags = newTags.filter(tag => !oldTags.includes(tag));
        const removedTags = oldTags.filter(tag => !newTags.includes(tag));

        // Add new tags to global tag collection
        for (const tag of addedTags) {
          const tagRef = doc(db, 'tags', tag);
          const tagCharRef = doc(tagRef, 'characters', characterId);
          await setDoc(tagRef, {
            tagName: tag,
            characterCount: increment(1)
          }, { merge: true });
          await setDoc(tagCharRef, { id:this.props.initialData?.id });
        }

        // Remove tags from global tag collection
        for (const tag of removedTags) {
          const tagRef = doc(db, 'tags', tag);
          const tagCharRef = doc(tagRef, 'characters', characterId);
          await deleteDoc(tagCharRef);
          await updateDoc(tagRef, {
            characterCount: increment(-1)
          });
          const remaining = await getDocs(collection(tagRef, 'characters'));
          if (remaining.empty) {
            await deleteDoc(tagRef);
            console.log(`Tag "${tag}" deleted because it had no more characters.`);
          }
        }

        this.setState({
          success: 'Character updated successfully!',
          loading: false
        });
      } else {
        // Create new character

        // Get the next character ID
        const nextId = await FirebaseService.getNextCharacterId();

        // Get user data for author info
        const userData = await FirebaseService.getUserData(currentUser.uid);
        if (!userData) {
          throw new Error('Unable to fetch user data');
        }

        // Create character document
        const characterData = {
          // Basic Info
          id: nextId.toString(),
          name: this.state.name,
          age: typeof this.state.age === 'number' ? this.state.age : parseInt(this.state.age.toString(), 10) || 0,
          gender: this.state.gender,
          species: this.state.species || '',
          characterDescription: this.state.characterDescription,
          characterBackground: this.state.characterBackground || '',
          family: this.state.family || '',
          relationshipStatus: this.state.relationshipStatus || '',
          residence: this.state.residence || '',
          job: this.state.job || '',
          appearance: this.state.appearance || '',
          tags: this.state.tags || '',

          // Personality
          temperament: this.state.temperament,
          talkingStyle: this.state.talkingStyle || '',

          // Advanced
          specialAbility: this.state.specialAbility || '',
          scenario: this.state.scenario || '',
          outfit: this.state.outfit || '',

          // Author Info
          authorID: currentUser.uid,
          authorUsername: userData.username,
          authorDisplayName: userData.displayName,

          // Metadata
          createdAt: new Date(),
          isPublic: true, // Default to public
          avatar: '', // Will be updated after upload
        };

        // Add character to Firestore
        const charactersRef = collection(db, 'characters');
        const newCharacterRef = await addDoc(charactersRef, characterData);

        // Add the tags to Firestore
        for (const tag of this.state.tags) {
          const tagRef = doc(db, 'tags', tag);
          const tagCharRef = doc(tagRef, 'characters', newCharacterRef.id);

          await setDoc(tagRef, {
            tagName: tag,
            characterCount: increment(1)
          }, { merge: true });
          await setDoc(tagCharRef, { id: characterData.id });
        }

        // Upload avatar if provided
        let avatarURL = '';
        if (this.state.avatarFile) {
          avatarURL = await this.uploadAvatar(newCharacterRef.id);

          // Update character with avatar URL
          await updateDoc(newCharacterRef, { avatar: avatarURL });
        }

        // Add character ID to user's character list
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          userCharacters: arrayUnion(newCharacterRef.id)
        });

        this.setState({
          success: 'Character created successfully!',
          loading: false
        });
      }

      // Redirect to home after 2 seconds
      setTimeout(() => {
        this.props.return();
      }, 2000);

    } catch (error: any) {
      console.error('Error creating/updating character:', error);
      this.setState({
        error: error.message || 'Failed to save character. Please try again.',
        loading: false
      });
    }
  };

  render = (): JSX.Element => {
    const { isEditMode } = this.props;

    return (
      <div className="character-creation-page">
        {/* Sidebar */}
        <Sidebar doResetDashboard={() => { }} />

        {/* Main Content */}
        <div className="character-creation-main-content">
          <h1>{isEditMode ? 'Edit Character' : 'Welcome to Character Creation'}</h1>

          {/* Status Messages */}
          {this.state.error && <div className="error-message">{this.state.error}</div>}
          {this.state.success && <div className="success-message">{this.state.success}</div>}

          {/* Basic Info Section */}
          <div className="charaacter-creation-section">
            <div
              className={`charaacter-creation-section-header ${this.state.openSection === "basic" ? "open" : ""}`}
              onClick={() => this.toggleSection("basic")}
            >
              Basic Info *
              <span className={`charaacter-creation-section-arrow ${this.state.openSection === "basic" ? "open" : ""}`}>
                ▶
              </span>
            </div>
            {this.state.openSection === "basic" && (
              <div className="charaacter-creation-section-content">

                {/* UPDATED: Avatar Upload Section with Generation */}
                <div className="form-group">
                  <label>Character Avatar:</label>
                  <div className="avatar-upload-container">

                    {/* Generation Section */}
                    <div className="avatar-generation-section">
                      <div className="generation-controls">
                        <button
                          type="button"
                          className="generate-avatar-button"
                          onClick={this.handleGenerateAvatar}
                          disabled={!this.isGenerationEnabled()}
                        >
                          {this.state.generatingAvatar ? (
                            <>
                              <span className="loading-spinner">⏳</span>
                              Generating Avatar...
                            </>
                          ) : (
                            <>
                              <span className="ai-icon">🎨</span>
                              Generate AI Avatar
                            </>
                          )}
                        </button>

                        <div className="generation-hint">
                          💡 {this.state.generationHint}
                        </div>
                      </div>

                      {/* Generation Error */}
                      {this.state.generationError && (
                        <div className="generation-error">
                          ⚠️ {this.state.generationError}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="upload-divider">
                      <span>OR</span>
                    </div>

                    {/* Traditional Upload */}
                    <div className="traditional-upload-section">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={this.handleAvatarChange}
                        style={{ marginBottom: '10px' }}
                      />
                      <div className="upload-help-text">
                        Upload your own image file
                      </div>
                    </div>

                    {/* Avatar Preview */}
                    {this.state.avatarPreview && (
                      <div className="avatar-preview-container">
                        <img
                          src={this.state.avatarPreview}
                          alt="Avatar preview"
                          className="avatar-preview"
                        />
                        <div className="avatar-preview-label">
                          {this.state.avatarFile?.name?.includes('_avatar.png') ?
                            'AI Generated Avatar' : 'Uploaded Avatar'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Name: *</label>
                  <input
                    type="text"
                    name="name"
                    value={this.state.name}
                    onChange={this.handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Age: *</label>
                  <input
                    type="number"
                    name="age"
                    value={this.state.age}
                    onChange={this.handleInputChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Gender: *</label>
                  <select name="gender" value={this.state.gender} onChange={this.handleInputChange} required>
                    <option value="">Select Option</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Species:</label>
                  <input
                    type="text"
                    name="species"
                    value={this.state.species}
                    onChange={this.handleInputChange}
                    placeholder="e.g., Human, Elf, Dragon, etc."
                  />
                </div>

                <div className="form-group">
                  <label>Character Description: *</label>
                  <textarea
                    name="characterDescription"
                    value={this.state.characterDescription}
                    onChange={this.handleInputChange}
                    placeholder="Brief description of the character..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Character Background:</label>
                  <textarea
                    name="characterBackground"
                    value={this.state.characterBackground}
                    onChange={this.handleInputChange}
                    placeholder="Character's history and backstory..."
                  />
                </div>

                <div className="form-group">
                  <label>Family:</label>
                  <textarea
                    name="family"
                    value={this.state.family}
                    onChange={this.handleInputChange}
                    placeholder="Information about family members..."
                  />
                </div>

                <div className="form-group">
                  <label>Relationship Status:</label>
                  <select name="relationshipStatus" value={this.state.relationshipStatus} onChange={this.handleInputChange}>
                    <option value="">Select Option</option>
                    <option value="Single">Single</option>
                    <option value="Dating">Dating</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Residence:</label>
                  <input
                    type="text"
                    name="residence"
                    value={this.state.residence}
                    onChange={this.handleInputChange}
                    placeholder="Where does the character live?"
                  />
                </div>

                <div className="form-group">
                  <label>Job/Career:</label>
                  <input
                    type="text"
                    name="job"
                    value={this.state.job}
                    onChange={this.handleInputChange}
                    placeholder="What is their occupation?"
                  />
                </div>

                {/* UPDATED: Appearance with Avatar Generation Hint */}
                <div className="form-group">
                  <label>Appearance:</label>
                  <textarea
                    name="appearance"
                    value={this.state.appearance}
                    onChange={this.handleInputChange}
                    placeholder="Physical description of the character..."
                  />
                  <div className="field-help-text">
                    💡 This directly improves AI avatar quality
                  </div>
                </div>

                <div className="form-group">
                  <label>Tags:</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={this.state.tagInput}
                      onChange={this.handleTagInputChange}
                      placeholder="Enter a tag"
                    />
                    <button type="button" onClick={this.handleAddTag}>Add</button>
                  </div>

                  <div className="tag-chip-container">
                    {this.state.tags.map(tag => (
                      <span key={tag} className="tag-chip">
                        #{tag}
                        <button onClick={() => this.handleRemoveTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Personality Section - IMPORTANT for generation */}
          <div className="charaacter-creation-section">
            <div
              className={`charaacter-creation-section-header ${this.state.openSection === "personality" ? "open" : ""}`}
              onClick={() => this.toggleSection("personality")}
            >
              Personality *
              <span className="generation-importance">⭐ Important for AI Avatar</span>
              <span className={`charaacter-creation-section-arrow ${this.state.openSection === "personality" ? "open" : ""}`}>
                ▶
              </span>
            </div>
            {this.state.openSection === "personality" && (
              <div className="charaacter-creation-section-content">
                <div className="form-group">
                  <label>Temperament: *</label>
                  <textarea
                    name="temperament"
                    value={this.state.temperament}
                    onChange={this.handleInputChange}
                    placeholder="Character's personality traits and general disposition..."
                    required
                  />
                  <div className="field-help-text">
                    💡 Essential for generating character's facial expression and demeanor
                  </div>
                </div>

                <div className="form-group">
                  <label>Talking Style:</label>
                  <textarea
                    name="talkingStyle"
                    value={this.state.talkingStyle}
                    onChange={this.handleInputChange}
                    placeholder="How does the character speak? (e.g., formal, casual, uses slang, etc.)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advanced Section - HELPFUL for generation */}
          <div className="charaacter-creation-section">
            <div
              className={`charaacter-creation-section-header ${this.state.openSection === "advanced" ? "open" : ""}`}
              onClick={() => this.toggleSection("advanced")}
            >
              Advanced
              <span className="generation-helpful">✨ Helpful for AI Avatar</span>
              <span className={`charaacter-creation-section-arrow ${this.state.openSection === "advanced" ? "open" : ""}`}>
                ▶
              </span>
            </div>
            {this.state.openSection === "advanced" && (
              <div className="charaacter-creation-section-content">
                <div className="form-group">
                  <label>Special Ability:</label>
                  <textarea
                    name="specialAbility"
                    value={this.state.specialAbility}
                    onChange={this.handleInputChange}
                    placeholder="Any special powers or abilities..."
                  />
                </div>

                <div className="form-group">
                  <label>Default Scenario:</label>
                  <textarea
                    name="scenario"
                    value={this.state.scenario}
                    onChange={this.handleInputChange}
                    placeholder="The default scenario for roleplaying with this character..."
                  />
                </div>

                <div className="form-group">
                  <label>Outfit:</label>
                  <textarea
                    name="outfit"
                    value={this.state.outfit}
                    onChange={this.handleInputChange}
                    placeholder="What does the character typically wear?"
                  />
                  <div className="field-help-text">
                    💡 This helps generate appropriate clothing and accessories in the avatar
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            onClick={this.doSubmitClick}
            disabled={this.state.loading}
            className="submit-button"
          >
            {this.state.loading ?
              (isEditMode ? 'Updating Character...' : 'Creating Character...') :
              (isEditMode ? 'Update Character' : 'Create Character')}
          </button>
        </div>
      </div>
    )
  }
}

export default CharacterCreationWrapper;