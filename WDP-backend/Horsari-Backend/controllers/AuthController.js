const AuthService = require('../services/AuthService');
const NotificationService = require('../services/NotificationService');

class AuthController {
    // Unified register with role support
    async register(req, res) {
        const fileBuffer = req.file ? req.file.buffer : null;
        const fileName = req.file ? req.file.originalname : null;
        const response = await AuthService.register(req.body, fileBuffer, fileName);

        if (response.code === 201) {
            res.cookie('Authorization', `Bearer ${response.data.accessToken}`, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000,
            });
            const io = req.app.get('io');
            const role = req.body.role ?? 'user';
            const name = req.body.fullName ?? 'A new user';
            NotificationService.notify({
                role: 'admin',
                type: 'new_user',
                title: 'New User Registered',
                message: `${name} joined as ${role}.`,
            }, io).catch(err => console.error('[register] notify admin error:', err.message));
        }

        return res.status(response.code).json(response);
    }

    // Login user
    async login(req, res) {
        const response = await AuthService.login(req.body);

        if (response.code === 200) {
            // Set access token as httpOnly cookie (1 hour)
            res.cookie('Authorization', `Bearer ${response.data.accessToken}`, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000, // 1 hour
            });
        }

        return res.status(response.code).json(response);
    }

    // Get current user
    async getCurrentUser(req, res) {
        const response = await AuthService.getUserById(req.userId);
        return res.status(response.code).json(response);
    }

    // Logout
    async logout(req, res) {
        res.clearCookie('Authorization');
        return res.status(200).json({
            msg: 'Logout successful',
        });
    }
}

module.exports = new AuthController();
