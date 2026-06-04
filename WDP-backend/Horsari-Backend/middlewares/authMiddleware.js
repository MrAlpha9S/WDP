const TokenUtil = require('../utils/TokenUtil');
const GoogleTokenUtil = require('../utils/GoogleTokenUtil');
const UserRepository = require('../repositories/UserRepository');

// Authentication middleware
// Accepts either internal JWTs (signed with server secret) or Google ID tokens (JWT)
const authMiddleware = async (req, res, next) => {
    try {
        const headerToken = req.headers.authorization?.split(' ')[1];
        const cookieToken = req.cookies?.Authorization?.split(' ')[1];
        const token = headerToken || cookieToken;

        if (!token) {
            return res.status(401).json({ code: 401, msg: 'No token provided' });
        }

        // Try server-issued JWT first
        const decoded = TokenUtil.verifyToken(token);
        if (decoded && decoded.userId) {
            const user = await UserRepository.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({ code: 401, msg: 'User not found' });
            }

            if (user.status !== 'active') {
                return res.status(403).json({ code: 403, msg: 'User account is not active' });
            }

            req.user = user;
            req.userId = decoded.userId;
            console.log(req.user);
            return next();
        }

        // Fall back to Google ID token verification (accept Google credentials as JWT)
        const googleInfo = await GoogleTokenUtil.verifyIdToken(token);
        if (!googleInfo || !googleInfo.email) {
            return res.status(401).json({ code: 401, msg: 'Invalid token' });
        }

        const email = googleInfo.email;
        const googleId = googleInfo.sub;
        const fullName = googleInfo.name || `${googleInfo.given_name || ''} ${googleInfo.family_name || ''}`.trim();
        const picture = googleInfo.picture || null;

        let user = await UserRepository.findByEmail(email);
        if (!user) {
            // create user on-the-fly to allow using Google idToken as credentials
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
                image: picture,
                role: 'spectator',
                status: 'active',
            });
        } else {
            // Link googleId if missing
            if (!user.googleId && googleId) {
                await UserRepository.updateById(user._id, { googleId });
            }

            if (user.status !== 'active') {
                return res.status(403).json({ code: 403, msg: 'User account is not active' });
            }
        }

        req.user = user;
        req.userId = user._id;
        return next();
    } catch (error) {
        return res.status(401).json({ code: 401, msg: 'Unauthorized' });
    }
};

// Role-based middleware - Generic
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ code: 401, msg: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ code: 403, msg: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

// Role-specific middleware
const authHorseOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ code: 401, msg: 'Unauthorized' });
    }

    if (req.user.role !== 'horseowner') {
        return res.status(403).json({ code: 403, msg: 'Forbidden: Only horse owners can access this' });
    }

    next();
};

const authJockey = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ code: 401, msg: 'Unauthorized' });
    }

    if (req.user.role !== 'jockey') {
        return res.status(403).json({ code: 403, msg: 'Forbidden: Only jockeys can access this' });
    }

    next();
};

const authReferee = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ code: 401, msg: 'Unauthorized' });
    }

    if (req.user.role !== 'referee') {
        return res.status(403).json({ code: 403, msg: 'Forbidden: Only referees can access this' });
    }

    next();
};

const authSpectator = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ code: 401, msg: 'Unauthorized' });
    }

    if (req.user.role !== 'spectator') {
        return res.status(403).json({ code: 403, msg: 'Forbidden: Only spectators can access this' });
    }

    next();
};

const authAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ code: 401, msg: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ code: 403, msg: 'Forbidden: Only admins can access this' });
    }

    next();
};

module.exports = {
    authMiddleware,
    authorize,
    authHorseOwner,
    authJockey,
    authReferee,
    authSpectator,
    authAdmin,
};
