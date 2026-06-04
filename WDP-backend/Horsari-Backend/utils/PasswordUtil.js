const bcrypt = require('bcrypt');

class PasswordUtil {
    // Hash password
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    // Compare password with hash
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // Validate password strength
    validatePasswordStrength(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongPasswordRegex.test(password);
    }
}

module.exports = new PasswordUtil();
