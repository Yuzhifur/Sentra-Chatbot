import React, { Component } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseService } from './services/FirebaseService';
import { initializeDefaultCharacter } from './services/InitDefaultCharacter';
import { Login } from './pages/Login';
import { CreateAccount } from './pages/CreateAccount';
import { ResetPassword } from './pages/ResetPassword';
import ChatWrapper from './pages/Chat';
import Home from './pages/Home';
import Sidebar from './components/Sidebar';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserProfile from './pages/UserProfile';
import CharacterCreationWrapper from './pages/CharacterCreation';
import './App.css';

type AppProps = {};

type AppState = {
  user: User | null;
  loading: boolean;
  authView: 'login' | 'createAccount' | 'resetPassword';
};

export class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);

    this.state = {
      user: null,
      loading: true,
      authView: 'login',
    };
  }

  componentDidMount() {
    // Hide firebase welcome content when react app mounts
    const messageEl = document.getElementById('message');
    const loadEl = document.getElementById('load');

    if (messageEl) messageEl.style.display = 'none';
    if (loadEl) loadEl.style.display = 'none';

    // Initialize the default character
    initializeDefaultCharacter()
      .then(created => {
        if (created) {
          console.log("Default character initialized for first-time use");
        }
      })
      .catch(error => {
        console.error("Error initializing default character:", error);
      });

    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update last login timestamp when user is already authenticated
        try {
          await FirebaseService.updateUserLastLogin(user.uid);
        } catch (error) {
          console.error("Error updating last login on app mount:", error);
        }
      }

      this.setState({
        user,
        loading: false
      });
    });
  }

  doSwitchToLogin = () => {
    this.setState({ authView: 'login' });
  };

  doSwitchToCreateAccount = () => {
    this.setState({ authView: 'createAccount' });
  };

  doSwitchToResetPassword = () => {
    this.setState({ authView: 'resetPassword' });
  };

  doLogout = async () => {
    try {
      await FirebaseService.logOut();
      // Auth state change will handle redirect
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Keeping this method for compatibility
  doResetDashboard = () => {};

  renderAuthContent() {
    const { authView } = this.state;

    switch (authView) {
      case 'createAccount':
        return <CreateAccount doSwitchToLogin={this.doSwitchToLogin} />;
      case 'resetPassword':
        return <ResetPassword doSwitchToLogin={this.doSwitchToLogin} />;
      case 'login':
      default:
        return <Login
          doSwitchToCreateAccount={this.doSwitchToCreateAccount}
          doSwitchToResetPassword={this.doSwitchToResetPassword}
        />;
    }
  }

  renderContent() {
    const { user, loading } = this.state;

    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    if (!user) {
      return this.renderAuthContent();
    }

    return (
      <div className="dashboard-container">
        <div className='sidebar'>
          <Sidebar doResetDashboard={this.doResetDashboard} />
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/chat" element={<ChatWrapper />} />
            <Route path="/chat/:characterId" element={<ChatWrapper />} />
            <Route path="/chat/:characterId/:sessionId" element={<ChatWrapper />} />
            <Route path="/character-creation" element={<CharacterCreationWrapper />} />
            <Route path="/character-edit/:characterId" element={<CharacterCreationWrapper />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="app">
        {this.renderContent()}
      </div>
    );
  }
}