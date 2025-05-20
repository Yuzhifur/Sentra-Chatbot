# Sentra Developer Documentation

**Current Version: 1.0.2**

This documentation is intended for developers who want to contribute to the Sentra project. It provides comprehensive information about the project structure, how to set up a development environment, and how to contribute effectively.

## Table of Contents
1. [Obtaining the Source Code](#obtaining-the-source-code)
2. [Directory Structure](#directory-structure)
3. [Development Environment Setup](#development-environment-setup)
4. [Building the Software](#building-the-software)
5. [Testing the Software](#testing-the-software)
6. [Adding New Tests](#adding-new-tests)
7. [Building a Release](#building-a-release)
8. [Contribution Guidelines](#contribution-guidelines)
9. [Code Standards](#code-standards)
10. [Contact & Support](#contact--support)

---

## Obtaining the Source Code

Sentra's codebase is hosted in a single GitHub repository. To obtain the source code:

```bash
# Clone the repository
git clone https://github.com/Yuzhifur/Sentra-Chatbot.git

# Navigate to project directory
cd Sentra-Chatbot
```

### Branch Structure

- `main` - The production branch, containing stable and released code
- `dev` - Development branch where features are integrated before release
- Feature branches - Named according to the feature being developed (e.g., `feature/user-profiles`)

When contributing, always create your feature branch from the latest `dev` branch:

```bash
git checkout dev
git pull
git checkout -b feature/your-feature-name
```

---

## Directory Structure

The Sentra project follows this directory structure:

```
sentra/
│
├── funcions/                    # Firebase Cloud Functions and server logic
│   └── src/
│       └── index.tsx
│
├── public/                      # Frontend files built and to be served
│   └── index.html
│
├── src/                         # React frontend code
│   ├── components/              # Reusable React components
│   │   ├── auth/                # Authentication-related components
│   │   ├── chat/                # Chat interface components
│   │   ├── character/           # Character creation and display components
│   │   └── common/              # Common UI elements
│   │
│   ├── pages/                   # Page-level React components
│   │   ├── Home/                # Home page
│   │   ├── Chat/                # Chat page
│   │   ├── CharacterCreation/   # Character creation page
│   │   ├── Profile/             # User profile page
│   │   └── Settings/            # User settings page
│   │
│   ├── services/                # Service layer for API interactions
│   │   ├── firebaseService.js   # Firebase service
│   │   ├── authService.js       # Authentication service
│   │   └── aiService.js         # AI model interaction service
│   │
│   ├── utils/                   # Utility functions
│   │   ├── formatters.js        # Data formatting utilities
│   │   └── validators.js        # Input validation utilities
│   │
│   ├── contexts/                # React context providers
│   │
│   ├── hooks/                   # Custom React hooks
│   │
│   ├── __tests__/               # Test directory
│   │
│   ├── index.tsx                # Entry point with Firebase config
│   ├── App.tsx                  # Main application component
│   └── App.css                  # Main styles
│
├── .github/                     # GitHub workflow configurations
│   └── workflows/
│       ├── main.yml             # CI workflow for main branch
│       └── webpack.yml          # Webpack build workflow
│
├── tests/                       # Additional test files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
│
├── docs/                        # Documentation files
│   ├── USER_DOCUMENTATION.md    # User documentation
│   └── additional-docs/         # Additional documentation
│
├── .firebase/                   # Firebase local configuration
├── .local.env                   # Environment variables (not in repository)
├── .gitignore                   # Files to be ignored by git
├── README.md                    # Project overview
├── firebase.json               # Firebase configuration
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── tailwind.config.js          # Tailwind CSS configuration
```

### Key Files Overview

- **index.tsx**: Main entry point that initializes Firebase and renders the React app
- **App.tsx**: Root component that handles routing and global contexts
- **firebaseService.js**: Service for interacting with Firebase (Firestore, Authentication)
- **aiService.js**: Service for interacting with AI models (OpenAI, Anthropic, etc.)

---

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 22.x or newer
- **npm**: Version 10.x or newer
- **Firebase CLI**: For interacting with Firebase services
- **Google Cloud CLI**: For accessing Google Cloud resources
- **Git**: For version control

### Step-by-Step Setup

1. **Install Node.js and npm**:
   Download and install from [nodejs.org](https://nodejs.org/)

2. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**:
   ```bash
   firebase login
   ```

4. **Install Google Cloud CLI** (for non-team members):
   Follow instructions at [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

5. **Set up local environment variables**:
   Create a `.env.local` file in the project root with the following variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

6. **Install project dependencies**:
   ```bash
   # Install main project dependencies
   npm install
   
   # Install Firebase Functions dependencies
   cd functions
   npm install
   cd ..
   ```

7. **Set up Firebase Emulators** (for local development):
   ```bash
   firebase init emulators
   ```
   Select all emulators (Auth, Firestore, Functions, Hosting, Storage)

---

## Building the Software

### Development Build

To build the project for development:

```bash
# Start the development server
npm start
```

This will:
1. Compile the TypeScript code
2. Start a local development server on port 3000
3. Enable hot-module replacement for instant updates as you edit files

### Using Firebase Emulators

For local development with Firebase services:

```bash
# Start Firebase emulators
firebase emulators:start --only hosting,auth,firestore,functions,storage
```

In a separate terminal:
```bash
# Start the development server with emulator configuration
npm run start:emulator
```

### Building Firebase Functions

To build and deploy Firebase Functions:

```bash
# Navigate to functions directory
cd functions

# Install dependencies if not done already
npm install

# Build TypeScript
npm run build

# Return to root directory
cd ..
```

---

## Testing the Software

Sentra uses Jest for testing React components and Firebase services.

### Running Tests

```bash
npm test
```


   ```

### Testing with Firebase Emulators

When testing Firebase interactions:

1. Start the Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. In a separate terminal, run tests with the emulator environment:
   ```bash
   npm run test:emulator
   ```

---

## Adding New Tests

### Test File Naming Conventions

- Unit test files should be named `*.test.js` or `*.test.tsx`
- Place tests in the same directory as the code they test, or in a `__tests__` folder
- For pages or complex components, create a dedicated test folder with multiple test files

### Test Structure

Follow this structure for consistency:

```javascript
// Import the component or function to test
import { YourComponent } from './YourComponent';

// Describe block for the component or function
describe('YourComponent', () => {
  // Setup before each test if needed
  beforeEach(() => {
    // Setup code
  });
  
  // Individual test case
  test('should render correctly', () => {
    // Test code
    // Assertions
  });
  
  // Another test case
  test('should handle user interaction', () => {
    // Test code
    // Assertions
  });
  
  // Teardown after each test if needed
  afterEach(() => {
    // Cleanup code
  });
});
```

### Test Categories and What to Test

1. **Components**:
    - Rendering correctly with different props
    - User interactions (clicks, inputs)
    - State changes
    - Event handlers

2. **Services**:
    - API calls
    - Data transformations
    - Error handling

3. **Utilities**:
    - Function inputs and outputs
    - Edge cases
    - Error conditions

### Testing Firebase Interactions

When testing Firebase interactions, use the Firebase testing library and emulators:

```javascript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'sentra-test',
    });
  });
  
  // Your tests here
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
});
```

---

## Building a Release

### Release Checklist

Before building a release, ensure:

1. All tests pass: `npm test`
2. Code has been reviewed and approved by at least one other team member
3. Documentation is updated to reflect any changes
4. Version numbers are updated in:
    - `package.json`
    - `README.md`
    - Any version-specific code

### Version Number Format

Sentra follows Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH` (e.g., `1.0.2`)
- Increment MAJOR for incompatible API changes
- Increment MINOR for new features (backwards compatible)
- Increment PATCH for bug fixes (backwards compatible)

### Building for Production

```bash
# Clean previous builds
npm run clean

# Build the production version
npm run build
```

The production build will be created in the `build/` directory.

### Deploying to Firebase

```bash
# Deploy everything
firebase deploy

# Deploy only specific resources
firebase deploy --only hosting,functions
```

### Post-Deployment Verification

After deployment, verify:

1. The application loads correctly at https://sentra-4114a.web.app/
2. Authentication flows work (login, registration)
3. Core features function as expected (character creation, chat)
4. No console errors appear in the browser

### Creating a GitHub Release

1. Create a new tag for the release:
   ```bash
   git tag v1.0.2
   git push origin v1.0.2
   ```

2. On GitHub, go to "Releases" and create a new release from the tag
3. Include release notes detailing:
    - New features
    - Bug fixes
    - Known issues
    - Breaking changes (if any)

---

## Contribution Guidelines

### Contribution Workflow

1. **Find or Create an Issue**:
    - Check existing issues or create a new one
    - Discuss approach before starting work

2. **Fork and Branch**:
   ```bash
   # Ensure you're on the dev branch
   git checkout dev
   git pull
   
   # Create your feature branch
   git checkout -b feature/your-feature-name
   ```

3. **Write Code and Tests**:
    - Follow the [Code Standards](#code-standards)
    - Write tests for new functionality
    - Keep commits small and focused

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Brief description of your changes"
   ```

5. **Update from Upstream** (before submitting PR):
   ```bash
   git pull --rebase origin dev
   ```

6. **Push Changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**:
    - Create a PR targeting the `dev` branch
    - Include a clear description of changes
    - Reference related issues with `#issue-number`

8. **Code Review**:
    - Address any feedback from reviewers
    - Make requested changes

9. **Merge**:
    - PRs are merged by repository maintainers
    - Changes will be included in next release

### Branch Structure

- **main**: Production-ready code
- **dev**: Integration branch for new features
- **feature/\***: Individual feature branches
- **bugfix/\***: Bug fix branches
- **release/\***: Release preparation branches

### Commit Message Guidelines

Use the conventional commits format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Where `type` is one of:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or fixing tests
- **chore**: Changes to build process or auxiliary tools

---

## Code Standards

### JavaScript/TypeScript

- Use TypeScript for all new code
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### React Components

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Use proper prop types or TypeScript interfaces

### CSS/Styling

- Use Tailwind CSS utility classes
- Avoid inline styles
- Follow component-based styling approach

### Firebase Best Practices

- Minimize Firestore reads/writes for cost efficiency
- Use security rules to protect data
- Structure data for efficient querying

### Documentation

- Use JSDoc comments for functions and components
- Keep code comments current with changes
- Update README and documentation when adding features

---

## Contact & Support

### Getting Help

- **GitHub Issues**: Technical problems and feature requests


### Team Communication

- Regular meetings: Tuesday / Thursday at 1:30 AM PST
- Slack Group


---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

© 2025 Sentra Team | [GitHub Repository](https://github.com/Yuzhifur/Sentra-Chatbot)