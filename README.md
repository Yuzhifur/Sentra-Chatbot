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
   git pull origin main
```

- When commit
```bash
   git add .
   git commit -m "<message>"
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
