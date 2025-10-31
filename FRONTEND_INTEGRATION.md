# Frontend Authentication Integration Guide

## ✅ What's Been Completed

### 1. **API Services Created** (in `/services` folder)
- ✅ `config.ts` - API configuration and endpoints
- ✅ `storage.ts` - AsyncStorage for tokens and user data
- ✅ `authService.ts` - Authentication API calls
- ✅ `storageService.ts` - File upload to MEGA
- ✅ `chatService.ts` - Chat messaging
- ✅ `index.ts` - Export all services

### 2. **Auth Screens Updated**
- ✅ `SignUpScreen.tsx` - Now registers users and uploads biometrics to MEGA
- ✅ `SignInScreen.tsx` - Now authenticates with backend API

### 3. **Dependencies Installed**
- ✅ `@react-native-async-storage/async-storage` - For secure token storage

---

## 🚀 How It Works

### **Sign Up Flow**
```
User fills form (name, email, CIN)
        ↓
Takes face photo
        ↓
Records voice
        ↓
Press "Create Account"
        ↓
1. Backend creates user account
2. Backend creates MEGA folder
3. App uploads face image to MEGA
4. App uploads voice to MEGA
        ↓
User can now sign in!
```

### **Sign In Flow**
```
User enters email & password
   (or records voice)
        ↓
Press "Sign In"
        ↓
1. Backend validates credentials
2. Backend returns JWT token
3. App stores token securely
4. (Optional) App uploads voice sample
        ↓
User is authenticated!
```

---

## ⚙️ Configuration Required

### **IMPORTANT: Update API URL**

Open `/services/config.ts` and change the `BASE_URL`:

```typescript
export const API_CONFIG = {
  // For testing on emulator:
  BASE_URL: 'http://10.0.2.2:5000/api',  // Android emulator
  // BASE_URL: 'http://localhost:5000/api',  // iOS simulator
  
  // For testing on physical device:
  // BASE_URL: 'http://YOUR_COMPUTER_IP:5000/api',  // Replace YOUR_COMPUTER_IP
  // Example: 'http://192.168.1.100:5000/api'
}
```

**To find your IP address:**
- **Linux/Mac**: Run `ifconfig` or `ip addr`
- **Windows**: Run `ipconfig`
- Look for your local network IP (usually starts with 192.168.x.x or 10.0.x.x)

---

## 🧪 Testing

### **1. Start Backend Server**
```bash
cd vera_backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

Server should run at: `http://localhost:5000`

### **2. Test API Connection**
Open browser to: `http://localhost:5000`

Should see:
```json
{
  "message": "Vera Backend API",
  "version": "1.0.0",
  "status": "running"
}
```

### **3. Run React Native App**
```bash
cd vera
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS
- Or scan QR code with Expo Go

### **4. Test Sign Up**
1. Open app → Sign Up screen
2. Fill in:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - CIN: "12345678"
3. Take face photo
4. Record voice (5 seconds)
5. Press "Create Account"

**Expected Result:**
- ✅ User created in PostgreSQL database
- ✅ MEGA folder created with user's name
- ✅ Face image uploaded to MEGA
- ✅ Voice recording uploaded to MEGA
- ✅ Success message shown

### **5. Test Sign In**
1. Open app → Sign In screen
2. Enter:
   - Email: "john@example.com"
   - Password: (leave empty for voice-auth)
3. Press "Sign In"

**Expected Result:**
- ✅ User authenticated
- ✅ JWT token saved in AsyncStorage
- ✅ Welcome message shown
- ✅ Navigated to home screen

---

## 📱 What Each Screen Does

### **SignUpScreen.tsx**
- Collects user information
- Captures face photo
- Records voice sample
- **Calls backend API:**
  - `POST /api/auth/register` - Creates user + MEGA folder
  - `POST /api/storage/upload` - Uploads face image
  - `POST /api/storage/upload` - Uploads voice recording

### **SignInScreen.tsx**
- Accepts email/password OR voice recording
- **Calls backend API:**
  - `POST /api/auth/login` - Authenticates user
  - Returns JWT token
  - Stores token in AsyncStorage

---

## 🔐 Security Features

1. **JWT Token Storage**: Tokens stored securely in AsyncStorage
2. **Password Hashing**: Passwords hashed with bcrypt on backend
3. **HTTPS Ready**: Configure CORS and use HTTPS in production
4. **Token Validation**: All API requests require valid JWT token

---

## 📊 Data Flow

### **User Data**
Stored in **PostgreSQL (Neon)**:
- User ID
- Username
- Email
- Password (hashed)
- **MEGA folder link**
- Timestamps

### **Biometric Data**
Stored in **MEGA Cloud**:
- Face images (in `/images` folder)
- Voice recordings (in `/voice` folder)
- Other files (in `/documents` and `/data` folders)

---

## 🐛 Troubleshooting

### **Error: "Network request failed"**
**Solution:**
1. Check backend server is running
2. Update API URL in `services/config.ts`
3. For physical device, use your computer's IP address
4. Ensure firewall allows connections on port 5000

### **Error: "Failed to register"**
**Solution:**
1. Check backend logs for errors
2. Verify MEGA credentials in backend `.env`
3. Ensure database connection is working
4. Check internet connection

### **Error: "Token is invalid"**
**Solution:**
1. Clear app data/cache
2. Sign in again to get new token
3. Check JWT_SECRET_KEY matches on backend

### **File Upload Fails**
**Solution:**
1. Check MEGA credentials on backend
2. Ensure user MEGA folder was created
3. Check internet connection
4. Review backend logs for MEGA errors

---

## 📝 Next Steps

### **Recommended Enhancements:**

1. **Add Password Field to SignUp**
   - Currently uses voice-only registration
   - Add password input for traditional auth

2. **Implement Voice Authentication**
   - Add voice comparison on backend
   - Use voice biometrics for login

3. **Add Face Recognition**
   - Implement face verification on backend
   - Use face matching for authentication

4. **Profile Screen**
   - Show user's MEGA folder link
   - Display stored files
   - Allow profile updates

5. **Chat Integration**
   - Connect ChatScreen to backend API
   - Store messages in database
   - Sync across devices

---

## 📞 API Endpoints Available

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### **User Profile**
- `GET /api/user/profile` - Get user info
- `PUT /api/user/profile` - Update profile

### **File Storage**
- `POST /api/storage/upload` - Upload file to MEGA
- `POST /api/storage/upload-data` - Upload text/data
- `GET /api/storage/files` - List user's files

### **Chat**
- `GET /api/chat/messages` - Get messages
- `POST /api/chat/messages` - Send message

---

## ✅ Quick Checklist

Before testing:
- [ ] Backend server running (`python app.py`)
- [ ] Database initialized (`python init_db.py`)
- [ ] MEGA password set in backend `.env`
- [ ] API URL updated in frontend `config.ts`
- [ ] AsyncStorage package installed (`npm install`)
- [ ] React Native app running (`npm start`)

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Sign up creates user in database
- ✅ MEGA folder appears in your MEGA account
- ✅ Face and voice files uploaded to MEGA
- ✅ Sign in returns JWT token
- ✅ User data persists after app restart
- ✅ API calls succeed with authentication

---

**Last Updated**: October 31, 2025
**Status**: ✅ Ready for testing
