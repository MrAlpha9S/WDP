# Authentication & Authorization API Documentation

## Overview
Complete REST API for user registration, authentication, and role-based access with certification management.

## Base URL
```
http://localhost:3000/api/auth
```

---

## 1. Public Endpoints

### Register New User
**POST** `/register`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-15"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Login
**POST** `/login`

```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "horseowner",
    "fullName": "John Doe"
  }
}
```

**Note:** Refresh token is set as httpOnly cookie

---

### Check Email Availability
**POST** `/check-email`

```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "email": "john@example.com",
  "exists": false,
  "message": "Email is available"
}
```

---

### Check Username Availability
**POST** `/check-username`

```json
{
  "username": "john_doe"
}
```

**Response (200):**
```json
{
  "username": "john_doe",
  "exists": false,
  "message": "Username is available"
}
```

---

### Refresh Access Token
**POST** `/refresh-token`

**Headers:**
```
Cookie: refreshToken=<refresh_token>
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "horseowner"
  }
}
```

---

## 2. Protected Endpoints (Require Access Token)

**All protected endpoints require:**
```
Authorization: Bearer <access_token>
```

### Get Current User
**GET** `/current-user`

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "role": "horseowner",
    "status": "active"
  }
}
```

---

### Logout
**POST** `/logout`

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## 3. Role Registration Endpoints

### Register as HorseOwner
**POST** `/register-horseowner`

```json
{
  "address": "123 Main St, Anytown, USA",
  "licenseNumber": "HO-2024-001"
}
```

**Response (201):**
```json
{
  "message": "Registered as horse owner successfully",
  "horseOwner": {
    "_id": "507f1f77bcf86cd799439012",
    "ownerId": "507f1f77bcf86cd799439011",
    "address": "123 Main St, Anytown, USA",
    "licenseNumber": "HO-2024-001"
  }
}
```

---

### Register as Jockey
**POST** `/register-jockey`

```json
{
  "height": 170,
  "weight": 65,
  "ranking": 5
}
```

**Response (201):**
```json
{
  "message": "Registered as jockey successfully",
  "jockey": {
    "_id": "507f1f77bcf86cd799439013",
    "jockeyId": "507f1f77bcf86cd799439011",
    "height": 170,
    "weight": 65,
    "ranking": 5,
    "matchesRaced": 0,
    "totalWins": 0,
    "status": "active"
  }
}
```

---

### Register as Spectator
**POST** `/register-spectator`

**Response (201):**
```json
{
  "message": "Registered as spectator successfully",
  "spectator": {
    "_id": "507f1f77bcf86cd799439014",
    "spectatorId": "507f1f77bcf86cd799439011",
    "rewardPoints": 0
  }
}
```

---

## 4. Certification Upload Endpoints

### Upload HorseOwner Certification
**POST** `/upload-horseowner-cert`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `certification` (file, required): PDF file
- `licenseNumber` (string, required): License number

**Response (201):**
```json
{
  "message": "HorseOwner certification uploaded successfully",
  "certification": {
    "filename": "507f1f77bcf86cd799439011_horseowner_certificate_1234567890.pdf",
    "filepath": "/uploads/certifications/507f1f77bcf86cd799439011_horseowner_certificate_1234567890.pdf",
    "originalName": "license.pdf",
    "size": 102400,
    "uploadedAt": "2024-05-26T10:30:00Z"
  }
}
```

---

### Upload Jockey Certification
**POST** `/upload-jockey-cert`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `certification` (file, required): PDF file

**Response (201):**
```json
{
  "message": "Jockey certification uploaded successfully",
  "certification": {
    "filename": "507f1f77bcf86cd799439011_jockey_certificate_1234567890.pdf",
    "filepath": "/uploads/certifications/507f1f77bcf86cd799439011_jockey_certificate_1234567890.pdf",
    "originalName": "jockey_license.pdf",
    "size": 102400,
    "uploadedAt": "2024-05-26T10:30:00Z"
  }
}
```

---

### Upload Referee Certification
**POST** `/upload-referee-cert`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `certification` (file, required): PDF file
- `certificationNumber` (string, required): Certification number

**Response (201):**
```json
{
  "message": "Referee certification uploaded successfully",
  "certification": {
    "filename": "507f1f77bcf86cd799439011_referee_certificate_1234567890.pdf",
    "filepath": "/uploads/certifications/507f1f77bcf86cd799439011_referee_certificate_1234567890.pdf",
    "originalName": "referee_cert.pdf",
    "size": 102400,
    "uploadedAt": "2024-05-26T10:30:00Z"
  }
}
```

---

### Download Certification
**GET** `/certification/:filename`

**Response:** Binary PDF file

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Email already exists"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "User account is not active"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

---

## Authentication Flow

### User Registration → Login Flow
1. User calls `POST /register` with credentials
2. User calls `POST /login` with username/password
3. Backend returns `accessToken` + `refreshToken` (in cookie)
4. Client stores `accessToken` in memory/state
5. For protected routes, send `Authorization: Bearer <accessToken>`

### Role Assignment Flow
1. User logs in as "user" role
2. User calls `POST /register-horseowner` (or jockey/spectator)
3. User role is updated to selected role
4. If professional role, upload certification via multipart endpoint
5. Access granted to role-specific features

### Token Refresh Flow
1. Access token expires (7 days by default)
2. Client detects 401 response
3. Client calls `POST /refresh-token` (refreshToken auto-sent in cookie)
4. Backend returns new `accessToken`
5. Client retries original request with new token

---

## Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (@$!%*?&)

Example: `SecurePass123!`

---

## File Upload Constraints
- **Allowed Format:** PDF only
- **Max Size:** 10MB
- **Upload Path:** `/public/uploads/certifications/`

---

## User Roles
| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Basic user | Read-only access |
| `horseowner` | Horse owner | Manage horses |
| `jockey` | Professional jockey | Access jockey features |
| `referee` | Race referee | Manage races |
| `spectator` | Race watcher | Earn reward points |
| `admin` | Administrator | Full system access |

---

## Environment Variables Required
```
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
NODE_ENV=development
PORT=3000
```

---

## Usage Examples

### cURL Examples

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:3000/api/auth/current-user \
  -H "Authorization: Bearer <access_token>"
```

**Upload Certification:**
```bash
curl -X POST http://localhost:3000/api/auth/upload-horseowner-cert \
  -H "Authorization: Bearer <access_token>" \
  -F "certification=@path/to/license.pdf" \
  -F "licenseNumber=HO-2024-001"
```
