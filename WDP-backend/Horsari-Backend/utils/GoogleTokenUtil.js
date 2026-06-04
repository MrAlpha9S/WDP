const https = require('https');

class GoogleTokenUtil {
    // Verify Google ID token using Google's tokeninfo endpoint.
    // Returns parsed token info on success, or null on failure.
    async verifyIdToken(idToken) {
        if (!idToken) return null;

        return await new Promise((resolve) => {
            const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
            https
                .get(url, (res) => {
                    let raw = '';
                    res.on('data', (chunk) => (raw += chunk));
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(raw);
                            if (res.statusCode !== 200) {
                                return resolve(null);
                            }
                            resolve(parsed);
                        } catch (e) {
                            return resolve(null);
                        }
                    });
                })
                .on('error', () => resolve(null));
        });
    }
}

module.exports = new GoogleTokenUtil();
