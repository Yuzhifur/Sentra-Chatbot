import React, { Component } from 'react';
import { useNavigate } from 'react-router-dom';
import './CharacterCreation.css';

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
  // Add state properties as needed
}

export class CharacterCreation extends Component<CharacterCreationProps, CharacterCreationState> {
  constructor(props: CharacterCreationProps) {
    super(props);
    // Initialize state if needed
  }

  render = (): JSX.Element => {
    return (
      <div className="character-creation">
        <h1>Welcome to Character Creation!</h1>
        <p>Create your own unique character for immersive AI roleplay experiences.</p>
        <button className="back-button" onClick={this.props.return}>Back to Home</button>
      </div>
    );
  }
}

export default CharacterCreationWrapper;