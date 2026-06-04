const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const User = require('../entities/User');
const HorseOwner = require('../entities/HorseOwner');
const Horse = require('../entities/Horse');
const Admin = require('../entities/Admin');
const Referee = require('../entities/Referee');
const Spectator = require('../entities/Spectator');
const Jockey = require('../entities/Jockey');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Tournament = require('../entities/Tournament');

const PASSWORD_HASH = '$2a$12$OXXNUWkz5KBayO.Ei9qMJeiTG.GGqixAHg5eb1ldREdsQApndrYKm';
//Mongodb@1234
const mockData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await mongoose.connection.db.dropDatabase();
        console.log('Cleared existing data');

        // Create 3 Horse Owners
        const horseOwners = [];
        const horseOwnerUsers = [];
        for (let i = 1; i <= 3; i++) {
            const user = await User.create({
                username: `horseowner${i}`,
                email: `horseowner${i}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: `Horse Owner ${i}`,
                dateOfBirth: new Date('1985-01-15'),
                phoneNumber: `555000${i}`,
                role: 'horseowner',
                status: 'active',
            });
            horseOwnerUsers.push(user);

            const owner = await HorseOwner.create({
                _id: user._id,
                address: `${i}00 Farm Lane, Horse City, HC 12345`,
                licenseNumber: `HO-LIC-${1000 + i}`,
                certificationFilePath: '',
            });
            horseOwners.push(owner);
        }
        console.log('✅ Created 3 horse owners');

        // Create 2 horses for each horse owner
        const horsesCreated = [];
        for (const owner of horseOwners) {
            for (let j = 1; j <= 2; j++) {
                const horse = await Horse.create({
                    ownerId: owner._id,
                    horseName: `Horse ${owner._id.toString().slice(-3)}-${j}`,
                    breed: ['Thoroughbred', 'Arabian', 'Quarter Horse', 'Standardbred'][Math.floor(Math.random() * 4)],
                    age: Math.floor(Math.random() * 15) + 2,
                    gender: j % 2 === 0 ? 'male' : 'female',
                    color: ['Bay', 'Black', 'Chestnut', 'Gray', 'Palomino'][Math.floor(Math.random() * 5)],
                    healthStatus: 'healthy',
                    status: 'active',
                    registrationDate: new Date(),
                });
                horsesCreated.push(horse);
            }
        }
        console.log(`✅ Created ${horsesCreated.length} horses (2 per owner)`);

        // Create 3 Admins
        const adminUsers = [];
        for (let i = 1; i <= 3; i++) {
            const user = await User.create({
                username: `admin${i}`,
                email: `admin${i}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: `Admin User ${i}`,
                dateOfBirth: new Date('1980-05-20'),
                phoneNumber: `555100${i}`,
                role: 'admin',
                status: 'active',
            });
            adminUsers.push(user);

            await Admin.create({
                _id: user._id,
            });
        }
        console.log('✅ Created 3 admins');

        // Create 3 Referees
        const refereeUsers = [];
        for (let i = 1; i <= 3; i++) {
            const user = await User.create({
                username: `referee${i}`,
                email: `referee${i}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: `Referee ${i}`,
                dateOfBirth: new Date('1990-03-10'),
                phoneNumber: `555200${i}`,
                role: 'referee',
                status: 'active',
            });
            refereeUsers.push(user);

            await Referee.create({
                _id: user._id,
                certificationNumber: `CERT-REF-${2000 + i}`,
                licenseNumber: `REF-LIC-${2000 + i}`,
            });
        }
        console.log('✅ Created 3 referees');

        // Create 3 Spectators
        const spectatorUsers = [];
        for (let i = 1; i <= 3; i++) {
            const user = await User.create({
                username: `spectator${i}`,
                email: `spectator${i}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: `Spectator ${i}`,
                dateOfBirth: new Date('1995-07-22'),
                phoneNumber: `555300${i}`,
                role: 'spectator',
                status: 'active',
            });
            spectatorUsers.push(user);

            await Spectator.create({
                _id: user._id,
                rewardPoints: Math.floor(Math.random() * 1000) + 100,
            });
        }
        console.log('✅ Created 3 spectators');

        // Create 3 Jockeys
        const jockeyUsers = [];
        for (let i = 1; i <= 3; i++) {
            const user = await User.create({
                username: `jockey${i}`,
                email: `jockey${i}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: `Jockey ${i}`,
                dateOfBirth: new Date('2000-11-08'),
                phoneNumber: `555400${i}`,
                role: 'jockey',
                status: 'active',
            });
            jockeyUsers.push(user);

            await Jockey.create({
                _id: user._id,
                height: 170 + Math.floor(Math.random() * 10),
                weight: 50 + Math.floor(Math.random() * 15),
                matchesRaced: Math.floor(Math.random() * 50) + 5,
                totalWins: Math.floor(Math.random() * 20) + 1,
                ranking: Math.floor(Math.random() * 100) + 1,
                status: 'active',
            });
        }
        console.log('✅ Created 3 jockeys');

        // Create 2 Race Eligibility Rules
        await RaceEligibilityRule.create({
            race_type: 'Claiming',
            license_required: true,
            isActive: true,
        });

        await RaceEligibilityRule.create({
            race_type: 'Maiden',
            min_races_won: 0,
            license_required: true,
            isActive: true,
        });
        console.log('✅ Created 2 Race Eligibility Rules');

        // Create Non-tournament
        await Tournament.create({
            tournament_name: 'Non-tournament',
            description: 'Standalone races that are not part of any tournament',
            start_date: null,
            end_date: null,
            location: 'Various',
            status: 'ongoing',
        });
        console.log('✅ Created Non-tournament');

        console.log('\n✅ Mock data generation completed!');
        console.log('====================================');
        console.log('Summary:');
        console.log('- 3 Horse Owners (with 2 horses each = 6 horses)');
        console.log('- 3 Admins');
        console.log('- 3 Referees');
        console.log('- 3 Spectators');
        console.log('- 3 Jockeys');
        console.log('- 2 Race Eligibility Rules');
        console.log('- 1 Tournament (Non-tournament)');
        console.log('====================================');
        console.log('Password for all users: $2a$12$vqdvnyFFBmhSkDSX/2Eu1eNVHviElpS6X23QbvA5rjoRliEb8zZw.');
        console.log('\nLogin examples:');
        console.log('- horseowner1 / horseowner1@horsari.com');
        console.log('- admin1 / admin1@horsari.com');
        console.log('- jockey1 / jockey1@horsari.com');
        console.log('- referee1 / referee1@horsari.com');
        console.log('- spectator1 / spectator1@horsari.com');

        process.exit(0);
    } catch (error) {
        console.error('Error generating mock data:', error);
        process.exit(1);
    }
};

mockData();
