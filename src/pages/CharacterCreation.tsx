import React, { Component, MouseEvent, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './CharacterCreation.css';
import Sidebar from '../components/Sidebar';
import { getAuth } from 'firebase/auth';
import { CharacterService } from '../services/CharacterService';

// We'll create a functional wrapper component that provides navigate
const CharacterCreationWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <CharacterCreation return={() => navigate('/')} />;
};

type CharacterCreationProps = {
  // Return to the main page
  return: () => void;
}

// Type for the form data
type CharacterFormData = {
  name: string;
  age: string;
  gender: string;
  species: string;
  description: string;
  background: string;
  family: string;
  relationshipStatus: string;
  residence: string;
  job: string;
  appearance: string;
  talkingStyle: string;
  temperament: string;
  scenario: string;
  specialAbility: string;
  outfit: string;
  isPublic: boolean;
}

type CharacterCreationState = {
  openSection: string | null;
  formData: CharacterFormData;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
}

export class CharacterCreation extends Component<CharacterCreationProps, CharacterCreationState> {
  constructor(props: CharacterCreationProps) {
    super(props);
    this.state = {
      openSection: "basic", // Start with basic section open
      formData: {
        name: '',
        age: '',
        gender: '',
        species: 'Human',
        description: '',
        background: '',
        family: '',
        relationshipStatus: '',
        residence: '',
        job: '',
        appearance: '',
        talkingStyle: '',
        temperament: '',
        scenario: '',
        specialAbility: '',
        outfit: '',
        isPublic: true
      },
      isSubmitting: false,
      error: null,
      success: null
    };
  }

  toggleSection = (section: string) => {
    this.setState(prev => ({
      openSection: prev.openSection === section ? null : section
    }));
  };

  handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  };

  handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: checked
      }
    }));
  };

  validateForm = (): boolean => {
    const { name, description } = this.state.formData;
    
    if (!name.trim()) {
      this.setState({ error: "Character name is required" });
      return false;
    }
    
    if (!description.trim()) {
      this.setState({ error: "Character description is required" });
      return false;
    }
    
    return true;
  };

  handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }
    
    this.setState({ isSubmitting: true, error: null, success: null });
    
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        this.setState({ 
          error: "You must be logged in to create a character", 
          isSubmitting: false 
        });
        return;
      }
      
      // Create a new character document using CharacterService
      const characterData = {
        name: this.state.formData.name,
        age: parseInt(this.state.formData.age) || 0,
        gender: this.state.formData.gender,
        species: this.state.formData.species,
        characterDescription: this.state.formData.description,
        characterBackground: this.state.formData.background,
        family: this.state.formData.family,
        relationshipStatus: this.state.formData.relationshipStatus,
        residence: this.state.formData.residence,
        job: this.state.formData.job,
        appearance: this.state.formData.appearance,
        talkingStyle: this.state.formData.talkingStyle,
        temperament: this.state.formData.temperament,
        scenario: this.state.formData.scenario,
        specialAbility: this.state.formData.specialAbility,
        outfit: this.state.formData.outfit,
        isPublic: this.state.formData.isPublic,
        avatar: "", // Empty for now, would handle image upload separately
      };
      
      // Use the CharacterService to create the character
      const characterId = await CharacterService.createCharacter(characterData);
      console.log(`Character created with ID: ${characterId}`);
      
      this.setState({
        success: `Character "${this.state.formData.name}" created successfully with ID #${characterId}!`,
        isSubmitting: false,
        formData: {
          name: '',
          age: '',
          gender: '',
          species: 'Human',
          description: '',
          background: '',
          family: '',
          relationshipStatus: '',
          residence: '',
          job: '',
          appearance: '',
          talkingStyle: '',
          temperament: '',
          scenario: '',
          specialAbility: '',
          outfit: '',
          isPublic: true
        }
      });
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        this.props.return();
      }, 2000);
      
    } catch (error) {
      console.error("Error creating character:", error);
      this.setState({
        error: error instanceof Error ? error.message : "Error creating character",
        isSubmitting: false
      });
    }
  };

  render = (): JSX.Element => {
    const { openSection, formData, isSubmitting, error, success } = this.state;
    
    return (
      <div className="character-creation-page">
        {/* Sidebar */}
        <Sidebar doResetDashboard={() => {}} />

        {/* Main Content */}
        <div className="character-creation-main-content">
          <h1>Create a New Character</h1>
          
          {error && <div className="character-creation-error">{error}</div>}
          {success && <div className="character-creation-success">{success}</div>}
          
          <form onSubmit={this.handleFormSubmit}>
            {/* Basic Info Section */}
            <div className="character-creation-section">
              <div 
                className="character-creation-section-header" 
                onClick={() => this.toggleSection("basic")}
              >
                Basic Info
                <span className={`character-creation-section-arrow ${openSection === "basic" ? "open" : ""}`}>
                  ▶
                </span>
              </div>
              {openSection === "basic" && (
                <div className="character-creation-section-content">
                  <div className="form-field">
                    <label htmlFor="name">
                      Name: <span className="required">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      value={formData.name}
                      onChange={this.handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="age">Age:</label>
                    <input 
                      type="number" 
                      id="age" 
                      name="age" 
                      value={formData.age}
                      onChange={this.handleInputChange}
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="gender">Gender:</label>
                    <select 
                      id="gender" 
                      name="gender"
                      value={formData.gender}
                      onChange={this.handleInputChange}
                    >
                      <option value="" disabled>Select Option</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="species">Species:</label>
                    <input 
                      type="text" 
                      id="species" 
                      name="species" 
                      value={formData.species}
                      onChange={this.handleInputChange}
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="description">
                      Character description: <span className="required">*</span>
                    </label>
                    <textarea 
                      id="description" 
                      name="description" 
                      value={formData.description}
                      onChange={this.handleInputChange}
                      required
                      placeholder="Provide a general description of your character"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Personality Section */}
            <div className="character-creation-section">
              <div 
                className="character-creation-section-header" 
                onClick={() => this.toggleSection("personality")}
              >
                Personality & Background
                <span className={`character-creation-section-arrow ${openSection === "personality" ? "open" : ""}`}>
                  ▶
                </span>
              </div>
              {openSection === "personality" && (
                <div className="character-creation-section-content">
                  <div className="form-field">
                    <label htmlFor="background">Character background:</label>
                    <textarea 
                      id="background" 
                      name="background" 
                      value={formData.background}
                      onChange={this.handleInputChange}
                      placeholder="Describe your character's backstory and history"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="family">Family:</label>
                    <textarea 
                      id="family" 
                      name="family" 
                      value={formData.family}
                      onChange={this.handleInputChange}
                      placeholder="Describe your character's family relationships"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="temperament">Personality/Temperament:</label>
                    <textarea 
                      id="temperament" 
                      name="temperament" 
                      value={formData.temperament}
                      onChange={this.handleInputChange}
                      placeholder="Describe your character's personality traits"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="talkingStyle">Talking Style:</label>
                    <textarea 
                      id="talkingStyle" 
                      name="talkingStyle" 
                      value={formData.talkingStyle}
                      onChange={this.handleInputChange}
                      placeholder="Describe how your character speaks (formal, casual, accent, etc.)"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Details Section */}
            <div className="character-creation-section">
              <div 
                className="character-creation-section-header" 
                onClick={() => this.toggleSection("details")}
              >
                Additional Details
                <span className={`character-creation-section-arrow ${openSection === "details" ? "open" : ""}`}>
                  ▶
                </span>
              </div>
              {openSection === "details" && (
                <div className="character-creation-section-content">
                  <div className="form-field">
                    <label htmlFor="relationshipStatus">Relationship Status:</label>
                    <select 
                      id="relationshipStatus" 
                      name="relationshipStatus"
                      value={formData.relationshipStatus}
                      onChange={this.handleInputChange}
                    >
                      <option value="" disabled>Select Option</option>
                      <option value="Married">Married</option>
                      <option value="Engaged">Engaged</option>
                      <option value="Dating">Dating</option>
                      <option value="Single">Single</option>
                      <option value="Complicated">It's Complicated</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="residence">Residence:</label>
                    <input 
                      type="text" 
                      id="residence" 
                      name="residence" 
                      value={formData.residence}
                      onChange={this.handleInputChange}
                      placeholder="Where does your character live?"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="job">Job/Career:</label>
                    <input 
                      type="text" 
                      id="job" 
                      name="job" 
                      value={formData.job}
                      onChange={this.handleInputChange}
                      placeholder="What does your character do for a living?"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="appearance">Appearance:</label>
                    <textarea 
                      id="appearance" 
                      name="appearance" 
                      value={formData.appearance}
                      onChange={this.handleInputChange}
                      placeholder="Describe your character's physical appearance"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="outfit">Outfit/Clothing:</label>
                    <textarea 
                      id="outfit" 
                      name="outfit" 
                      value={formData.outfit}
                      onChange={this.handleInputChange}
                      placeholder="Describe what your character typically wears"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="specialAbility">Special Abilities:</label>
                    <textarea 
                      id="specialAbility" 
                      name="specialAbility" 
                      value={formData.specialAbility}
                      onChange={this.handleInputChange}
                      placeholder="Does your character have any special powers or abilities?"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Roleplay Settings */}
            <div className="character-creation-section">
              <div 
                className="character-creation-section-header" 
                onClick={() => this.toggleSection("roleplay")}
              >
                Roleplay Settings
                <span className={`character-creation-section-arrow ${openSection === "roleplay" ? "open" : ""}`}>
                  ▶
                </span>
              </div>
              {openSection === "roleplay" && (
                <div className="character-creation-section-content">
                  <div className="form-field">
                    <label htmlFor="scenario">Default Scenario:</label>
                    <textarea 
                      id="scenario" 
                      name="scenario" 
                      value={formData.scenario}
                      onChange={this.handleInputChange}
                      placeholder="Describe the default scenario for roleplay with this character"
                    />
                  </div>
                  
                  <div className="form-field checkbox-field">
                    <label htmlFor="isPublic">
                      <input 
                        type="checkbox" 
                        id="isPublic" 
                        name="isPublic" 
                        checked={formData.isPublic}
                        onChange={this.handleCheckboxChange}
                      />
                      Make this character publicly visible
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            <div className="character-creation-buttons">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={() => this.props.return()}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Character"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default CharacterCreationWrapper;