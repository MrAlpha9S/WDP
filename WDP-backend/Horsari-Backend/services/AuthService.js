const UserRepository = require('../repositories/UserRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const SpectatorRepository = require('../repositories/SpectatorRepository');
const RefereeRepository = require('../repositories/RefereeRepository');
const PasswordUtil = require('../utils/PasswordUtil');
const TokenUtil = require('../utils/TokenUtil');
const { CloudinaryUtil } = require('../utils/CloudinaryUtil');

class AuthService {
    // Unified register with role support
    async register(userData, fileBuffer = null, fileName = null) {
        try {
            const { username, email, password, fullName, phoneNumber, dateOfBirth, role } =
                userData;

            // Validate required fields
            if (!username || !email || !password) {
                return {
                    code: 400,
                    msg: 'Username, email, and password are required',
                };
            }

            // Validate role if provided
            const licensedRoles = ['horseowner', 'jockey', 'referee'];
            const allAllowedRoles = [...licensedRoles, 'spectator'];
            if (role && !allAllowedRoles.includes(role)) {
                return {
                    code: 400,
                    msg: 'Invalid role specified',
                };
            }

            // Roles that require a license PDF
            if (licensedRoles.includes(role) && !fileBuffer) {
                return {
                    code: 400,
                    msg: `A license PDF is required for the ${role} role`,
                };
            }

            // Validate email doesn't exist
            const existingUser = await UserRepository.findByEmail(email);
            if (existingUser) {
                return {
                    code: 409,
                    msg: 'An account with this email already exists',
                };
            }

            // Validate username doesn't exist
            const existingUsername = await UserRepository.findByUsername(username);
            if (existingUsername) {
                return {
                    code: 409,
                    msg: 'This username is already taken',
                };
            }

            // Validate password strength
            if (!PasswordUtil.validatePasswordStrength(password)) {
                return {
                    code: 400,
                    msg: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
                };
            }

            // Hash password
            const passwordHash = await PasswordUtil.hashPassword(password);

            // Create user
            const newUser = await UserRepository.create({
                username,
                email,
                passwordHash,
                fullName: fullName || '',
                phoneNumber: phoneNumber || '',
                dateOfBirth: dateOfBirth || null,
                role: role || 'spectator',
                status: 'active',
            });

            // Upload license PDF to Cloudinary if provided
            let licenseUrl = null;
            if (fileBuffer && licensedRoles.includes(role)) {
                const safeFileName = fileName || `license_${newUser._id}.pdf`;
                licenseUrl = await CloudinaryUtil.uploadFile(
                    fileBuffer,
                    safeFileName,
                    `licenses/${role}`
                );
            }

            // Create role-specific entity
            const effectiveRole = role || 'spectator';
            switch (effectiveRole) {
                case 'horseowner':
                    await HorseOwnerRepository.create({
                        _id: newUser._id,
                        licenseLink: licenseUrl,
                        licenseStatus: 'pending',
                    });
                    break;
                case 'referee':
                    await RefereeRepository.create({
                        _id: newUser._id,
                        licenseLink: licenseUrl,
                        licenseStatus: 'pending',
                    });
                    break;
                case 'jockey':
                    await JockeyRepository.create({
                        _id: newUser._id,
                        licenseLink: licenseUrl,
                        licenseStatus: 'pending',
                        matchesRaced: 0,
                        totalWins: 0,
                        status: 'active',
                    });
                    break;
                case 'spectator':
                    await SpectatorRepository.create({
                        _id: newUser._id,
                    });
                    break;
                default:
                    break;
            }

            // Generate tokens
            const accessToken = TokenUtil.generateToken(newUser._id);

            return {
                code: 201,
                data: {
                    accessToken,
                    user: {
                        username: newUser.username,
                        email: newUser.email,
                        role: newUser.role,
                        fullName: newUser.fullName,
                        image: newUser.image || null,
                    },
                },
                msg: 'User registered successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Login user
    async login(loginData) {
        try {
            const { email, password } = loginData;

            // Validate required fields
            if (!email || !password) {
                return {
                    code: 400,
                    msg: 'Email and password are required',
                };
            }

            const user = await UserRepository.findByEmail(email);
            if (!user) {
                return {
                    code: 401,
                    msg: 'User not found',
                };
            }

            // Exact case match — reject if the caller used a different casing
            // (e.g. Admin1@horsari.com must not match admin1@horsari.com)
            if (user.email !== email) {
                return {
                    code: 401,
                    msg: 'User not found',
                };
            }

            const isPasswordValid = await PasswordUtil.comparePassword(
                password,
                user.passwordHash
            );
            if (!isPasswordValid) {
                return {
                    code: 401,
                    msg: 'Invalid password',
                };
            }

            if (user.status !== 'active') {
                return {
                    code: 403,
                    msg: 'User account is not active',
                };
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
                        role: user.role,
                        fullName: user.fullName,
                        image: user.image || null,
                    },
                },
                msg: 'Login successful',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get user by ID
    async getUserById(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            return {
                code: 200,
                data: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    status: user.status,
                    image: user.image || null,
                },
                msg: 'User retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Role-agnostic avatar upload — every role shares the same User.image
    // field, so this doesn't need to live in each role's own service.
    async uploadAvatar(userId, fileBuffer, fileName) {
        try {
            if (!fileBuffer) {
                return { code: 400, msg: 'Image file is required' };
            }

            const secureUrl = await CloudinaryUtil.uploadFile(fileBuffer, fileName, 'users', 'image');
            const user = await UserRepository.updateById(userId, { image: secureUrl });
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            return {
                code: 200,
                data: { image: secureUrl },
                msg: 'Avatar updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }
}

module.exports = new AuthService();
