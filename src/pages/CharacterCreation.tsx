import React, { Component , MouseEvent} from 'react';
import { useNavigate } from 'react-router-dom';
import './CharacterCreation.css';
import Sidebar from '../components/Sidebar';

// We'll create a functional wrapper component that provides navigate
const CharacterCreationWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <CharacterCreation return={() => navigate('/')} />;
};

type CharacterCreationProps = {
  // Return to the main page
  return: () => void;
}

type CharacterCreationState = {
    openSection: string | null;
}

export class CharacterCreation extends Component<CharacterCreationProps, CharacterCreationState> {
    constructor(props: CharacterCreationProps) {
        super(props);
        this.state = {
            openSection: null,
        };

    }

    toggleSection = (section: string) => {
        this.setState(prev => ({
            openSection: prev.openSection === section ? null : section
        }));
    };

    render = (): JSX.Element => {
        return (
            <div className="character-creation-page">
                {/* Sidebar */}
                <Sidebar doResetDashboard={() => { }} />

                {/* Main Content */}
                <div className="character-creation-main-content">
                    <h1>Welcome to Character Creation</h1>

                    <div className="character-creation-section">
                        <div className="character-creation-section-header" onClick={() => this.toggleSection("basic")}>
                            Basic Info
                            <span className={`character-creation-section-arrow ${this.state.openSection === "basic" ? "open" : ""}`}>
                                ▶
                            </span>
                        </div>
                        {this.state.openSection === "basic" && (
                            <div className="character-creation-section-content">
                                <p>
                                    <label>
                                        Name:
                                        <input type="text" name="name" />
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Age:
                                        <input type="number" name="age" />
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Gender:
                                        <select>
                                            <option value="" selected disabled>Select Option</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Species:
                                        <input type="text" name="species" />
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Character description:
                                        <textarea name="descripton" />
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Character background:
                                        <textarea name="background" />
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Family:
                                        <textarea name="family" />
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Relationship Status:
                                        <select>
                                            <option value="" selected disabled>Select Option</option>
                                            <option value="Married">Married</option>
                                            <option value="Engaged">Engaged</option>
                                            <option value="Dating">Dating</option>
                                            <option value="Single">Single</option>
                                        </select>
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Residence:
                                        <input type="text" name="residence" />
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Job/Career:
                                        <input type="text" name="career" />
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        Appearance:
                                        <textarea name="appearance" />
                                    </label>
                                </p>


                            </div>
                        )}
                        <div className="character-creation-section-header" onClick={() => this.toggleSection("personality")}>
                            Personality
                            <span className={`character-creation-section-arrow ${this.state.openSection === "personality" ? "open" : ""}`}>
                                ▶
                            </span>
                        </div>
                        {this.state.openSection === "personality" && (
                            <div className="character-creation-section-content">
                                <p>
                                    <label>
                                        Personality Traits:
                                        <input type="text" name="name" />
                                    </label>
                                </p>
                            </div>
                        )}
                        <div className="character-creation-section-header" onClick={() => this.toggleSection("skills")}>
                            Skills & Attributes
                            <span className={`character-creation-section-arrow ${this.state.openSection === "skills" ? "open" : ""}`}>
                                ▶
                            </span>
                        </div>
                        {this.state.openSection === "skills" && (
                            <div className="character-creation-section-content">
                                <p>
                                    <label>
                                        Skills:
                                        <input type="text" name="name" />
                                    </label>
                                </p>
                            </div>
                        )}
                        <div className="character-creation-section-header" onClick={() => this.toggleSection("social")}>
                            Social Alignment
                            <span className={`character-creation-section-arrow ${this.state.openSection === "social" ? "open" : ""}`}>
                                ▶
                            </span>
                        </div>
                        {this.state.openSection === "social" && (
                            <div className="character-creation-section-content">
                                <p>
                                    <label>
                                        Moral Alignment:
                                        <input type="text" name="name" />
                                    </label>
                                </p>
                            </div>
                        )}
                    </div>

                    <button type="submit" onClick={(e) => this.doSubmitClick(e)}>Create Character</button>
                </div>

                
            </div>
        )

    }

    doReturnOnClick = (_evt: MouseEvent<HTMLButtonElement>): void => {
        this.props.return();
    }

    doSubmitClick = (_evt: MouseEvent<HTMLButtonElement>): void => {
        //
    }
}

export default CharacterCreationWrapper;