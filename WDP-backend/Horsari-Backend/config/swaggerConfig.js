const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Horsari Backend API',
            version: '1.0.0',
            description: 'Horse racing application backend API with role-based authentication',
            contact: {
                name: 'Horsari Support',
                email: 'support@horsari.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'https://api.horsari.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT access token (valid 1 hour) in Authorization header',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        fullName: { type: 'string' },
                        phoneNumber: { type: 'string' },
                        dateOfBirth: { type: 'string', format: 'date' },
                        role: { type: 'string', enum: ['horseowner', 'jockey', 'referee', 'spectator', 'admin'] },
                        status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Horse: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        ownerId: { type: 'string' },
                        horseName: { type: 'string' },
                        breed: { type: 'string' },
                        age: { type: 'number' },
                        gender: { type: 'string', enum: ['male', 'female'] },
                        color: { type: 'string' },
                        healthStatus: { type: 'string', enum: ['healthy', 'injured', 'sick'] },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        registrationDate: { type: 'string', format: 'date' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                HorseOwner: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        address: { type: 'string' },
                        licenseNumber: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Jockey: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        height: { type: 'string' },
                        weight: { type: 'string' },
                        matchesRaced: { type: 'number' },
                        totalWins: { type: 'number' },
                        ranking: { type: 'number' },
                        status: { type: 'string', enum: ['active', 'inactive', 'retired'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Referee: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        certificationNumber: { type: 'string' },
                        licenseNumber: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Spectator: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        rewardPoints: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Admin: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        // adminLevel removed
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        code: { type: 'number' },
                        msg: { type: 'string' },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        code: { type: 'number' },
                        data: { type: 'object' },
                        msg: { type: 'string' },
                    },
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: [
        './swagger/*.js',
    ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
