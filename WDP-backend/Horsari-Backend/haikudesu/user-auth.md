# User Authentication & Registration Flow

## Overview
Complete user registration flow with role-based registration (HorseOwner/Jockey) and Google OAuth support.

## Registration Flow Diagram

### Entry Point
- User navigates to login page
- User clicks on "Create Account"

### Step 1: Registration Method
**Does the user want to register via Google?**

#### Path A: Google Registration
- Check if email already exists
  - **Email Exists**: System shows error "email already exists"
  - **Email New**: User logs in → Check "Is it the first time login?"

#### Path B: Manual Registration
- User adds email and other information during registration
- System checks if email already exists
  - **Email Exists**: System shows error "email already exists"
  - **Email New**: User enters additional information

### Step 2: Role Selection
After successful initial registration:
- **Question**: "Is the user a horse owner or jockey?"
  - **No**: Navigate to login page (User is Spectator/Admin)
  - **Yes**: User sends certification as PDF

### Step 3: Certification
- User sends certification as PDF
- Navigate to login page

### Step 4: First Login (Google OAuth Only)
- First time login detection
- Route to appropriate dashboard based on role

## User Roles Supported
1. **HorseOwner**: Requires certification PDF
2. **Jockey**: Requires certification PDF
3. **Spectator**: No additional requirements
4. **Admin**: System-assigned role

## Key Features
- ✅ Email uniqueness validation
- ✅ Google OAuth integration
- ✅ Role-based certification requirement
- ✅ PDF certification upload for professional roles
- ✅ First-time login tracking

## Data Collection Points
1. **Basic Registration**: username, email, password
2. **Additional Info**: fullName, phoneNumber, dateOfBirth
3. **Professional Roles**: certificationNumber (via PDF), licenseNumber
4. **Role Selection**: horseowner/jockey/spectator/admin
