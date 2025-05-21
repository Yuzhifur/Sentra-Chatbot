# Sentra: Immersive AI Roleplay Chatbots V1.0.2

**Sentra** is a web application that enables users to chat with AI chatbots designed to roleplay as characters from literature, games, movies—or even completely original characters written by users. Sentra aims to deliver realistic, engaging roleplay experiences, making conversations with AI characters feel like interactions with living beings.

🔗 Link to Sentra's Firebase Hosting: https://sentra-4114a.web.app/

---

## 🚀 Idea and Goals

The core idea of **Sentra** is to create a roleplay chatbot experience that feels dynamic, continuous, and human-like. Our goals are:

- **Realistic Roleplay**: Make chatbots behave like actual characters, not static AI.
- **Continuity**: Implement long-term memory for chatbots to remember past interactions.
- **User Personalization**: Let users define themselves (appearance, gender, personality) to enrich character interaction.
- **Proactive Interaction**: Allow chatbots to send unprompted messages for a more lifelike experience.
- **Shared Context**: Enable chatbots to reference interactions with the user's friends, making conversations interconnected and socially aware.

---

## 📦 Repository Layout
```
sentra/
│
├── funcions/                    # Firebase Cloud Functions and server logic
│   └── src/
│       └── index.tsx
├── public/                      # Frontend files built and to be served
│   └── index.html
│
├── src/                       # React frontend code
│   ├── components/            # Reusable React components (chat window, character card, etc.)
│   ├── pages/                 # Page-level React components (home, chat, character creation)
│   ├── index.tsx              # Upper-most tsx file that contains firebase app credentials
│   ├── index.html             # Firebase default welcome page (will be overwritten by react)
│   ├── App.tsx                # Main page of the app that connects to all other pages
│   └── App.css                # CSS for App.tsx
│
│
├── Sentra_proposal.pdf         # Project documentation (feature specs, design drafts, research notes)
│
├── public/                     # Static files (favicon, images)
│
├── .local.env                  # Environment variables
├── .gitignore
├── README.md                   # This file
├── firebase.json               # Firebase hosting and functions configuration
└── package.json                # Project dependencies and scripts
```
---

## 💾 Firestore Database Layout
```
Firestore Database
│
├── global/                           # Global metadata
│   └── {stats}/                      # statistics
│       └── characterCount: int       # current count of characters
│
├── users/                            # Users collection
│   └── {userId}/                     # User document (contains profile information)
│       ├── username: string          # User's unique username
│       ├── displayName: string       # User's display name (defaults to username)
│       ├── email: string             # User's email address
│       ├── userAvatar: string        # URL or data for user's avatar image
│       ├── userDescription: string   # User's self-description/bio
│       ├── userCharacters: string[]  # Array of character IDs created by this user
│       ├── createdAt: timestamp      # When the user account was created
│       ├── lastLogin: timestamp      # When the user last logged in
│       │
│       └── chatHistory/              # Subcollection for chat history
│           └── {chatId}/             # Individual chat document in history
│               ├── title: string     # Title of the chat
│               ├── avatar: string    # Same with character avatar
│               ├── characterId: string # ID of character in this chat
│               └── lastUpdated: timestamp # When last message was sent
│
├── characters/                       # Characters collection
│   └── {characterId}/                # Character document
│       ├── age: number               # Character's age
│       ├── appearance: string        # Description of character's appearance
│       ├── authorDisplayName: string # Display name of character creator
│       ├── authorID: string          # User ID of character creator
│       ├── authorUsername: string    # Username of character creator
│       ├── avatar: string            # URL or data for character's avatar image
│       ├── characterBackground: string # Character's backstory
│       ├── characterDescription: string # General description of character
│       ├── createdAt: timestamp      # When character was created
│       ├── family: string            # Character's family information
│       ├── gender: string            # Character's gender
│       ├── id: string                # Character's ID (redundant with document ID)
│       ├── isPublic: boolean         # Whether character is publicly visible
│       ├── job: string               # Character's occupation
│       ├── name: string              # Character's name
│       ├── outfit: string            # Description of character's clothing
│       ├── relationshipStatus: string # Character's relationship status
│       ├── residence: string         # Where the character lives
│       ├── scenario: string          # Default scenario for roleplay
│       ├── specialAbility: string    # Character's special abilities
│       ├── species: string           # Character's species
│       ├── talkingStyle: string      # Character's speech patterns/style
│       └── temperament: string       # Character's personality/temperament
│
└── chats/                            # Chats collection
    └── {chatId}/                     # Chat document
        ├── characterId: string       # ID of character in this chat
        ├── characterName: string     # Name of character in this chat
        ├── history: string           # JSON string of chat history
        ├── userId: string            # ID of user in this chat
        ├── userUsername: string      # Username of user in this chat
        ├── createdAt: timestamp
        ├── updatedAt: timestamp
        └── title: string             # The chat's title
```
## Relationships Between Collections

