const AuthService = require('../services/AuthService');

class AuthController {
    // Unified register with role support
    async register(req, res) {
        const fileBuffer = req.file ? req.file.buffer : null;
        const fileName = req.file ? req.file.originalname : null;
        const response = await AuthService.register(req.body, fileBuffer, fileName);

        if (response.code === 201) {
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

    // Google OAuth login/register
    async googleAuth(req, res) {
        const response = await AuthService.googleAuth(req.body);

        if (response.code === 200 || response.code === 201) {
            if (response.data && response.data.accessToken) {
                res.cookie('Authorization', `Bearer ${response.data.accessToken}`, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 1000, // 1 hour
                });
            }
        }

        return res.status(response.code).json(response);
    }

    // Google OAuth - explicit login (will create account if missing)
    async googleLogin(req, res) {
        const response = await AuthService.googleLogin(req.body);

        if (response.code === 200 || response.code === 201) {
            if (response.data && response.data.accessToken) {
                res.cookie('Authorization', `Bearer ${response.data.accessToken}`, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 1000, // 1 hour
                });
            }
        }

        return res.status(response.code).json(response);
    }

    // Google Login - Additional Info (update role and create entity)
    async googleLoginAdditionalInfo(req, res) {
        // Get userId from auth middleware (JWT token)
        const userId = req.userId;
        
        // Merge userId with request body
        const data = {
            userId,
            ...req.body
        };
        
        const response = await AuthService.googleLoginAdditionalInfo(data);
        return res.status(response.code).json(response);
    }

    // // Keep legacy methods for backward compatibility
    // async registerHorseOwner(req, res) {
    //     const response = await AuthService.registerHorseOwner(
    //         req.userId,
    //         req.body
    //     );
    //     return res.status(response.code).json(response);
    // }

    // async registerJockey(req, res) {
    //     const response = await AuthService.registerJockey(req.userId, req.body);
    //     return res.status(response.code).json(response);
    // }

    // async registerSpectator(req, res) {
    //     const response = await AuthService.registerSpectator(req.userId);
    //     return res.status(response.code).json(response);
    // }


    // Get current user
    async getCurrentUser(req, res) {
        const response = await AuthService.getUserById(req.userId);
        return res.status(response.code).json(response);
    }

    // Get user by ID
    async getUserById(req, res) {
        const response = await AuthService.getUserById(req.params.id);
        return res.status(response.code).json(response);
    }

    // // Check if email exists
    // async emailExists(req, res) {
    //     const response = await AuthService.emailExists(req.body.email);
    //     return res.status(response.code).json(response);
    // }

    // // Check if username exists
    // async usernameExists(req, res) {
    //     const response = await AuthService.usernameExists(req.body.username);
    //     return res.status(response.code).json(response);
    // }

    // Verify token
    async verifyToken(req, res) {
        const token = req.headers.authorization?.split(' ')[1];
        const response = await AuthService.verifyToken(token);
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
