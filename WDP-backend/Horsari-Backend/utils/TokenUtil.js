const jwt = require('jsonwebtoken');

class TokenUtil {
    // Generate JWT token
    generateToken(userId, expiresIn = '1h') {
        return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn,
        });
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
            return null;
        }
    }

    // Decode token without verification
    decodeToken(token) {
        return jwt.decode(token);
    }
}

module.exports = new TokenUtil();
