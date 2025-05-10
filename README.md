# Sentra: Immersive AI Roleplay Chatbots

**Sentra** is a web application that enables users to chat with AI chatbots designed to roleplay as characters from literature, games, movies—or even completely original characters written by users. Sentra aims to deliver realistic, engaging roleplay experiences, making conversations with AI characters feel like interactions with living beings.

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

## 🔍 Features in Development

- **Long-Term Memory for Chatbots**
  Each chatbot has a memory page per user, allowing it to recall past interactions even in new sessions.

- **User Self-Description**
  Users can configure aspects of their persona to make roleplay more tailored and believable.

- **Unprompted Messaging**
  Chatbots can send messages spontaneously, reviving idle conversations.

- **Shared Memory Between Friends**
  With permission, chatbots can reference and retrieve past conversations with the user's friends.

---

## ⚠️ Risks and Limitations

- While we are adding unique features to improve realism and continuity, it's possible that engagement and immersion still fall short of user expectations.

---

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Firebase Authenticaltion, Functions, Firestore
- **AI**: Language model API provided by OpenAI, Anthropic, Deepseek, etc.

---

## Developers use the following workflow:

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

## Setup Firebase (you only need to do this once):
Make sure you have Firebase account ready, and have node version 22.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

3. Login into firebase
   ```bash
   firebase login
   ```

4. Initialize firebase configurations
   - Make sure only one person in team runs this and push changes, other members pull from repo
   ```bash
   firebase init
   ```

5. Create a `.env.local` file in the project root:
   - Fill in your Firebase project credentials as NEXT_PUBLIC_FIREBASE_API_KEY
   - This can be found in project settings in Firebase console

---

## Full Build Instruction:

1. Start the development server:
   ```bash
   npm start
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Emulate and test:
   ```bash
   firebase emulators:start --only hosting,auth,firestore,functions,storage
   ```
   Open the emulated hosting in private browsing (with empty browser cache).

4. Deploy to Firebase:
   ```bash
   firebase deploy
   ```