1. **User → Characters**:
   - `users/{userId}/userCharacters[]` contains IDs that reference `characters/{characterId}`
   - `characters/{characterId}/authorID` references `users/{userId}`

2. **User → Chats**:
   - `chats/{chatId}/userID` references `users/{userId}`
   - `users/{userId}/chatHistory/{chatId}` references chat history for a user

3. **Character → Chats**:
   - `chats/{chatId}/characterId` references `characters/{characterId}`

## Data Flow

1. When a user creates an account:
   - A document is created in `users/{userId}`
   - An empty subcollection `chatHistory` is initialized

2. When a user creates a character:
   - A document is created in `characters/{characterId}`
   - The character ID is added to `users/{userId}/userCharacters[]`
   - The character's int id in `characters/{characterId}/id` is assigned with `global/{stats}/characterCount`
   - `global/{stats}/characterCount` is increamented by 1
   - Notice that character's int id is difffrent from {characterId}: int id is initialized to characterCount while {characterId} is generated string

3. When a chat session starts:
   - A document is created in `chats/{chatId}`
   - A corresponding entry is added to `users/{userId}/chatHistory/{chatId}`

4. When messages are exchanged in a chat:
   - The `history` field in `chats/{chatId}` is updated
   - The `lastUpdated` field in `users/{userId}/chatHistory/{chatId}` is updated

---

## 🧪 Current Available Use Cases (May 13, 2025, V1.0.1)

Sentra supports the following key features and workflows for users:

### 1. 🔐 Authentication
- **Login**: Existing users can sign in using their registered email and password.
- **Create Account**: New users can register an account with email, username, and optional display name.
- **Reset Password**: Users can request a password reset via email.
- **Logout**: Authenticated users can securely log out of their session.

### 2. 🧙‍♀️ Character Creation
- Users can create detailed custom characters with fields like:
  - Name, appearance, background, species, gender, job, and more.
- Created characters are stored in the `characters/` collection and linked to the creator via `users/{userId}/userCharacters[]`.

### 3. 🔍 Search Functionality
- Users can search for:
  - Other users by username.
  - Publicly visible characters by name or attributes.
- Search results provide clickable access to profile (not yet) and character pop ups for initiating a chat.

### 4. 📁 Chat History Sidebar
- A persistent sidebar displays the user's previous chat sessions, sorted by `lastUpdated`.
- Each entry includes:
  - Character avatar
  - Chat title
  - Timestamp
- Clicking an entry reopens the associated chat session.
- Clicking the bin button can deleate the chat session that is chosen

### 5. 💬 Chat Creation and Access
- Users can start a new chat from a character's profile page.
- A modal popup allows choosing between starting a new chat or continuing an existing one.
- Each chat session is recorded in both the `chats/` collection and the user's `chatHistory/` subcollection.

### 6. 🤖 Chatting with AI Characters
- Users can engage in immersive conversations with AI-driven characters.
- Each session supports:
  - Real-time message exchange
  - Character-specific memory

### 7. 👤 User Profiles & Character Management

- Users can view their own profile and profiles of other users.
- Personalization options include:
  - Uploading and displaying profile pictures
  - Setting a custom display name
  - Writing a personal bio
- Character management capabilities:
  - View characters created by any user in their profile
  - Edit existing characters with all original data pre-populated
  - Access character previews and initiate chats directly from profile pages
- User-specific views ensure only character creators can edit their characters

---

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Firebase Authenticaltion, Functions, Firestore
- **AI**: Language model API provided by OpenAI, Anthropic, Deepseek, etc.

---

## 🛠️ Testing with Jest
Our project uses Jest for testing. To run the tests:

1. Run all tests:
   ```bash
   npm test
   ```

2. Run specific test files:
   ```bash
   npm test -- src/services/FirebaseService.test.js
   ```

3. Key test files:
   - `src/services/FirebaseService.test.js`: Tests for Firebase service functions
   - `src/utils.test.js`: Tests for utility functions
   - `src/pages/Chat.test.js`: Tests for Chat component functionality

The tests validate core functionality including:
- Authentication processes
- Firebase service interactions
- Component rendering
- Utility functions

