# Horse Racing App - Quick Start & Testing Guide

## Installation & Running

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI (optional but recommended)

### Setup Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start

# 3. Choose your platform:
#    - Press 'i' for iOS (Mac only)
#    - Press 'a' for Android
#    - Press 'w' for Web
#    - Scan QR code with Expo Go app (mobile)
```

## Testing User Flows

### Test Flow 1: Spectator Registration & Login

1. **Open App**
   - App starts at Login screen
   - Notice the demo role selector at top

2. **Sign Up as Spectator**
   - Click "Sign Up" link
   - Select "Spectator" (👀) role
   - Fill in form:
     - Username: `spectator_demo`
     - Email: `spec@demo.com`
     - Password: `password123`
     - Confirm Password: `password123`
   - Click "Create Account"
   - See success message
   - Redirected to Login screen

3. **Login as Spectator**
   - Toggle role selector to "Spectator"
   - Enter email: `spec@demo.com`
   - Enter password: `password123`
   - Click "Log In"
   - See Spectator Home screen
     - Welcome message with username
     - Upcoming races list (3 races)
     - Recent results with winner info
     - Logout button

### Test Flow 2: Jockey Registration & Login

1. **Open App**
   - Start at Login screen

2. **Sign Up as Jockey**
   - Click "Sign Up" link
   - Select "Jockey" (🏇) role
   - Fill in form:
     - Username: `jockey_demo`
     - Email: `jock@demo.com`
     - Password: `password123`
     - Confirm Password: `password123`
   - Click upload button to select certificate
     - Choose any PDF, JPG, or PNG file
     - File name will appear in field
   - Click "Create Account"
   - See success message
   - Redirected to Login screen

3. **Login as Jockey**
   - Toggle role selector to "Jockey"
   - Enter email: `jock@demo.com`
   - Enter password: `password123`
   - Click "Log In"
   - See Jockey Home screen
     - Certificate status badge (✅ Verified and Active)
     - Your Assigned Races (2 races)
     - Upcoming Races with participation button
     - Quick stats (races, wins, win rate)
     - Logout button

### Test Flow 3: Validation Testing

1. **Email Validation**
   - Try logging in with: `invalid.email`
   - See error: "Invalid email format"

2. **Password Validation**
   - Try password: `short`
   - See error: "Password must be at least 8 characters"

3. **Username Validation**
   - Try username: `ab`
   - See error: "Username must be at least 3 characters"

4. **Password Mismatch**
   - Password: `password123`
   - Confirm: `password124`
   - See error: "Passwords do not match"

5. **Required Fields**
   - Try submitting empty form
   - See validation errors

### Test Flow 4: Password Toggle

1. Go to Login or Sign Up
2. Click the eye icon in password field
3. Password should become visible
4. Click again to hide

### Test Flow 5: Role Switching in Login

1. Start at Login screen
2. Click "Spectator" role button
3. Enter any credentials
4. Notice form is valid for Spectator
5. Switch to "Jockey" role
6. Click "Log In"
7. Get redirected to Jockey Home screen

### Test Flow 6: Navigation

1. **Spectator Home**
   - Scroll through upcoming races
   - Scroll through recent results
   - Click "Log Out"
   - Return to Login screen

2. **Jockey Home**
   - Click "Request Participation" button
   - No action (button is demo)
   - Click "Log Out"
   - Return to Login screen

### Test Flow 7: Role Change

1. Register as Spectator
2. Login as Spectator
3. Logout
4. Login as Jockey (use different email from signup)
5. See Jockey Home screen

## Important Notes

### Demo Credentials

Any combination works for login since it's mock authentication:

- Email: anything@anything.com
- Password: 8+ characters
- Role: Select from toggle

### No Backend Integration

- All data is local and in-memory
- Logging out clears all data
- Refreshing the app resets auth state
- No persistence between sessions

### File Upload

- Certificate upload works in development
- File selection works on all platforms
- Selected filename is displayed

### Loading States

- Login: 500ms delay
- Sign Up: 800ms delay
- Loading button shows "Loading..." text

## Troubleshooting

### Issue: App crashes on startup

**Solution**: Clear cache and reinstall dependencies

```bash
npm cache clean --force
rm -rf node_modules
npm install
npm start
```

### Issue: Styles look wrong

**Solution**: Try web version first

```bash
npm start
# Press 'w'
```

### Issue: File upload doesn't work

**Solution**:

- On web: Use browser's file picker
- On mobile: Install Expo Go app
- Check permissions on mobile device

### Issue: Form validation not working

**Solution**: Ensure all fields are filled correctly and meet requirements

## File Organization Reference

```
Key files for testing:
- src/app/(auth)/login.tsx - Login screen
- src/app/(auth)/signup.tsx - Sign up screen
- src/app/(spectator)/home.tsx - Spectator home
- src/app/(jockey)/home.tsx - Jockey home
- src/context/AuthContext.tsx - Auth logic
- src/lib/schemas.ts - Validation rules
- src/lib/mockData.ts - Race data
```

## API Endpoints (All Mock)

No actual API calls are made. All following functions are mocked:

- `POST /auth/login` → instant success
- `POST /auth/signup` → instant success
- Race data retrieval → returns mock data

## Performance Notes

- App launches in < 2 seconds
- Navigation between screens: < 500ms
- Form validation: instant feedback
- No network delays (all local)

---

**Happy Testing! 🏇**

For questions or issues, refer to the PROTOTYPE_README.md for architecture details.
