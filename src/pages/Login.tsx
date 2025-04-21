import React, { Component, FormEvent, ChangeEvent } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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

  doSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const { email, password } = this.state;

    if (!email || !password) {
      this.setState({ error: 'Please enter both email and password' });
      return;
    }

    try {
      this.setState({ loading: true, error: null });
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      this.setState({
        error: 'Failed to login. Please check your email and password.',
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