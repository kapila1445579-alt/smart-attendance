const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Generate QR code for attendance session
const generateQRCode = async (sessionId, expiresInMinutes = 15) => {
  const code = uuidv4();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  
  const data = {
    sessionId: sessionId || code, // Use code as fallback if sessionId not provided yet
    code,
    expiresAt: expiresAt.toISOString()
  };

  try {
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
    });

    return {
      code,
      qrDataURL,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Verify QR code
const verifyQRCode = (scannedData, sessionCode, expiresAt) => {
  try {
    const data = typeof scannedData === 'string' ? JSON.parse(scannedData) : scannedData;
    
    // Check if code matches
    if (data.code !== sessionCode) {
      return { valid: false, message: 'Invalid QR code' };
    }

    // Check if expired
    if (new Date(data.expiresAt) < new Date()) {
      return { valid: false, message: 'QR code has expired' };
    }

    // Check if session ID matches
    if (data.sessionId) {
      return { valid: true, sessionId: data.sessionId };
    }

    return { valid: false, message: 'Invalid QR code format' };
  } catch (error) {
    return { valid: false, message: 'Invalid QR code format' };
  }
};

// Generate secure token for NFC
const generateNFCToken = (userId, sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  return {
    token,
    userId,
    sessionId,
    expiresAt
  };
};

module.exports = {
  generateQRCode,
  verifyQRCode,
  generateNFCToken
};

