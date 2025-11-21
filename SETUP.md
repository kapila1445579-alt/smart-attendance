# Setup Guide for Smart Attendance Tracker

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/attendance-tracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

### 3. Download Face Recognition Models

The face-api.js models need to be downloaded and placed in the `client/public/models` directory.

**Option 1: Manual Download**

1. Create the directory: `client/public/models`
2. Download the following files from the [face-api.js models repository](https://github.com/justadudewhohacks/face-api.js-models):
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`

**Option 2: Using Script (if available)**

```bash
# Run the download script (if created)
npm run download-models
```

### 4. Start MongoDB

If using local MongoDB:

```bash
# On macOS/Linux
mongod

# On Windows
# Start MongoDB service from Services or run:
net start MongoDB
```

If using MongoDB Atlas, ensure your connection string is correct in `.env`.

### 5. Run the Application

**Development Mode (runs both server and client):**

```bash
npm run dev
```

**Or run separately:**

```bash
# Terminal 1 - Start server
npm run server

# Terminal 2 - Start client
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## First Time Setup

1. **Register an Admin/Faculty Account:**
   - Go to http://localhost:3000/register
   - Create an account with role "faculty" or "admin"

2. **Create Classes:**
   - Login as faculty
   - Create classes through the API or add them directly to MongoDB

3. **Register Students:**
   - Students can register themselves or be added by admin
   - Students should register their face in the Profile page

4. **Start Attendance Sessions:**
   - Faculty can create attendance sessions
   - Choose verification method (Face, QR, NFC, or Hybrid)

## Troubleshooting

### Face Recognition Not Working

- Ensure models are downloaded to `client/public/models`
- Check browser console for errors
- Grant camera permissions when prompted
- Use HTTPS in production (required for camera access)

### MongoDB Connection Issues

- Verify MongoDB is running
- Check connection string in `.env`
- Ensure MongoDB port (27017) is not blocked

### NFC Not Working

- Web NFC API is only supported in:
  - Chrome on Android
  - Edge on Windows
- Use manual NFC ID entry as fallback

### QR Code Issues

- Ensure QR code is scanned within the expiration time
- Check that session is active
- Verify student is enrolled in the class

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Build the client: `npm run build`
3. Serve the built files from `client/build`
4. Use a process manager like PM2 for the server
5. Set up HTTPS (required for camera/NFC APIs)
6. Use a production MongoDB instance
7. Set strong JWT_SECRET

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production
- Implement rate limiting
- Add input validation
- Regular security updates
- Backup database regularly

