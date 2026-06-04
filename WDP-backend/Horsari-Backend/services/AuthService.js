const UserRepository = require('../repositories/UserRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const SpectatorRepository = require('../repositories/SpectatorRepository');
const RefereeRepository = require('../repositories/RefereeRepository');
const PasswordUtil = require('../utils/PasswordUtil');
const TokenUtil = require('../utils/TokenUtil');
const CloudinaryUtil = require('../utils/cloudinaryUtil');

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
                        ownerId: newUser._id,
                        license_link: licenseUrl,
                        license_status: 'pending',
                    });
                    break;
                case 'referee':
                    await RefereeRepository.create({
                        refereeId: newUser._id,
                        license_link: licenseUrl,
                        license_status: 'pending',
                    });
                    break;
                case 'jockey':
                    await JockeyRepository.create({
                        jockeyId: newUser._id,
                        license_link: licenseUrl,
                        license_status: 'pending',
                        matchesRaced: 0,
                        totalWins: 0,
                        status: 'active',
                    });
                    break;
                case 'spectator':
                    await SpectatorRepository.create({
                        spectatorId: newUser._id,
                        rewardPoints: 0,
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
                    
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        fullName: user.fullName,
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

    // Google OAuth login/register: accepts { idToken }
    async googleAuth(data) {
        // Backwards-compatible: treat as googleLogin
        return await this.googleLogin(data);
    }

    // Verify Google ID token via tokeninfo endpoint
    async _verifyGoogleToken(idToken) {
        if (!idToken) throw new Error('idToken is required');
        const tokenInfo = await new Promise((resolve, reject) => {
            const https = require('https');
            const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
            https
                .get(url, (res) => {
                    let raw = '';
                    res.on('data', (chunk) => (raw += chunk));
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(raw);
                            if (res.statusCode !== 200) {
                                return reject(new Error(parsed.error_description || parsed.error || 'Invalid ID token'));
                            }
                            resolve(parsed);
                        } catch (e) {
                            reject(e);
                        }
                    });
                })
                .on('error', (err) => reject(err));
        });

        // Validate essential claims against configuration
        try {
            const clientId = process.env.GOOGLE_CLIENT_ID || '1048249867992-061vnlp03hnfhoeadm612ro2of26ura8.apps.googleusercontent.com';
            const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];

            if (tokenInfo.aud !== clientId) {
                throw new Error('Token audience (aud) does not match configured Google client ID');
            }

            if (tokenInfo.azp && tokenInfo.azp !== clientId) {
                throw new Error('Token authorized party (azp) does not match configured Google client ID');
            }

            if (!validIssuers.includes(tokenInfo.iss)) {
                throw new Error('Invalid token issuer');
            }

            const nowSec = Math.floor(Date.now() / 1000);
            if (Number(tokenInfo.exp) < nowSec) {
                throw new Error('ID token has expired');
            }

            // tokenInfo.email_verified may be boolean or string
            if (!(tokenInfo.email_verified === true || tokenInfo.email_verified === 'true')) {
                throw new Error('Email not verified by Google');
            }
        } catch (err) {
            throw err;
        }

        return tokenInfo;
    }

    // Google Login: if account doesn't exist, create (register)
    async googleLogin(data) {
        try {
            const { idToken } = data;
            const tokenInfo = await this._verifyGoogleToken(idToken);

            const email = tokenInfo.email;
            const googleId = tokenInfo.sub;
            const fullName = tokenInfo.name || `${tokenInfo.given_name || ''} ${tokenInfo.family_name || ''}`.trim();
            const picture = tokenInfo.picture || null;

            if (!email) {
                return { code: 400, msg: 'Google token did not contain an email' };
            }

            let user = await UserRepository.findByEmail(email);
            let created = false;

            if (!user) {
                // create user
                let usernameBase = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '') || `g_${googleId}`;
                let username = usernameBase;
                let attempt = 0;
                while (await UserRepository.findByUsername(username)) {
                    attempt += 1;
                    username = `${usernameBase}_${attempt}`;
                }

                user = await UserRepository.create({
                    username,
                    email,
                    passwordHash: null,
                    fullName,
                    googleId,
                    role: 'google_unchosen',
                    status: 'active',
                });

                created = true;
            } else {
                if (!user.googleId) {
                    await UserRepository.updateById(user._id, { googleId });
                }
            }

            const accessToken = TokenUtil.generateToken(user._id);

            return {
                code: created ? 201 : 200,
                data: {
                    accessToken,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        isFirstLogin: !user.passwordHash,
                    },
                },
                msg: created ? 'User registered via Google (login fallback)' : 'Login successful via Google',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Google Login Additional Info: Update role and create role-specific entity
    async googleLoginAdditionalInfo(data) {
        try {
            const { userId, role, height, weight } = data;

            // Validate required fields
            if (!userId || !role) {
                return {
                    code: 400,
                    msg: 'User ID and role are required',
                };
            }

            // Check if user exists
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            // Check if user has already completed additional info (role is not google_unchosen)
            if (user.role !== 'google_unchosen') {
                return {
                    code: 400,
                    msg: 'User has already completed profile setup. Role cannot be changed through this endpoint.',
                };
            }

            // Validate role
            if (!['horseowner', 'jockey', 'referee', 'spectator', 'admin'].includes(role)) {
                return {
                    code: 400,
                    msg: 'Invalid role specified',
                };
            }

            // Check if role entity already exists to prevent duplicates
            let existingEntity = null;
            switch (role) {
                case 'horseowner':
                    existingEntity = await HorseOwnerRepository.findByOwnerId(userId);
                    break;
                case 'jockey':
                    existingEntity = await JockeyRepository.findByJockeyId(userId);
                    break;
                case 'referee':
                    existingEntity = await RefereeRepository.findByRefereeId(userId);
                    break;
                case 'spectator':
                    existingEntity = await SpectatorRepository.findBySpectatorId(userId);
                    break;
                case 'admin':
                    const AdminRepository = require('../repositories/AdminRepository');
                    existingEntity = await AdminRepository.findByAdminId(userId);
                    break;
            }

            if (existingEntity) {
                return {
                    code: 400,
                    msg: 'Role entity already exists for this user. Profile setup has already been completed.',
                };
            }

            // Update user role first
            await UserRepository.updateById(userId, { role });

            // Create role-specific entity
            let entityData = null;

            switch (role) {
                case 'horseowner':
                    entityData = await HorseOwnerRepository.create({
                        ownerId: userId,
                        license_link: null,
                    });
                    break;

                case 'jockey':
                    if (!height || !weight) {
                        return {
                            code: 400,
                            msg: 'Height and weight are required for jockey',
                        };
                    }
                    entityData = await JockeyRepository.create({
                        jockeyId: userId,
                        height,
                        weight,
                        ranking: null,
                        matchesRaced: 0,
                        totalWins: 0,
                        license_link: null,
                        status: 'active',
                    });
                    break;

                case 'referee':
                    entityData = await RefereeRepository.create({
                        refereeId: userId,
                        license_link: null,
                    });
                    break;

                case 'spectator':
                    entityData = await SpectatorRepository.create({
                        spectatorId: userId,
                        rewardPoints: 0,
                    });
                    break;

                case 'admin':
                    // Admin creation might need special permissions
                    const AdminRepository = require('../repositories/AdminRepository');
                    entityData = await AdminRepository.create({
                        adminId: userId,
                    });
                    break;

                default:
                    return {
                        code: 400,
                        msg: 'Invalid role',
                    };
            }

            // Get updated user
            const updatedUser = await UserRepository.findById(userId);

            return {
                code: 200,
                data: {
                    user: {
                        id: updatedUser._id,
                        username: updatedUser.username,
                        email: updatedUser.email,
                        fullName: updatedUser.fullName,
                        role: updatedUser.role,
                    },
                    roleEntity: entityData,
                },
                msg: `User role updated to ${role} and profile created successfully`,
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Register as HorseOwner
    async registerHorseOwner(userId, horseOwnerData) {
        try {
            const { address, licenseNumber } = horseOwnerData;

            // Validate required fields
            if (!address || !licenseNumber) {
                return {
                    code: 400,
                    msg: 'Address and license number are required',
                };
            }

            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            const horseOwner = await HorseOwnerRepository.create({
                ownerId: userId,
                address,
                licenseNumber,
            });

            // Update user role
            await UserRepository.updateById(userId, { role: 'horseowner' });

            return {
                code: 201,
                data: horseOwner,
                msg: 'Registered as horse owner successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Register as Jockey
    async registerJockey(userId, jockeyData) {
        try {
            const { height, weight, ranking = null } = jockeyData;

            // Validate required fields
            if (!height || !weight) {
                return {
                    code: 400,
                    msg: 'Height and weight are required',
                };
            }

            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            const jockey = await JockeyRepository.create({
                jockeyId: userId,
                height,
                weight,
                ranking,
                matchesRaced: 0,
                totalWins: 0,
                status: 'active',
            });

            // Update user role
            await UserRepository.updateById(userId, { role: 'jockey' });

            return {
                code: 201,
                data: jockey,
                msg: 'Registered as jockey successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Register as Spectator
    async registerSpectator(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            const spectator = await SpectatorRepository.create({
                spectatorId: userId,
                rewardPoints: 0,
            });

            // Update user role
            await UserRepository.updateById(userId, { role: 'spectator' });

            return {
                code: 201,
                data: spectator,
                msg: 'Registered as spectator successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Check if email exists
    async emailExists(email) {
        try {
            // Validate required field
            if (!email) {
                return {
                    code: 400,
                    msg: 'Email is required',
                };
            }

            const user = await UserRepository.findByEmail(email);
            return {
                code: 200,
                data: {
                    email,
                    exists: !!user,
                },
                msg: user ? 'Email already exists' : 'Email is available',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Check if username exists
    async usernameExists(username) {
        try {
            // Validate required field
            if (!username) {
                return {
                    code: 400,
                    msg: 'Username is required',
                };
            }

            const user = await UserRepository.findByUsername(username);
            return {
                code: 200,
                data: {
                    username,
                    exists: !!user,
                },
                msg: user ? 'Username already taken' : 'Username is available',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Verify token
    async verifyToken(token) {
        try {
            const decoded = TokenUtil.verifyToken(token);
            if (!decoded) {
                return {
                    code: 401,
                    msg: 'Invalid token',
                };
            }

            const user = await UserRepository.findById(decoded.userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            return {
                code: 200,
                data: user,
                msg: 'Token verified',
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
}

module.exports = new AuthService();