### Continuous Integration
We use GitHub Actions for CI. The workflow is defined in `.github/workflows/main.yml` and `.github/workflows/webpack.yml` and runs automatically on pushes to the main branch and pull requests. The CI process:
1. Sets up Node.js environment
2. Installs dependencies
3. Runs all tests
4. Builds the project

You can view CI results in the "Actions" tab of our GitHub repository.

---

## Typical developer workflow:

- Find an empty directory
```bash
   git clone https://github.com/Yuzhifur/Sentra-Chatbot.git
```
- cd into Sentra-Chatbot
```bash
   cd Sentra-Chatbot
```

- Create your own developer's branch
```bash
   git branch <yourname>
```

- When making changes, switch to your branch and pull
```bash
   git checkout <yourname>
   git pull --rebase origin main
```

- When commit
```bash
   git add .
   git commit -m "<message>"
```

- Before push to remote your own branch, resolve any conflicts in this step
```bash
   git pull --rebase origin main

   git add <resolved-files>
   git rebase --continue
```

- When push to remote your own branch
```bash
   git push origin <yourname>
```

- When push to remote your main branch (always do this after push to your own branch)
```bash
   git checkout main
   git merge <yourname>
   git push origin main
   git checkout <yourname>
```

- If you are absolutely sure that conflicts were resolved in your own branch, but failed to git merge <yourname>
```bash
   git merge <yourname> --strategy-option theirs
```

---

## 🛠️ Complete Build and Test Instructions

### Prerequisites
- Node.js v22 or later
- Firebase CLI installed globally (`npm install -g firebase-tools`)
- Git
- Google Cloud CLI (gcloud) for non-Sentra developers

### For Sentra Team Members

1. Clone the repository:
   ```bash
   git clone https://github.com/Yuzhifur/Sentra-Chatbot.git
   cd Sentra-Chatbot
   ```

2. Install main project dependencies:
   ```bash
   npm install
   ```

3. Install Firebase Functions dependencies:
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. Create a `.env.local` file in the project root with Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   ```

5. Start the development server:
   ```bash
   npm start
   ```

6. Running tests:
   ```bash
   npm test
   ```

7. Build for emulator test:
   ```bash
   npm run build
   ```

8. Emulate and test locally:
   ```bash
   firebase emulators:start --only hosting,auth,firestore,functions,storage
   ```

9. Deploy to Firebase:
    ```bash
    firebase deploy
    ```

### For Non-Sentra Developers

If you're not part of the Sentra team but want to use this codebase, additional setup is required:

1. Create your own Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Initialize Firebase services:
   - Authentication
   - Firestore
   - Storage
   - Functions
   - App Check

3. Set up Google Cloud environment:
   - Install Google Cloud CLI (gcloud)
   - Login to your Google Cloud account:
     ```bash
     gcloud auth login
     ```
   - Set your project:
     ```bash
     gcloud config set project <your-project-id>
     ```
   - Create App Engine application if you don't have a service account with email `serviceAccount:<project_id>@appspot.gserviceaccount.com`:
     ```bash
     gcloud app create --region=us-central --project=<your-project-id>
     ```

4. Create and set up secret for Claude API:
   - Enable Secret Manager API:
     ```bash
     gcloud services enable secretmanager.googleapis.com
     ```
   - Create the secret:
     ```bash
     gcloud secrets create CLAUDE_API_KEY --replication-policy="automatic"
     ```
   - Add your Anthropic API key to the secret (replace $CLAUDE_API_KEY with your actual API key):
     ```bash
     echo $CLAUDE_API_KEY | gcloud secrets versions add CLAUDE_API_KEY --data-file=-
     ```
   - Grant access to the service account:
     ```bash
     gcloud secrets add-iam-policy-binding CLAUDE_API_KEY \
       --member=serviceAccount:<your-project-id>@appspot.gserviceaccount.com \
       --role=roles/secretmanager.secretAccessor
     ```

5. Initialize Firebase in your local project:
   ```bash
   firebase login
   firebase init
   ```

6. Follow the steps for Sentra team members from steps 2-10 above.
   - Additionally, modify `const firebaseConfig = {}` and the client key in `provider: new ReCaptchaV3Provider()` in `index.tsx` with your own firebase project configs.


## 📚 Documentation

Comprehensive documentation is available for both users and developers:

- [User Documentation](./USER_DOCUMENTATION.md) - Complete guide for Sentra users
- [Developer Documentation](./DEVELOPER_DOCUMENTATION.md) - Guidelines and information for contributors

Please refer to these documents for detailed information about using and contributing to Sentra.
