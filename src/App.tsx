import React, { Component } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Login } from './pages/Login';
import { CreateAccount } from './pages/CreateAccount';
import { ResetPassword } from './pages/ResetPassword';
import { Chat } from './pages/Chat';
import { Home } from './pages/Home';
import Sidebar from './components/Sidebar';
import './App.css';

type AppProps = {};

type AppState = {
  user: User | null;
  loading: boolean;
  authView: 'login' | 'createAccount' | 'resetPassword';
  dashboardContent: 'default' | 'chat' | 'characterCreation'; // Added new content type
};

export class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);

    this.state = {
      user: null,
      loading: true,
      authView: 'login',
      dashboardContent: 'default',
    };
  }

  componentDidMount() {
    // Hide firebase welcome content when react app mounts
    const messageEl = document.getElementById('message');
    const loadEl = document.getElementById('load');

    if (messageEl) messageEl.style.display = 'none';
    if (loadEl) loadEl.style.display = 'none';

    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      this.setState({
        user,
        loading: false
      });
    });
  }

  doSwitchToMainPage = (): void => {
    this.setState({dashboardContent: 'default'})
  }

  doSwitchToChatPage = (): void => {
    this.setState({dashboardContent: 'chat'})
  }

  doSwitchToCharacterCreation = (): void => {
    this.setState({dashboardContent: 'characterCreation'})
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

  doResetDashboard = () => {
    this.setState({ dashboardContent: 'default' });
  };

  doSwitchToCreateCharacter = () => {
    this.setState({ dashboardContent: 'characterCreation' });
  };

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

  renderDashboardContent() {
    const { user, dashboardContent } = this.state;

    switch (dashboardContent) {
      case 'chat':
        return <Chat return={this.doSwitchToMainPage}/>;
      case 'characterCreation':
        // Character creation component will be implemented later
        return (
          <div className="dashboard">
            <h1>Character Creation</h1>
            <p>Character creation interface will go here.</p>
            <button onClick={this.doSwitchToMainPage}>Back to Home</button>
          </div>
        );
      case 'default':
      default:
        return <Home />;
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
          {this.renderDashboardContent()}
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

export default App;