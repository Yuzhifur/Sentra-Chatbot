import React, { Component, MouseEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './CharacterCreation.css';
import Sidebar from '../components/Sidebar';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseService } from '../services/FirebaseService';

// Functional wrapper component that provides navigate
const CharacterCreationWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <CharacterCreation return={() => navigate('/')} />;
};

type CharacterCreationProps = {
  return: () => void;
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
}

export class CharacterCreation extends Component<CharacterCreationProps, CharacterCreationState> {
  constructor(props: CharacterCreationProps) {
    super(props);
    this.state = {
      openSection: 'basic',
      // Basic Info
      name: '',
      age: '',
      gender: '',
      species: '',
      characterDescription: '',
      characterBackground: '',
      family: '',
      relationshipStatus: '',
      residence: '',
      job: '',
      appearance: '',
      
      // Personality
      temperament: '',
      talkingStyle: '',
      
      // Advanced
      specialAbility: '',
      scenario: '',
      outfit: '',
      
      // UI State
      loading: false,
      error: null,
      success: null,
      avatarFile: null,
      avatarPreview: null,
    };
  }

  toggleSection = (section: string) => {
    this.setState(prev => ({
      openSection: prev.openSection === section ? null : section
    }));
  };

  handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'age') {
      // Handle age as number or empty string
      this.setState({
        [name]: value === '' ? '' : parseInt(value, 10) || 0
      } as any);
    } else {
      this.setState({
        [name]: value
      } as any);
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
    
    if (typeof age === 'number' && (age < 0 || age > 999)) {
      this.setState({ error: 'Please enter a valid age' });
      return false;
    }
    
    return true;
  };

  uploadAvatar = async (characterId: string): Promise<string> => {
    if (!this.state.avatarFile) return '';
    
    const storage = getStorage();
    const storageRef = ref(storage, `characters/${characterId}/avatar.jpg`);
    
    await uploadBytes(storageRef, this.state.avatarFile);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  };

  doSubmitClick = async (_evt: MouseEvent<HTMLButtonElement>): Promise<void> => {
    if (!this.validateForm()) return;
    
    this.setState({ loading: true, error: null, success: null });
    
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('You must be logged in to create a character');
      }
      
      const db = getFirestore();
      
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
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        this.props.return();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating character:', error);
      this.setState({
        error: error.message || 'Failed to create character. Please try again.',
        loading: false
      });
    }
  };

  render = (): JSX.Element => {
    return (
      <div className="character-creation-page">
        {/* Sidebar */}
        <Sidebar doResetDashboard={() => { }} />

        {/* Main Content */}
        <div className="character-creation-main-content">
          <h1>Welcome to Character Creation</h1>
          
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
                <div className="form-group">
                  <label>Character Avatar:</label>
                  <div className="avatar-upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={this.handleAvatarChange}
                      style={{ marginBottom: '10px' }}
                    />
                    {this.state.avatarPreview && (
                      <img 
                        src={this.state.avatarPreview} 
                        alt="Avatar preview" 
                        className="avatar-preview"
                      />
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
                
                <div className="form-group">
                  <label>Appearance:</label>
                  <textarea
                    name="appearance"
                    value={this.state.appearance}
                    onChange={this.handleInputChange}
                    placeholder="Physical description of the character..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Personality Section */}
          <div className="charaacter-creation-section">
            <div 
              className={`charaacter-creation-section-header ${this.state.openSection === "personality" ? "open" : ""}`}
              onClick={() => this.toggleSection("personality")}
            >
              Personality *
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

          {/* Advanced Section */}
          <div className="charaacter-creation-section">
            <div 
              className={`charaacter-creation-section-header ${this.state.openSection === "advanced" ? "open" : ""}`}
              onClick={() => this.toggleSection("advanced")}
            >
              Advanced
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
            {this.state.loading ? 'Creating Character...' : 'Create Character'}
          </button>
        </div>
      </div>
    )
  }
}

export default CharacterCreationWrapper;