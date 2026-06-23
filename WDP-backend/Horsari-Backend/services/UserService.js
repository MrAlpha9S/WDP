const UserRepository = require('../repositories/UserRepository');
const PasswordUtil = require('../utils/PasswordUtil');

class UserService {
    async create(userData) {
        return await UserRepository.create(userData);
    }

    async findById(id) {
        return await UserRepository.findById(id);
    }

    async findByUsername(username) {
        return await UserRepository.findByUsername(username);
    }

    async findByEmail(email) {
        return await UserRepository.findByEmail(email);
    }

    async findAll(filter = {}, limit = 10, skip = 0) {
        return await UserRepository.findAll(filter, limit, skip);
    }

    async findByRole(role) {
        return await UserRepository.findByRole(role);
    }

    async updateById(id, updateData) {
        return await UserRepository.updateById(id, updateData);
    }

    async updateByUsername(username, updateData) {
        return await UserRepository.updateByUsername(username, updateData);
    }

    async deleteById(id) {
        return await UserRepository.deleteById(id);
    }

    async deleteByUsername(username) {
        return await UserRepository.deleteByUsername(username);
    }

    async count(filter = {}) {
        return await UserRepository.count(filter);
    }

    async exists(username) {
        return await UserRepository.exists(username);
    }

    async changePassword(userId, passwordData) {
        try {
            const { oldPassword, newPassword, confirmPassword } = passwordData;

            const user = await UserRepository.findById(userId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            if (user.role === 'admin') {
                return { code: 403, msg: 'Admin accounts cannot change password' };
            }

            if (!oldPassword || !newPassword || !confirmPassword) {
                return { code: 400, msg: 'Old password, new password, and confirm password are required' };
            }

            if (newPassword !== confirmPassword) {
                return { code: 400, msg: 'New password and confirm password do not match' };
            }

            if (!PasswordUtil.validatePasswordStrength(newPassword)) {
                return { code: 400, msg: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' };
            }

            if (!user.passwordHash) {
                return { code: 400, msg: 'This account uses Google authentication and does not have a password' };
            }

            const isPasswordValid = await PasswordUtil.comparePassword(oldPassword, user.passwordHash);
            if (!isPasswordValid) {
                return { code: 401, msg: 'Old password is incorrect' };
            }

            const newPasswordHash = await PasswordUtil.hashPassword(newPassword);
            await UserRepository.updateById(userId, { passwordHash: newPasswordHash });

            return { code: 200, msg: 'Password changed successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new UserService();
