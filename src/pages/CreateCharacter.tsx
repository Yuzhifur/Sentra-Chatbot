import React, { Component, FormEvent, ChangeEvent } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import './Auth.css';

type CreateCharacterProps = {
  doResetDashboard: () => void; // Function to switch back to login page
};

type CreateCharacterState = {
    email: string;
  };

export class CreateCharacter extends Component<CreateCharacterProps, CreateCharacterState> {
  constructor(props: CreateCharacterProps) {
    super(props);

    this.state = {
      email: '',
    };
  }
}