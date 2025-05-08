import React, { Component, FormEvent, ChangeEvent } from 'react';
import { FirebaseService } from '../services/FirebaseService';
import './Auth.css';

type LoginProps = {
  doSwitchToCreateAccount: () => void;
  doSwitchToResetPassword: () => void;
};

type LoginState = {
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
};

export class Login extends Component<LoginProps, LoginState> {
  constructor(props: LoginProps) {
    super(props);

    this.state = {
      email: '',
      password: '',
      error: null,
      loading: false
    };
  }

  doEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ email: e.target.value });
  };

  doPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ password: e.target.value });
  };

  updateLastLogin = async (userId: string): Promise<void> => {
    try {
      await FirebaseService.updateUserLastLogin(userId);
    } catch (error) {
      console.error("Error updating last login:", error);
      // We don't throw here because login should still succeed even if updating timestamp fails
    }
  };

  doSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const { email, password } = this.state;

    if (!email || !password) {
      this.setState({ error: 'Please enter both email and password' });
      return;
    }

    try {
      this.setState({ loading: true, error: null });

      // Sign in the user
      const user = await FirebaseService.signIn(email, password);

      // Update last login timestamp
      await this.updateLastLogin(user.uid);
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to login. Please check your email and password.';

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }

      this.setState({
        error: errorMessage,
        loading: false
      });
    }
  };

  render() {
    const { email, password, error, loading } = this.state;
    const { doSwitchToCreateAccount, doSwitchToResetPassword } = this.props;

    return (
      <div className="login-container">
        <div className="login-form-wrapper">
          <h1 className="login-title">Sentra</h1>
          <h2 className="login-subtitle">Immersive Roleplay Chatbot</h2>

          <form className="login-form" onSubmit={this.doSubmit}>
            {error && <div className="login-error">{error}</div>}

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
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="login-links">
              <button
                type="button"
                className="text-button"
                onClick={doSwitchToCreateAccount}
                disabled={loading}
              >
                Create a new account
              </button>
              <button
                type="button"
                className="text-button"
                onClick={doSwitchToResetPassword}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}