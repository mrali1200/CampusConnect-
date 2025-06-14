<div align="center" style="background-color: #f6f8fa; padding: 40px; border-radius: 10px;">
  <h1 style="color: #2f81f7; font-size: 3em; margin-bottom: 20px;">ConnectCampus+</h1>
  <img src="https://res.cloudinary.com/dzekrrkep/image/upload/v1748787128/projects/eel82hw0swvr9wur1puq.png" alt="ConnectCampus+ Logo" width="420" height="580" style="border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  <h3 style="color: #58a6ff; font-size: 1.5em; margin-top: 20px;">A modern campus event management platform</h3>
  <div style="display: inline-flex; gap: 10px; margin-top: 20px;">
    <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue" alt="Platform" />
    <img src="https://img.shields.io/badge/framework-React%20Native-blue" alt="Framework" />
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  </div>
</div>


<h2 style="color: #2f81f7; border-bottom: 2px solid #2f81f7; padding-bottom: 10px; margin-top: 40px;">📱 Overview</h2>

ConnectCampus+ is a comprehensive mobile application designed to enhance student engagement through seamless event discovery, registration, and management. Built with React Native and Expo, it provides a modern, intuitive interface for students to connect with campus activities.

<h2 style="color: #2f81f7; border-bottom: 2px solid #2f81f7; padding-bottom: 10px; margin-top: 40px;">✨ Features</h2>

<h3 style="color: #58a6ff; margin-top: 30px;">🎓 For Students</h3>
- **Event Discovery**: Browse and search for campus events with filtering options
- **Event Registration**: Register for events with just a few taps
- **QR Check-in**: Generate QR codes for quick event check-in
- **Guest Mode**: Browse events without signing in
- **Profile Management**: Customize your profile and preferences
- **My Events**: Track registered and attended events

<h3 style="color: #58a6ff; margin-top: 30px;">👨‍💼 For Administrators</h3>
- **Event Creation**: Create and publish new events
- **Attendee Management**: View and manage event registrations
- **Registration Approval**: Approve or reject registration requests
- **Analytics**: Track attendance and engagement metrics

<h2 style="color: #2f81f7; border-bottom: 2px solid #2f81f7; padding-bottom: 10px; margin-top: 40px;">🛠️ Technology Stack</h2>

- **Frontend**: React Native, Expo
- **State Management**: React Context API
- **Backend**: Supabase (Authentication, Database, Storage)
- **UI Components**: Custom components with theming support
- **Navigation**: Expo Router
- **Styling**: StyleSheet API with theme context

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/connectcampus-plus.git
   cd connectcampus-plus
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

## 📱 Running on Your Device

1. Install the Expo Go app on your iOS or Android device
2. Scan the QR code from the terminal or Expo Dev Tools
3. The app will load on your device

## 🏗️ Project Structure

```
connectcampus/
├── app/                  # Application screens and navigation
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main tab screens
│   ├── admin/            # Admin screens
│   ├── user/             # User screens
│   └── _layout.tsx       # Root layout component
├── assets/               # Images, fonts, and other static assets
├── components/           # Reusable UI components
│   ├── events/           # Event-related components
│   └── ui/               # Generic UI components
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # API and service integrations
├── supabase/             # Supabase configuration
├── types/                # TypeScript type definitions
├── .env                  # Environment variables (not in git)
└── app.json              # Expo configuration
```

## 🎨 Theme Customization

ConnectCampus+ comes with a built-in theme system supporting both light and dark modes. The theme can be customized in `contexts/ThemeContext.tsx`.

## 🔒 Authentication

The app supports multiple authentication methods:
- Email/password authentication
- Guest mode for browsing without an account

## 🧪 Testing

Run tests using:
```bash
npm test
# or
yarn test
```

## 📦 Building for Production

### Expo Build

```bash
eas build --platform android
# or
eas build --platform ios
```

### Local Build

```bash
expo build:android
# or
expo build:ios
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For any questions or suggestions, please reach out to:
- Email: support@connectcampus.com
- GitHub: [github.com/connectcampus](https://github.com/connectcampus)

---

<div align="center" style="margin-top: 50px; padding: 20px; background-color: #f6f8fa; border-radius: 10px;">
  <p style="color: #2f81f7; font-size: 1.2em;">Made with ❤️ for students</p>
</div>
