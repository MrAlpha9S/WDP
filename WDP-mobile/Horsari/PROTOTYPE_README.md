# Horse Racing Mobile App - Authentication Prototype

A fully functional prototype of a horse racing mobile application with authentication, role-based access, and horse racing-themed UI.

## Features

### Authentication System

- **Login Screen**: Email and password authentication with demo role selection
- **Sign Up Screen**: Two-step registration process with role selection
- **Role-Based Navigation**: Different home screens for Spectators and Jockeys

### User Roles

#### Spectator 👀

- View upcoming races
- Browse recent race results
- Track winner information and times
- Clean, simple interface focused on viewing

#### Jockey 🏇

- Certificate upload during registration (PDF, JPG, PNG)
- View assigned races
- View upcoming races and request participation
- Certificate status verification
- Quick statistics (races completed, wins, win rate)

### Screens

#### Auth Stack

- **Login** - `/(auth)/login.tsx`
  - Email input
  - Password input with show/hide toggle
  - Demo role selector (Spectator/Jockey)
  - Link to sign up screen

- **Sign Up** - `/(auth)/signup.tsx`
  - Step 1: Role selection (Spectator/Jockey)
  - Step 2: Account details form
  - For Jockeys: Certificate upload field
  - Success message with redirect to login

#### Spectator Stack

- **Home** - `/(spectator)/home.tsx`
  - Welcome greeting
  - Horse racing banner
  - Upcoming races list
  - Recent results with podium display
  - Logout button

#### Jockey Stack

- **Home** - `/(jockey)/home.tsx`
  - Welcome greeting with certificate status
  - Assigned races section
  - Upcoming races with participation button
  - Quick stats (races, wins, win rate)
  - Logout button

## Project Structure

```
src/
├── app/
│   ├── _layout.tsx              # Root layout with auth provider
│   ├── index.tsx                # Entry point
│   ├── explore.tsx              # Existing explore page
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack layout
│   │   ├── login.tsx            # Login screen
│   │   └── signup.tsx           # Sign up screen
│   ├── (spectator)/
│   │   ├── _layout.tsx          # Spectator stack layout
│   │   └── home.tsx             # Spectator home screen
│   └── (jockey)/
│       ├── _layout.tsx          # Jockey stack layout
│       └── home.tsx             # Jockey home screen
├── components/
│   ├── Button.tsx               # Primary button component
│   ├── InputField.tsx           # Text input component
│   ├── PasswordInput.tsx        # Password input with toggle
│   ├── RoleSelector.tsx         # Role selection cards
│   ├── UploadField.tsx          # File upload component
│   ├── AuthHeader.tsx           # Auth screen header
│   └── Card.tsx                 # Reusable card component
├── context/
│   └── AuthContext.tsx          # Authentication context
├── lib/
│   ├── schemas.ts               # Zod validation schemas
│   └── mockData.ts              # Mock race data
├── types/
│   └── index.ts                 # TypeScript type definitions
└── ...existing files
```

## Technology Stack

- **Expo** - Cross-platform development framework
- **React Native** - Mobile UI framework
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Expo Document Picker** - File selection for certificate upload

## Validation Rules

### Login

- Email: Valid email format required
- Password: Minimum 8 characters

### Sign Up (Spectator)

- Username: Minimum 3 characters
- Email: Valid email format
- Password: Minimum 8 characters
- Confirm Password: Must match password

### Sign Up (Jockey)

- Same as Spectator, plus:
- Racing Certificate: Required (PDF, JPG, PNG)

## Mock Data

The app includes mock data for:

- Upcoming races (3 races)
- Recent race results (3 results with podium standings)
- Assigned races for jockeys (2 races)
- Jockey statistics

All navigation and data are handled locally without backend integration.

## Design System

### Colors

- **Primary Red**: #DC2626 (buttons, active states, borders)
- **Light Red**: #FEE2E2 (backgrounds, error states)
- **Success Green**: #22C55E (certificate status)
- **Text Dark**: #000000 (main text)
- **Text Gray**: #666666 (secondary text)
- **Background**: #FFFFFF (main background)
- **Light Gray**: #F5F5F5, #F9F9F9 (subtle backgrounds)

### Typography

- **Title**: 28px, fontWeight 700
- **Section Title**: 18px, fontWeight 700
- **Button**: 16px, fontWeight 600
- **Body**: 14px-16px, fontWeight 500
- **Small**: 12px-13px

### Components

- Rounded corners: 8-12px border radius
- Card shadows: Subtle elevation (Android compatible)
- Consistent padding: 16-20px
- Professional spacing throughout

## Getting Started

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Run on your platform:

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## User Journey

1. **First Launch**: User sees login screen
2. **Select Role**: Demo role selector allows choosing Spectator or Jockey
3. **Account Creation**: User can click "Sign Up" to create new account
4. **Role-Based Signup**: Form adapts based on selected role
5. **Jockey Certificate**: Jockeys can upload racing certificate
6. **Success**: Redirected to login after successful registration
7. **Login**: Enter credentials with selected role
8. **Home Screen**: Role-specific home screen appears
9. **Navigation**: User can view races and manage profile
10. **Logout**: Button available to return to login

## Authentication Flow

### Mock Authentication

- All authentication is handled locally with mock data
- No backend integration
- Success responses are simulated with delays
- User data is stored in React Context (in-memory)
- Logout clears user data

### State Management

- **AuthContext**: Manages user state and authentication functions
- **Local State**: Component-level state for forms and UI
- **React Hook Form**: Form state management with validation

## Features Implemented

✅ Complete authentication flow
✅ Role-based navigation
✅ Form validation with Zod
✅ Password visibility toggle
✅ File upload for certificates
✅ Mock race data
✅ Responsive design
✅ Professional UI/UX
✅ Loading states
✅ Error handling
✅ TypeScript support

## Future Enhancements

- Backend API integration
- Real authentication (JWT tokens)
- Database integration
- Additional race details screens
- Jockey performance statistics
- Race result notifications
- Favorites/bookmarks
- User profile management
- Dark mode support
- Internationalization

## Notes

This is a prototype designed for demonstration purposes. All data is mocked and stored in memory. No actual authentication or data persistence is implemented. The app is designed to showcase the user experience and navigation flow.
