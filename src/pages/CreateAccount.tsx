import React, { Component, FormEvent, ChangeEvent } from 'react';
import { FirebaseService } from '../services/FirebaseService';
import './Auth.css';

type CreateAccountProps = {
  doSwitchToLogin: () => void; // Function to switch back to login page
};

type CreateAccountState = {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  error: string | null;
  loading: boolean;
  checkingUsername: boolean;
};

export class CreateAccount extends Component<CreateAccountProps, CreateAccountState> {
  constructor(props: CreateAccountProps) {
    super(props);

    this.state = {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      error: null,
      loading: false,
      checkingUsername: false
    };
  }

  doEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ email: e.target.value });
  };

  doPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ password: e.target.value });
  };

  doConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ confirmPassword: e.target.value });
  };

  doUsernameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ username: e.target.value });
  };

  // Check if username is already taken
  checkUsernameUnique = async (username: string): Promise<boolean> => {
    if (!username) return false;

    try {
      this.setState({ checkingUsername: true });
      // The service will check case-insensitively
      return await FirebaseService.isUsernameAvailable(username);
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    } finally {
      this.setState({ checkingUsername: false });
    }
  };

  doSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const { email, password, confirmPassword, username } = this.state;

    // Basic validation
    if (!email || !password || !confirmPassword || !username) {
      this.setState({ error: 'Please fill in all fields' });
      return;
    }

    if (password !== confirmPassword) {
      this.setState({ error: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      this.setState({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (username.length < 3) {
      this.setState({ error: 'Username must be at least 3 characters' });
      return;
    }

    // Check if username is already taken (case-insensitive check)
    const isUsernameUnique = await this.checkUsernameUnique(username);
    if (!isUsernameUnique) {
      this.setState({ error: 'Username is already taken' });
      return;
    }

    try {
      this.setState({ loading: true, error: null });

      // Create Firebase Authentication account
      const user = await FirebaseService.createAccount(email, password);

      // Create user document in Firestore with chatHistory subcollection
      // The FirebaseService will store the username in lowercase
      await FirebaseService.createUserDocument(user.uid, {
        username, // Will be converted to lowercase in the service
        displayName: username, // Keep original case for display
        email,
        userAvatar: "",
        userDescription: "",
        userCharacters: [],
        userLikedCharacters: [],
        friendCount: 0, // Initialize friend count to 0
      });

      // Auth state change will handle redirect
    } catch (error: any) {
      console.error('Account creation error:', error);
      let errorMessage = 'Failed to create account';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }

      this.setState({
        error: errorMessage,
        loading: false
      });
    }
  };

  render() {
    const { email, password, confirmPassword, username, error, loading, checkingUsername } = this.state;
    const { doSwitchToLogin } = this.props;

    return (
      <div className="login-container">
        <div className="login-form-wrapper">
          <h1 className="login-title">Sentra</h1>
          <h2 className="login-subtitle">Create Account</h2>

          <form className="login-form" onSubmit={this.doSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={this.doUsernameChange}
                disabled={loading || checkingUsername}
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={this.doEmailChange}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={this.doPasswordChange}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="login-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={this.doConfirmPasswordChange}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading || checkingUsername}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="login-links">
              <button
                type="button"
                className="text-button"
                onClick={doSwitchToLogin}
                disabled={loading}
              >
                Already have an account? Login instead
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}