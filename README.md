# Smart Attendance Tracker

A comprehensive attendance management system with facial recognition, NFC, and QR code verification for educational institutions.

## Features

- 🔐 **Multiple Verification Methods**
  - Facial Recognition using face-api.js
  - QR Code scanning
  - NFC (Near Field Communication) support
  
- 📊 **Real-time Updates**
  - Live attendance tracking
  - Instant notifications
  - WebSocket-based updates

- 📈 **Analytics & Reporting**
  - Detailed attendance reports
  - Student attendance history
  - Class-wise statistics
  - Export functionality

- 🔒 **Security Features**
  - JWT-based authentication
  - Proxy attendance prevention
  - Secure data storage
  - Role-based access control

- ☁️ **Cloud Storage**
  - MongoDB database
  - Scalable architecture
  - Data backup support

## Technology Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- Socket.io for real-time updates
- JWT for authentication
- face-api.js for facial recognition

### Frontend
- React
- Material-UI / Tailwind CSS
- Socket.io-client
- face-api.js
- QR Code scanner

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd smart-attendance-tracker
```

2. Install dependencies
```bash
npm run install-all
```

3. Set up environment variables
Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/attendance-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

4. Download face recognition models
```bash
npm run download-models
```
Or manually download from [face-api.js models](https://github.com/justadudewhohacks/face-api.js-models) to `client/public/models/`

5. Start MongoDB (if using local installation)
```bash
# macOS/Linux
mongod

# Windows
net start MongoDB
```

6. Start the development server
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Environment Variables

Create a `.env` file in the root directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance-tracker
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
NODE_ENV=development
```

## Project Structure

```
smart-attendance-tracker/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── index.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── public/
└── package.json
```

## Usage

### For Faculty
1. Register/Login to the system
2. Create classes and enroll students
3. Create a new attendance session
4. Choose verification method (Face, QR, NFC, or Hybrid)
5. Monitor real-time attendance via WebSocket updates
6. Generate reports and analytics
7. Export attendance data

### For Students
1. Register/Login to the system
2. Register your face in the Profile page (for face recognition)
3. Join an active attendance session
4. Verify using the selected method:
   - **Face Recognition**: Use camera to verify identity
   - **QR Code**: Scan the QR code displayed by instructor
   - **NFC**: Tap NFC card/device (supported browsers only)
5. View attendance history and statistics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register-face` - Register face for recognition

### Attendance
- `POST /api/attendance/create-session` - Create attendance session (Faculty)
- `POST /api/attendance/mark-face` - Mark attendance via facial recognition
- `POST /api/attendance/mark-qr` - Mark attendance via QR code
- `POST /api/attendance/mark-nfc` - Mark attendance via NFC
- `GET /api/attendance/session/:id` - Get session details
- `PUT /api/attendance/session/:id/end` - End attendance session (Faculty)
- `GET /api/attendance/reports` - Get attendance reports

### Classes
- `GET /api/classes` - Get all classes (filtered by role)
- `GET /api/classes/:id` - Get single class
- `POST /api/classes` - Create class (Faculty/Admin)
- `PUT /api/classes/:id` - Update class (Faculty/Admin)

### Analytics
- `GET /api/analytics/class/:classId` - Get class analytics
- `GET /api/analytics/student/:studentId` - Get student analytics
- `GET /api/analytics/overall` - Get overall analytics (Faculty/Admin)

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Role-Based Access Control**: Different permissions for students, faculty, and admin
- **Proxy Prevention**: 
  - Face recognition prevents proxy attendance
  - Location tracking (optional) for verification
  - Time-based QR code expiration
  - NFC device binding
- **Data Validation**: Input validation on all endpoints
- **Secure Headers**: CORS and security headers configured

## Anti-Proxy Measures

1. **Facial Recognition**: Biometric verification ensures the actual student is present
2. **Location Tracking**: Optional GPS verification to ensure attendance from correct location
3. **Time-Limited QR Codes**: QR codes expire after a set duration
4. **Session Management**: Attendance can only be marked during active sessions
5. **One-Time Marking**: Students can only mark attendance once per session
6. **NFC Binding**: NFC IDs are bound to specific student accounts

## Browser Compatibility

- **Face Recognition**: All modern browsers with camera access
- **QR Code Scanning**: All modern browsers with camera access
- **NFC**: 
  - Chrome on Android
  - Edge on Windows
  - Manual entry fallback available

## Troubleshooting

See [SETUP.md](SETUP.md) for detailed troubleshooting guide.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

