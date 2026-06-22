const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../entities/User');
const HorseOwner = require('../entities/HorseOwner');
const Horse = require('../entities/Horse');
const Admin = require('../entities/Admin');
const Referee = require('../entities/Referee');
const Spectator = require('../entities/Spectator');
const Jockey = require('../entities/Jockey');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Tournament = require('../entities/Tournament');
const RaceRound = require('../entities/RaceRound');
const Registration = require('../entities/Registration');
const RaceReferee = require('../entities/RaceReferee');
const Invitation = require('../entities/Invitation');
const ViolationType = require('../entities/ViolationType');
const Violation = require('../entities/Violation');
const RaceResult = require('../entities/RaceResult');

// Mongodb@1234
const PASSWORD_HASH = '$2a$12$OXXNUWkz5KBayO.Ei9qMJeiTG.GGqixAHg5eb1ldREdsQApndrYKm';

const mockData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await mongoose.connection.db.dropDatabase();
        console.log('Cleared existing data');

        // ── Horse Owners ──────────────────────────────────────────────────────
        const ownerNames = ['Alice Chen', 'Bruno Hartmann', 'Celine Dupont'];
        const horseOwners = [];
        const horseOwnerUsers = [];
        for (let i = 0; i < 3; i++) {
            const user = await User.create({
                username: `horseowner${i + 1}`,
                email: `horseowner${i + 1}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: ownerNames[i],
                dateOfBirth: new Date('1985-01-15'),
                phoneNumber: `555000${i + 1}`,
                role: 'horseowner',
                status: 'active',
            });
            horseOwnerUsers.push(user);
            const owner = await HorseOwner.create({
                _id: user._id,
                address: `${(i + 1) * 100} Stable Lane, Horseville HC 1000${i + 1}`,
                licenseLink: 'https://drive.google.com/file/d/1FzBxahtdGCsKcZQf21-A4JOzC26IE2hd/view?usp=sharing',
                licenseStatus: 'approved',
            });
            horseOwners.push(owner);
        }
        console.log('✅ Created 3 horse owners');

        // ── Horse Owners (pending / unverified) ───────────────────────────────
        const pendingOwnerNames = ['Diana Moreau', 'Ethan Brooks'];
        for (let i = 0; i < 2; i++) {
            const user = await User.create({
                username: `horseowner${i + 4}`,
                email: `horseowner${i + 4}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: pendingOwnerNames[i],
                dateOfBirth: new Date('1988-04-20'),
                phoneNumber: `555000${i + 4}`,
                role: 'horseowner',
                status: 'active',
            });
            await HorseOwner.create({
                _id: user._id,
                address: `${(i + 4) * 100} Paddock Road, Horseville HC 2000${i + 1}`,
                licenseLink: 'https://drive.google.com/file/d/1FzBxahtdGCsKcZQf21-A4JOzC26IE2hd/view?usp=sharing',
                licenseStatus: 'pending',
            });
        }
        console.log('✅ Created 2 pending horse owners');

        // ── Admins ────────────────────────────────────────────────────────────
        const adminUsers = [];
        for (let i = 0; i < 3; i++) {
            const user = await User.create({
                username: `admin${i + 1}`,
                email: `admin${i + 1}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: `Admin User ${i + 1}`,
                dateOfBirth: new Date('1980-05-20'),
                phoneNumber: `555100${i + 1}`,
                role: 'admin',
                status: 'active',
            });
            adminUsers.push(user);
            await Admin.create({ _id: user._id });
        }
        console.log('✅ Created 3 admins');

        // ── Referees ──────────────────────────────────────────────────────────
        const refereeNames = ['David Park', 'Elena Vasquez', 'Frank Müller'];
        const refereeUsers = [];
        for (let i = 0; i < 3; i++) {
            const user = await User.create({
                username: `referee${i + 1}`,
                email: `referee${i + 1}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: refereeNames[i],
                dateOfBirth: new Date('1990-03-10'),
                phoneNumber: `555200${i + 1}`,
                role: 'referee',
                status: 'active',
            });
            refereeUsers.push(user);
            await Referee.create({
                _id: user._id,
                licenseLink: 'https://drive.google.com/file/d/1FzBxahtdGCsKcZQf21-A4JOzC26IE2hd/view?usp=sharing',
                licenseStatus: 'approved',
            });
        }
        console.log('✅ Created 3 referees');

        // ── Referees (pending / unverified) ───────────────────────────────────
        const pendingRefereeNames = ['Grace Kim', 'Henry Walsh'];
        for (let i = 0; i < 2; i++) {
            const user = await User.create({
                username: `referee${i + 4}`,
                email: `referee${i + 4}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: pendingRefereeNames[i],
                dateOfBirth: new Date('1992-09-05'),
                phoneNumber: `555200${i + 4}`,
                role: 'referee',
                status: 'active',
            });
            await Referee.create({
                _id: user._id,
                licenseLink: 'https://drive.google.com/file/d/1FzBxahtdGCsKcZQf21-A4JOzC26IE2hd/view?usp=sharing',
                licenseStatus: 'pending',
            });
        }
        console.log('✅ Created 2 pending referees');

        // ── Jockeys ───────────────────────────────────────────────────────────
        const jockeyNames = ['Marco Rossi', 'Luca Moretti', 'Yuki Tanaka'];
        const jockeyUsers = [];
        for (let i = 0; i < 3; i++) {
            const user = await User.create({
                username: `jockey${i + 1}`,
                email: `jockey${i + 1}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: jockeyNames[i],
                dateOfBirth: new Date('2000-11-08'),
                phoneNumber: `555400${i + 1}`,
                role: 'jockey',
                status: 'active',
            });
            jockeyUsers.push(user);
            await Jockey.create({
                _id: user._id,
                height: 166 + i * 2,
                weight: 52 + i * 3,
                matchesRaced: 20 + i * 10,
                totalWins: 5 + i * 3,
                ranking: 10 + i * 5,
                licenseLink: 'https://drive.google.com/file/d/1FzBxahtdGCsKcZQf21-A4JOzC26IE2hd/view?usp=sharing',
                licenseStatus: 'approved',
                status: 'active',
            });
        }
        console.log('✅ Created 3 jockeys');

        // ── Jockeys (pending / unverified) ────────────────────────────────────
        const pendingJockeyNames = ['Sofia Reyes', 'Kai Nakamura'];
        for (let i = 0; i < 2; i++) {
            const user = await User.create({
                username: `jockey${i + 4}`,
                email: `jockey${i + 4}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: pendingJockeyNames[i],
                dateOfBirth: new Date('2002-06-14'),
                phoneNumber: `555400${i + 4}`,
                role: 'jockey',
                status: 'active',
            });
            await Jockey.create({
                _id: user._id,
                height: 162 + i * 2,
                weight: 50 + i * 2,
                matchesRaced: 0,
                totalWins: 0,
                licenseLink: 'https://drive.google.com/file/d/1FzBxahtdGCsKcZQf21-A4JOzC26IE2hd/view?usp=sharing',
                licenseStatus: 'pending',
                status: 'active',
            });
        }
        console.log('✅ Created 2 pending jockeys');

        // ── Spectators ────────────────────────────────────────────────────────
        for (let i = 0; i < 3; i++) {
            const user = await User.create({
                username: `spectator${i + 1}`,
                email: `spectator${i + 1}@horsari.com`,
                passwordHash: PASSWORD_HASH,
                fullName: `Spectator ${i + 1}`,
                dateOfBirth: new Date('1995-07-22'),
                phoneNumber: `555300${i + 1}`,
                role: 'spectator',
                status: 'active',
            });
            await Spectator.create({ _id: user._id, rewardPoints: 100 + i * 200 });
        }
        console.log('✅ Created 3 spectators');

        // ── Horses (2 per owner) ──────────────────────────────────────────────
        //   [0] Thunderbolt  — owner1   [1] Silver Comet  — owner1
        //   [2] Desert Wind  — owner2   [3] Midnight Star — owner2
        //   [4] Golden Flash — owner3   [5] Iron Duchess  — owner3
        const horseData = [
            { name: 'Thunderbolt',   breed: 'Thoroughbred',  gender: 'male',   age: 4 },
            { name: 'Silver Comet',  breed: 'Arabian',       gender: 'female', age: 5 },
            { name: 'Desert Wind',   breed: 'Quarter Horse', gender: 'male',   age: 3 },
            { name: 'Midnight Star', breed: 'Thoroughbred',  gender: 'female', age: 6 },
            { name: 'Golden Flash',  breed: 'Standardbred',  gender: 'male',   age: 4 },
            { name: 'Iron Duchess',  breed: 'Arabian',       gender: 'female', age: 5 },
        ];
        const horses = [];
        for (let i = 0; i < horseData.length; i++) {
            const d = horseData[i];
            const horse = await Horse.create({
                ownerId: horseOwners[Math.floor(i / 2)]._id,
                horseName: d.name,
                breed: d.breed,
                gender: d.gender,
                dateOfBirth: new Date(new Date().getFullYear() - d.age, 0, 1),
                healthStatus: 'healthy',
                status: 'active',
                registrationDate: new Date(),
            });
            horses.push(horse);
        }
        console.log('✅ Created 6 horses');

        // ── Race Eligibility Rules ─────────────────────────────────────────────
        const maidenRule = await RaceEligibilityRule.create({
            raceType: 'Maiden',
            minAge: 2,
            licenseRequired: true,
            isActive: true,
        });
        const claimingRule = await RaceEligibilityRule.create({
            raceType: 'Claiming',
            licenseRequired: true,
            isActive: true,
        });
        console.log('✅ Created 2 eligibility rules');

        // ── Tournaments ───────────────────────────────────────────────────────
        const nonTournament = await Tournament.create({
            createdByAdminId: adminUsers[0]._id,
            tournamentName: 'Non-tournament',
            description: 'Standalone races not part of any tournament',
            startDate: null,
            endDate: null,
            status: 'ongoing',
        });

        const springTournament = await Tournament.create({
            createdByAdminId: adminUsers[0]._id,
            tournamentName: 'Spring Classic 2026',
            description: 'Premier flat race championship — Grade II & III runners',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-06-30'),
            status: 'ongoing',
        });
        console.log('✅ Created 2 tournaments');

        // ══════════════════════════════════════════════════════════════════════
        // ROUND 1 — Morning Sprint                          [STATUS: prepared]
        // All registrations settled. Admin can now start or cancel the race.
        //   • owner1 (Alice)  → verified   (Thunderbolt / Marco Rossi ✓)
        //   • owner2 (Bruno)  → verified   (Desert Wind / Luca Moretti ✓)
        //   • owner3 (Celine) → failed     (Golden Flash — soundness issue)
        // ══════════════════════════════════════════════════════════════════════
        const round1 = await RaceRound.create({
            tournamentId: springTournament._id,
            createdByAdminId: adminUsers[0]._id,
            roundName: 'Morning Sprint',
            raceDate: new Date('2026-06-25T09:00:00Z'),
            trackLength: 1200,
            maxParticipants: 8,
            status: 'prepared',
            minimalRidingFees: 500,
            raceGround: 'Turf',
            requireEntranceFees: true,
            firstPlacePrize: 50000,
            secondPlacePrize: 20000,
            thirdPlacePrize: 10000,
            currencyType: 'USD',
            location: 'Horsari Racecourse',
            address: '1 Race Blvd, Horseville HC 10001',
            eligibilityRuleId: maidenRule._id,
        });

        // referee1 (David Park) accepts the assignment
        const raceRef1 = await RaceReferee.create({
            raceRoundId: round1._id,
            refereeId: refereeUsers[0]._id,
            assignedByAdminId: adminUsers[0]._id,
            status: 'assigned',
            fee: 1500,
            paymentStatus: 'unpaid',
        });

        // owner1 → verified (Thunderbolt / Marco Rossi — main; Luca Moretti — backup confirmed)
        const reg1a = await Registration.create({
            raceRoundId: round1._id,
            horseOwnerId: horseOwners[0]._id,
            approvedByAdminId: adminUsers[0]._id,
            registrationStatus: 'verified',
            registeredAt: new Date('2026-06-10T09:00:00Z'),
        });
        const inv1a_main = await Invitation.create({
            horseId: horses[0]._id,
            jockeyId: jockeyUsers[0]._id,
            registrationId: reg1a._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });
        await Invitation.create({
            horseId: horses[0]._id,
            jockeyId: jockeyUsers[1]._id,
            registrationId: reg1a._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: true,
            percentagePayout: 8,
        });
        await Registration.findByIdAndUpdate(reg1a._id, { jockeyInRaceId: inv1a_main._id });

        // owner2 → verified (Desert Wind / Luca Moretti)
        const reg1b = await Registration.create({
            raceRoundId: round1._id,
            horseOwnerId: horseOwners[1]._id,
            approvedByAdminId: adminUsers[0]._id,
            registrationStatus: 'verified',
            registeredAt: new Date('2026-06-10T10:00:00Z'),
        });
        const inv1b_main = await Invitation.create({
            horseId: horses[2]._id,
            jockeyId: jockeyUsers[1]._id,
            registrationId: reg1b._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 12,
        });
        await Registration.findByIdAndUpdate(reg1b._id, { jockeyInRaceId: inv1b_main._id });

        // owner3 → failed (Golden Flash — soundness issue)
        const reg1c = await Registration.create({
            raceRoundId: round1._id,
            horseOwnerId: horseOwners[2]._id,
            approvedByAdminId: adminUsers[0]._id,
            registrationStatus: 'failed',
            verificationFailReason: 'Horse failed pre-race soundness check — elevated heart rate and lameness detected in left foreleg',
            registeredAt: new Date('2026-06-10T11:00:00Z'),
        });
        await Invitation.create({
            horseId: horses[4]._id,
            jockeyId: jockeyUsers[2]._id,
            registrationId: reg1c._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });

        console.log('✅ Round 1 (prepared) — Morning Sprint');

        // ══════════════════════════════════════════════════════════════════════
        // ROUND 2 — Evening Classic                        [STATUS: scheduled]
        // Referee assigned and accepted. Pre-race inspection in progress.
        //   • owner1 (Alice)  → approved   (Silver Comet / Yuki Tanaka ✓)
        //   • owner2 (Bruno)  → approved   (Midnight Star / Marco Rossi — jockey NOT confirmed yet)
        //   • owner3 (Celine) → pending    (no horse or jockey assigned yet)
        // ══════════════════════════════════════════════════════════════════════
        const round2 = await RaceRound.create({
            tournamentId: springTournament._id,
            createdByAdminId: adminUsers[0]._id,
            roundName: 'Evening Classic',
            raceDate: new Date('2026-06-25T17:00:00Z'),
            trackLength: 1600,
            maxParticipants: 10,
            status: 'scheduled',
            minimalRidingFees: 800,
            raceGround: 'Dirt',
            requireEntranceFees: false,
            firstPlacePrize: 100000,
            secondPlacePrize: 40000,
            thirdPlacePrize: 20000,
            currencyType: 'USD',
            location: 'Horsari Racecourse',
            address: '1 Race Blvd, Horseville HC 10001',
            eligibilityRuleId: claimingRule._id,
        });

        // referee1 (David Park) also assigned to round2
        await RaceReferee.create({
            raceRoundId: round2._id,
            refereeId: refereeUsers[0]._id,
            assignedByAdminId: adminUsers[0]._id,
            status: 'assigned',
            fee: 2000,
            paymentStatus: 'unpaid',
        });

        // owner1 → approved (Silver Comet / Yuki Tanaka — main confirmed; Marco Rossi — backup pending)
        const reg2a = await Registration.create({
            raceRoundId: round2._id,
            horseOwnerId: horseOwners[0]._id,
            approvedByAdminId: adminUsers[0]._id,
            registrationStatus: 'approved',
            registeredAt: new Date('2026-06-12T09:00:00Z'),
        });
        await Invitation.create({
            horseId: horses[1]._id,
            jockeyId: jockeyUsers[2]._id,
            registrationId: reg2a._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 15,
        });
        await Invitation.create({
            horseId: horses[1]._id,
            jockeyId: jockeyUsers[0]._id,
            registrationId: reg2a._id,
            ownerConfirmation: true,
            jockeyConfirmation: false,
            invitationStatus: 'pending',
            isBackup: true,
            percentagePayout: 10,
        });

        // owner2 → approved (Midnight Star / Marco Rossi — jockey pending confirmation)
        const reg2b = await Registration.create({
            raceRoundId: round2._id,
            horseOwnerId: horseOwners[1]._id,
            approvedByAdminId: adminUsers[0]._id,
            registrationStatus: 'approved',
            registeredAt: new Date('2026-06-12T10:00:00Z'),
        });
        await Invitation.create({
            horseId: horses[3]._id,
            jockeyId: jockeyUsers[0]._id,
            registrationId: reg2b._id,
            ownerConfirmation: true,
            jockeyConfirmation: false,
            invitationStatus: 'pending',
            isBackup: false,
            percentagePayout: 10,
        });

        // owner3 → pending (owner has not responded, no horse or jockey yet)
        await Registration.create({
            raceRoundId: round2._id,
            horseOwnerId: horseOwners[2]._id,
            registrationStatus: 'pending',
            registeredAt: new Date('2026-06-13T08:00:00Z'),
        });

        console.log('✅ Round 2 (scheduled) — Evening Classic');

        // ══════════════════════════════════════════════════════════════════════
        // ROUND 3 — Standalone Night Race       [STATUS: running] (non-tournament)
        // Admin has started the race. Live monitoring active.
        //   • owner1 (Alice) → verified  (Thunderbolt / Luca Moretti ✓)
        //   • owner2 (Bruno) → verified  (Desert Wind / Yuki Tanaka ✓)
        // ══════════════════════════════════════════════════════════════════════
        const round3 = await RaceRound.create({
            tournamentId: nonTournament._id,
            createdByAdminId: adminUsers[1]._id,
            roundName: 'Standalone Night Race',
            raceDate: new Date('2026-06-20T16:00:00Z'),
            trackLength: 1000,
            maxParticipants: 6,
            status: 'running',
            minimalRidingFees: 300,
            raceGround: 'Synthetic',
            requireEntranceFees: false,
            firstPlacePrize: 25000,
            secondPlacePrize: 10000,
            thirdPlacePrize: 5000,
            currencyType: 'USD',
            location: 'City Downs Arena',
            address: '99 Night Track Rd, Horseville HC 20002',
            eligibilityRuleId: maidenRule._id,
        });

        // referee2 (Elena Vasquez) assigned and accepted
        await RaceReferee.create({
            raceRoundId: round3._id,
            refereeId: refereeUsers[1]._id,
            assignedByAdminId: adminUsers[1]._id,
            status: 'assigned',
            fee: 1000,
            paymentStatus: 'paid',
        });

        // owner1 → verified (Thunderbolt / Luca Moretti)
        const reg3a = await Registration.create({
            raceRoundId: round3._id,
            horseOwnerId: horseOwners[0]._id,
            approvedByAdminId: adminUsers[1]._id,
            registrationStatus: 'verified',
            registeredAt: new Date('2026-06-15T09:00:00Z'),
        });
        const inv3a_main = await Invitation.create({
            horseId: horses[0]._id,
            jockeyId: jockeyUsers[1]._id,
            registrationId: reg3a._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });
        await Registration.findByIdAndUpdate(reg3a._id, { jockeyInRaceId: inv3a_main._id });

        // owner2 → verified (Desert Wind / Yuki Tanaka)
        const reg3b = await Registration.create({
            raceRoundId: round3._id,
            horseOwnerId: horseOwners[1]._id,
            approvedByAdminId: adminUsers[1]._id,
            registrationStatus: 'verified',
            registeredAt: new Date('2026-06-15T10:00:00Z'),
        });
        const inv3b_main = await Invitation.create({
            horseId: horses[2]._id,
            jockeyId: jockeyUsers[2]._id,
            registrationId: reg3b._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 12,
        });
        await Registration.findByIdAndUpdate(reg3b._id, { jockeyInRaceId: inv3b_main._id });

        console.log('✅ Round 3 (running) — Standalone Night Race');

        // ══════════════════════════════════════════════════════════════════════
        // ROUND 4 — Grand Cup Final              [STATUS: completed]
        // All results published. Marco 1st on Thunderbolt, Luca 2nd on Iron Duchess,
        // Yuki 3rd on Desert Wind. Careless Riding violation on Luca in-race.
        //   • owner1 (Alice)  → verified  (Thunderbolt  / Marco Rossi   ✓)
        //   • owner3 (Celine) → verified  (Iron Duchess / Luca Moretti  ✓)
        //   • owner2 (Bruno)  → verified  (Desert Wind  / Yuki Tanaka   ✓)
        // ══════════════════════════════════════════════════════════════════════
        const round4 = await RaceRound.create({
            tournamentId: springTournament._id,
            createdByAdminId: adminUsers[0]._id,
            roundName: 'Grand Cup Final',
            raceDate: new Date('2026-06-18T14:00:00Z'),
            trackLength: 2000,
            maxParticipants: 8,
            status: 'completed',
            minimalRidingFees: 1000,
            raceGround: 'Turf',
            requireEntranceFees: true,
            firstPlacePrize: 80000,
            secondPlacePrize: 35000,
            thirdPlacePrize: 15000,
            currencyType: 'USD',
            location: 'Horsari Racecourse',
            address: '1 Race Blvd, Horseville HC 10001',
            eligibilityRuleId: claimingRule._id,
        });

        const raceRef4 = await RaceReferee.create({
            raceRoundId: round4._id,
            refereeId: refereeUsers[2]._id,
            assignedByAdminId: adminUsers[0]._id,
            status: 'assigned',
            fee: 2500,
            paymentStatus: 'paid',
        });

        // owner1 → Thunderbolt / Marco Rossi — 1st place
        const reg4a = await Registration.create({
            raceRoundId: round4._id,
            horseOwnerId: horseOwners[0]._id,
            approvedByAdminId: adminUsers[0]._id,
            registrationStatus: 'verified',
            registeredAt: new Date('2026-06-05T09:00:00Z'),
        });
        const inv4a = await Invitation.create({
            horseId: horses[0]._id,   // Thunderbolt
            jockeyId: jockeyUsers[0]._id,  // Marco Rossi
            registrationId: reg4a._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });
        await Registration.findByIdAndUpdate(reg4a._id, { jockeyInRaceId: inv4a._id });
        await RaceResult.create({
            raceRoundId: round4._id,
            registrationId: reg4a._id,
            publishedByAdminId: adminUsers[0]._id,
            finishPosition: 1,
            finishTime: '2:01.34',
            prizeMoney: 80000,
            resultStatus: 'official',
        });

        // owner3 → Iron Duchess / Luca Moretti — 2nd place
        const reg4b = await Registration.create({
            raceRoundId: round4._id,
            horseOwnerId: horseOwners[2]._id,
            approvedByAdminId: adminUsers[0]._id,
            registrationStatus: 'verified',
            registeredAt: new Date('2026-06-05T10:00:00Z'),
        });
        const inv4b = await Invitation.create({
            horseId: horses[5]._id,   // Iron Duchess
            jockeyId: jockeyUsers[1]._id,  // Luca Moretti
            registrationId: reg4b._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 12,
        });
        await Registration.findByIdAndUpdate(reg4b._id, { jockeyInRaceId: inv4b._id });
        await RaceResult.create({
            raceRoundId: round4._id,
            registrationId: reg4b._id,
            publishedByAdminId: adminUsers[0]._id,
            finishPosition: 2,
            finishTime: '2:02.11',
            prizeMoney: 35000,
            resultStatus: 'official',
        });

        // owner2 → Desert Wind / Yuki Tanaka — 3rd place
        const reg4c = await Registration.create({
            raceRoundId: round4._id,
            horseOwnerId: horseOwners[1]._id,
            approvedByAdminId: adminUsers[0]._id,
            registrationStatus: 'verified',
            registeredAt: new Date('2026-06-05T11:00:00Z'),
        });
        const inv4c = await Invitation.create({
            horseId: horses[2]._id,   // Desert Wind
            jockeyId: jockeyUsers[2]._id,  // Yuki Tanaka
            registrationId: reg4c._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });
        await Registration.findByIdAndUpdate(reg4c._id, { jockeyInRaceId: inv4c._id });
        await RaceResult.create({
            raceRoundId: round4._id,
            registrationId: reg4c._id,
            publishedByAdminId: adminUsers[0]._id,
            finishPosition: 3,
            finishTime: '2:03.88',
            prizeMoney: 15000,
            resultStatus: 'official',
        });

        console.log('✅ Round 4 (completed) — Grand Cup Final');

        // ══════════════════════════════════════════════════════════════════════
        // VIOLATION TYPES  (from SRS violation catalogue)
        // ══════════════════════════════════════════════════════════════════════
        const vtDefs = [
            // ── pre-race — horse safety ───────────────────────────────────────
            { violationName: 'Unfit Horse',              violationDescription: 'Horse is unsafe or unhealthy to race.',                              type: 'pre-race',    category: 'horse-safety',   severity: 3, defaultPenalty: 'Horse scratched' },
            { violationName: 'Unauthorized Equipment',   violationDescription: 'Illegal or undeclared racing tack detected.',                        type: 'pre-race',    category: 'horse-safety',   severity: 3, defaultPenalty: 'Disqualification' },
            { violationName: 'Injury Non-Disclosure',    violationDescription: 'Failure to report a known injury before race.',                      type: 'pre-race',    category: 'horse-safety',   severity: 2, defaultPenalty: 'Fine' },
            { violationName: 'Improper Treatment',       violationDescription: 'Unauthorized veterinary treatment administered pre-race.',            type: 'pre-race',    category: 'horse-safety',   severity: 3, defaultPenalty: 'Suspension' },
            { violationName: 'Horse Abuse',              violationDescription: 'Abuse, neglect, or unsafe handling of the horse in stable/paddock.', type: 'pre-race',    category: 'horse-safety',   severity: 4, defaultPenalty: 'Major suspension' },
            // ── pre-race — medication ─────────────────────────────────────────
            { violationName: 'Race-Day Medication',      violationDescription: 'Prohibited medication administered within race-day window.',          type: 'pre-race',    category: 'medication',     severity: 4, defaultPenalty: 'Fine or DQ' },
            // ── pre-race — administrative ─────────────────────────────────────
            { violationName: 'False Documentation',      violationDescription: 'Fake records or fraudulent registration documents submitted.',        type: 'pre-race',    category: 'administrative', severity: 4, defaultPenalty: 'Suspension' },
            { violationName: 'Unlicensed Participation', violationDescription: 'Participant racing without valid authorization or license.',          type: 'pre-race',    category: 'administrative', severity: 4, defaultPenalty: 'Removal' },
            { violationName: 'Restricted Area Access',   violationDescription: 'Unauthorized access to stable, paddock, or restricted zones.',       type: 'pre-race',    category: 'administrative', severity: 2, defaultPenalty: 'Removal' },
            { violationName: 'Failure to Comply',        violationDescription: 'Ignoring official steward or referee instructions.',                  type: 'pre-race',    category: 'administrative', severity: 2, defaultPenalty: 'Fine' },
            // ── during-race — riding ──────────────────────────────────────────
            { violationName: 'Interference',             violationDescription: 'Blocking or impeding another horse during the race.',                 type: 'during-race', category: 'riding',         severity: 2, defaultPenalty: 'Warning or demotion' },
            { violationName: 'Careless Riding',          violationDescription: 'Unsafe riding without reckless intent.',                             type: 'during-race', category: 'riding',         severity: 2, defaultPenalty: 'Fine or suspension' },
            { violationName: 'Dangerous Riding',         violationDescription: 'Reckless riding causing serious danger to others.',                  type: 'during-race', category: 'riding',         severity: 3, defaultPenalty: 'Suspension' },
            { violationName: 'Course Deviation',         violationDescription: 'Failure to maintain the prescribed racing line.',                    type: 'during-race', category: 'riding',         severity: 1, defaultPenalty: 'Warning' },
            { violationName: 'Excessive Whip Use',       violationDescription: 'Whip usage exceeds permitted limits.',                              type: 'during-race', category: 'riding',         severity: 2, defaultPenalty: 'Fine' },
            { violationName: 'False Start',              violationDescription: 'Horse leaves the gate before the official start signal.',            type: 'during-race', category: 'riding',         severity: 2, defaultPenalty: 'Declared non-starter' },
            { violationName: 'Non-Competitive Riding',   violationDescription: 'Jockey fails to make a full, genuine racing effort.',               type: 'during-race', category: 'riding',         severity: 2, defaultPenalty: 'Investigation' },
            // ── during-race — betting ─────────────────────────────────────────
            { violationName: 'Race Fixing',              violationDescription: 'Deliberate manipulation of the race outcome.',                       type: 'during-race', category: 'betting',        severity: 5, defaultPenalty: 'Permanent ban' },
            { violationName: 'Collusion',                violationDescription: 'Coordinated manipulation between parties to affect the result.',     type: 'during-race', category: 'betting',        severity: 5, defaultPenalty: 'Ban' },
            { violationName: 'Insider Betting',          violationDescription: 'Restricted individual placing bets using non-public race information.', type: 'during-race', category: 'betting',    severity: 3, defaultPenalty: 'Account suspension' },
            { violationName: 'Betting Fraud',            violationDescription: 'Fraudulent betting activity to gain unlawful advantage.',            type: 'during-race', category: 'betting',        severity: 4, defaultPenalty: 'Account closure' },
            { violationName: 'Odds Manipulation',        violationDescription: 'Artificially manipulating market odds.',                             type: 'during-race', category: 'betting',        severity: 3, defaultPenalty: 'Investigation' },
            // ── after-race — riding ───────────────────────────────────────────
            { violationName: 'Weigh-In Violation',       violationDescription: 'Incorrect rider weight recorded after the race.',                    type: 'after-race',  category: 'riding',         severity: 3, defaultPenalty: 'Disqualification' },
            // ── after-race — medication ───────────────────────────────────────
            { violationName: 'Positive Drug Test',       violationDescription: 'Prohibited substance detected in post-race sample.',                 type: 'after-race',  category: 'medication',     severity: 4, defaultPenalty: 'Disqualification' },
            { violationName: 'Banned Substance',         violationDescription: 'Possession of an illegal substance confirmed post-race.',            type: 'after-race',  category: 'medication',     severity: 4, defaultPenalty: 'Suspension' },
            { violationName: 'Sample Tampering',         violationDescription: 'Interfering with or adulterating drug test samples.',               type: 'after-race',  category: 'medication',     severity: 5, defaultPenalty: 'Severe suspension' },
            { violationName: 'Test Refusal',             violationDescription: 'Refusing to participate in mandatory post-race testing.',            type: 'after-race',  category: 'medication',     severity: 4, defaultPenalty: 'Automatic violation' },
            // ── after-race — administrative ───────────────────────────────────
            { violationName: 'Failure to Attend Inquiry',violationDescription: 'Ignoring or failing to appear at a mandatory steward inquiry.',     type: 'after-race',  category: 'administrative', severity: 2, defaultPenalty: 'Fine' },
            { violationName: 'Does not response to invitation', violationDescription: 'Participant failed to respond to a race invitation within the required timeframe.', type: 'pre-race', category: 'administrative', severity: 1, defaultPenalty: 'None' },
        ];

        const violationTypes = {};
        for (const def of vtDefs) {
            const vt = await ViolationType.create({ ...def, isActive: true });
            violationTypes[def.violationName] = vt;
        }
        console.log(`✅ Created ${vtDefs.length} violation types`);

        // ══════════════════════════════════════════════════════════════════════
        // SAMPLE VIOLATIONS — Round 1 / reg1c (Celine's failed Golden Flash)
        // ══════════════════════════════════════════════════════════════════════
        await Violation.create({
            raceRoundId: round1._id,
            registrationId: reg1c._id,
            raceRefereeId: raceRef1._id,
            violationTypeId: violationTypes['Unfit Horse']._id,
            description: 'Elevated heart rate and lameness detected in left foreleg during pre-race soundness check.',
            severity: 3,
            stewardAction: 'no-action',
            violationStatus: 'confirmed',
        });
        await Violation.create({
            raceRoundId: round1._id,
            registrationId: reg1c._id,
            raceRefereeId: raceRef1._id,
            violationTypeId: violationTypes['Unauthorized Equipment']._id,
            description: 'Non-declared blinker cup found during gear inspection.',
            severity: 3,
            stewardAction: 'no-action',
            violationStatus: 'confirmed',
        });
        console.log('✅ Created 2 sample violations for Round 1 / Golden Flash (reg1c)');

        // ── Round 4 / reg4b — Careless Riding (Luca Moretti on Iron Duchess) ──
        await Violation.create({
            raceRoundId: round4._id,
            registrationId: reg4b._id,
            raceRefereeId: raceRef4._id,
            violationTypeId: violationTypes['Careless Riding']._id,
            description: 'Moved across the track without sufficient clearance on the final bend, forcing Desert Wind wide.',
            severity: 2,
            stewardAction: 'warning',
            violationStatus: 'confirmed',
        });
        console.log('✅ Created 1 during-race violation for Round 4 / Luca Moretti (reg4b)');

        // ── Summary ───────────────────────────────────────────────────────────
        console.log('\n✅ Seed completed!');
        console.log('════════════════════════════════════════════════════════════');
        console.log('Password for all accounts: Mongodb@1234');
        console.log('');
        console.log('ACCOUNTS');
        console.log('  Horse Owners  horseowner1@horsari.com  Alice Chen       [approved]');
        console.log('                horseowner2@horsari.com  Bruno Hartmann   [approved]');
        console.log('                horseowner3@horsari.com  Celine Dupont    [approved]');
        console.log('                horseowner4@horsari.com  Diana Moreau     [pending]');
        console.log('                horseowner5@horsari.com  Ethan Brooks     [pending]');
        console.log('  Admins        admin1@horsari.com');
        console.log('  Referees      referee1@horsari.com     David Park       [approved] (Round 1 & 2)');
        console.log('                referee2@horsari.com     Elena Vasquez    [approved] (Round 3)');
        console.log('                referee3@horsari.com     Frank Müller     [approved]');
        console.log('                referee4@horsari.com     Grace Kim        [pending]');
        console.log('                referee5@horsari.com     Henry Walsh      [pending]');
        console.log('  Jockeys       jockey1@horsari.com      Marco Rossi      [approved]');
        console.log('                jockey2@horsari.com      Luca Moretti     [approved]');
        console.log('                jockey3@horsari.com      Yuki Tanaka      [approved]');
        console.log('                jockey4@horsari.com      Sofia Reyes      [pending]');
        console.log('                jockey5@horsari.com      Kai Nakamura     [pending]');
        console.log('');
        console.log('RACE STATE SNAPSHOT');
        console.log('  Spring Classic 2026');
        console.log('    Round 4 — Grand Cup Final  [completed]  ← results published');
        console.log('      owner1 Alice  → verified   Thunderbolt  / Marco Rossi  — 1st  $80,000  2:01.34');
        console.log('      owner3 Celine → verified   Iron Duchess / Luca Moretti — 2nd  $35,000  2:02.11  ⚠ Careless Riding');
        console.log('      owner2 Bruno  → verified   Desert Wind  / Yuki Tanaka  — 3rd  $15,000  2:03.88');
        console.log('    Round 1 — Morning Sprint   [prepared]   ← admin: start or cancel');
        console.log('      owner1 Alice  → verified   Thunderbolt  / Marco Rossi ✓ (main, racing)');
        console.log('                                              Luca Moretti   (backup, confirmed)');
        console.log('      owner2 Bruno  → verified   Desert Wind  / Luca Moretti ✓');
        console.log('      owner3 Celine → failed     Golden Flash (soundness issue)');
        console.log('    Round 2 — Evening Classic  [scheduled]  ← referee: inspect');
        console.log('      owner1 Alice  → approved   Silver Comet  / Yuki Tanaka ✓ (main, confirmed)');
        console.log('                                               Marco Rossi   (backup, pending)');
        console.log('      owner2 Bruno  → approved   Midnight Star / Marco Rossi ⌛ (jockey pending)');
        console.log('      owner3 Celine → pending    (no horse or jockey assigned)');
        console.log('  Non-tournament');
        console.log('    Round 3 — Standalone Night Race [running] ← live now');
        console.log('      owner1 Alice  → verified   Thunderbolt  / Luca Moretti ✓');
        console.log('      owner2 Bruno  → verified   Desert Wind  / Yuki Tanaka ✓');
        console.log('════════════════════════════════════════════════════════════');

        process.exit(0);
    } catch (error) {
        console.error('Error generating mock data:', error);
        process.exit(1);
    }
};

mockData();
