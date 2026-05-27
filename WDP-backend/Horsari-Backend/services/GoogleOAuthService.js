const UserRepository = require('../repositories/UserRepository');
const TokenUtil = require('../utils/TokenUtil');

class GoogleOAuthService {
    // Handle Google OAuth callback
    async handleGoogleCallback(profile) {
        try {
            // Check if user exists by email
            let user = await UserRepository.findByEmail(profile.emails[0].value);

            if (!user) {
                // Create new user from Google profile
                user = await UserRepository.create({
                    username: `g_${profile.id}`,
                    email: profile.emails[0].value,
                    passwordHash: null, // No password for OAuth users
                    fullName:
                        profile.displayName ||
                        `${profile.name.givenName} ${profile.name.familyName}`,
                    image: profile.photos[0]?.value || null,
                    role: 'spectator',
                    googleId: profile.id,
                    status: 'active',
                });
            }

            // Generate tokens
            const accessToken = TokenUtil.generateToken(user._id);

            return {
                code: 200,
                data: {
                    accessToken,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        fullName: user.fullName,
                        image: user.image,
                        role: user.role,
                        isFirstLogin: !user.passwordHash, // No password means first login via OAuth
                    },
                },
                msg: 'Google OAuth login successful',
            };
        } catch (error) {
            return {
                code: 500,
                msg: `Google OAuth error: ${error.message}`,
            };
        }
    }

    // Link Google account to existing user
    async linkGoogleAccount(userId, googleProfile) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            // Update user with Google data
            const updatedUser = await UserRepository.updateById(userId, {
                image: googleProfile.photos[0]?.value || user.image,
                // Optionally store Google ID
            });

            return {
                code: 200,
                data: updatedUser,
                msg: 'Google account linked successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: `Link Google account error: ${error.message}`,
            };
        }
    }
}

module.exports = new GoogleOAuthService();
