import React, { Component } from 'react';

type CharacterCreationprops = {
    // Return to the main page
    return: () => void;
}

type CharacterCreationState = {
    
}

export class CharacterCreation extends Component<CharacterCreationprops, CharacterCreationState> {
    constructor(props: CharacterCreationprops) {
        super(props);
        
    }

    render = (): JSX.Element => {
        return <div>
            <h1>Welcome to Character Creation!</h1>
        </div>
    
    }
}
