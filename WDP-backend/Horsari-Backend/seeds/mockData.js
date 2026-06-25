const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

const User           = require('../entities/User');
const Admin          = require('../entities/Admin');
const Jockey         = require('../entities/Jockey');
const HorseOwner     = require('../entities/HorseOwner');
const Referee        = require('../entities/Referee');
const Spectator      = require('../entities/Spectator');

const Horse               = require('../entities/Horse');
const Tournament          = require('../entities/Tournament');
const RaceRound           = require('../entities/RaceRound');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');

const Registration = require('../entities/Registration');
const Invitation   = require('../entities/Invitation');
const RaceReferee  = require('../entities/RaceReferee');
const RaceResult   = require('../entities/RaceResult');

const ViolationType = require('../entities/ViolationType');
const Violation     = require('../entities/Violation');

const PredictionMethod = require('../entities/PredictionMethod');
const Prediction       = require('../entities/Prediction');

const Transaction = require('../entities/Transaction');


const PASSWORD_HASH =
    '$2b$10$smxEWfBiOmkrAkvaBpyfJ.Lv/uxe4inN8KRymH6TN.W10RSAWMbrO';

const now = new Date();
const daysAgo = (n) => new Date(now - n * 86400000);
const daysLater = (n) => new Date(now.getTime() + n * 86400000);


async function seed() {
    try {

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Mongo connected');

        await mongoose.connection.db.dropDatabase();
        console.log('Database cleared');


        /* ================================================
           1. USER + PROFILE
           ================================================ */

        const admins     = [];
        const horseOwners = [];
        const jockeys    = [];
        const referees   = [];
        const spectators = [];


        // --- Admins (2) ---
        for (let i = 1; i <= 2; i++) {
            const user = await User.create({
                username:    `admin${i}`,
                passwordHash: PASSWORD_HASH,
                email:       `admin${i}@horsari.com`,
                fullName:    `Admin ${i}`,
                phoneNumber: `090000000${i}`,
                address:     `Admin Office ${i}, Ho Chi Minh City`,
                role:        'admin',
                status:      'active',
                dateOfBirth: new Date('1980-01-01'),
            });
            await Admin.create({ _id: user._id });
            admins.push(user);
        }


        // --- Horse Owners (3) ---
        const ownerData = [
            { name: 'Nguyen Van A', phone: '0901111111', address: 'Hanoi' },
            { name: 'Tran Thi B',   phone: '0902222222', address: 'Da Nang' },
            { name: 'Le Van C',     phone: '0903333333', address: 'Ho Chi Minh City' },
        ];
        for (let i = 0; i < 3; i++) {
            const user = await User.create({
                username:    `owner${i + 1}`,
                passwordHash: PASSWORD_HASH,
                email:       `owner${i + 1}@horsari.com`,
                fullName:    ownerData[i].name,
                phoneNumber: ownerData[i].phone,
                address:     ownerData[i].address,
                role:        'horseowner',
                status:      'active',
                dateOfBirth: new Date('1985-05-15'),
            });
            await HorseOwner.create({
                _id:           user._id,
                address:       ownerData[i].address,
                licenseLink:   `https://cdn.horsari.com/licenses/owner${i + 1}.pdf`,
                licenseStatus: 'approved',
            });
            horseOwners.push(user);
        }


        // --- Jockeys (4) ---
        const jockeyData = [
            { name: 'Pham Minh Duc',    height: 168, weight: 57, races: 30, wins: 12, rank: 1 },
            { name: 'Hoang Tuan Kiet',  height: 165, weight: 55, races: 25, wins:  8, rank: 2 },
            { name: 'Vu Quoc Hung',     height: 170, weight: 60, races: 20, wins:  5, rank: 3 },
            { name: 'Bui Thanh Long',   height: 167, weight: 58, races: 15, wins:  3, rank: 4 },
        ];
        for (let i = 0; i < 4; i++) {
            const user = await User.create({
                username:    `jockey${i + 1}`,
                passwordHash: PASSWORD_HASH,
                email:       `jockey${i + 1}@horsari.com`,
                fullName:    jockeyData[i].name,
                phoneNumber: `091111111${i + 1}`,
                role:        'jockey',
                status:      'active',
                dateOfBirth: new Date('1995-03-20'),
            });
            await Jockey.create({
                _id:           user._id,
                height:        jockeyData[i].height,
                weight:        jockeyData[i].weight,
                matchesRaced:  jockeyData[i].races,
                totalWins:     jockeyData[i].wins,
                ranking:       jockeyData[i].rank,
                licenseLink:   `https://cdn.horsari.com/licenses/jockey${i + 1}.pdf`,
                licenseStatus: 'approved',
                status:        'active',
            });
            jockeys.push(user);
        }


        // --- Referees (3) ---
        const refereeData = [
            { name: 'Do Van Quang',   phone: '0921111111' },
            { name: 'Mai Thi Huong',  phone: '0922222222' },
            { name: 'Nguyen Duc Tai', phone: '0923333333' },
        ];
        for (let i = 0; i < 3; i++) {
            const user = await User.create({
                username:    `referee${i + 1}`,
                passwordHash: PASSWORD_HASH,
                email:       `referee${i + 1}@horsari.com`,
                fullName:    refereeData[i].name,
                phoneNumber: refereeData[i].phone,
                role:        'referee',
                status:      'active',
                dateOfBirth: new Date('1978-07-10'),
            });
            await Referee.create({
                _id:           user._id,
                licenseLink:   `https://cdn.horsari.com/licenses/referee${i + 1}.pdf`,
                licenseStatus: 'approved',
            });
            referees.push(user);
        }


        // --- Spectators (4) ---
        const spectatorData = [
            { name: 'Cao Thi Mai',    points: 1500 },
            { name: 'Truong Van Binh', points:  800 },
            { name: 'Ly Thi Lan',     points: 2200 },
            { name: 'Dinh Quoc Viet', points:  300 },
        ];
        for (let i = 0; i < 4; i++) {
            const user = await User.create({
                username:    `spectator${i + 1}`,
                passwordHash: PASSWORD_HASH,
                email:       `spectator${i + 1}@horsari.com`,
                fullName:    spectatorData[i].name,
                phoneNumber: `093111111${i + 1}`,
                role:        'spectator',
                status:      'active',
                dateOfBirth: new Date('2000-11-25'),
            });
            await Spectator.create({
                _id:          user._id,
                rewardPoints: spectatorData[i].points,
            });
            spectators.push(user);
        }


        /* ================================================
           2. MASTER DATA
           ================================================ */

        // --- RaceEligibilityRule (3) ---
        const rules = await RaceEligibilityRule.create([
            {
                raceType:          'Sprint',
                minAge:            2,
                maxAge:            8,
                minRacesRun:       3,
                minRacesWon:       0,
                requiredGender:    null,
                licenseRequired:   true,
                requireNomination: false,
                isActive:          true,
            },
            {
                raceType:          'Classic',
                minAge:            3,
                maxAge:            10,
                minRacesRun:       5,
                minRacesWon:       1,
                requiredGender:    null,
                licenseRequired:   true,
                requireNomination: true,
                isActive:          true,
            },
            {
                raceType:          'Maiden',
                minAge:            2,
                maxAge:            4,
                minRacesRun:       0,
                minRacesWon:       0,
                requiredGender:    null,
                licenseRequired:   false,
                requireNomination: false,
                isActive:          true,
            },
        ]);


        // --- ViolationType (5) ---
        const violationTypes = await ViolationType.create([
            {
                violationName:        'False Start',
                violationDescription: 'Horse broke from the gate before the official start signal',
                defaultPenalty:       'Warning on first offense',
                type:                 'pre-race',
                category:             'riding',
                severity:             1,
                isActive:             true,
            },
            {
                violationName:        'Unsafe Riding',
                violationDescription: 'Jockey rode in a manner that endangered other horses or riders',
                defaultPenalty:       'Fine of $500 and suspension review',
                type:                 'during-race',
                category:             'riding',
                severity:             3,
                isActive:             true,
            },
            {
                violationName:        'Prohibited Substance',
                violationDescription: 'Horse tested positive for a banned medication',
                defaultPenalty:       'Disqualification and investigation',
                type:                 'after-race',
                category:             'medication',
                severity:             5,
                isActive:             true,
            },
            {
                violationName:        'Illegal Equipment',
                violationDescription: 'Use of unapproved equipment during the race',
                defaultPenalty:       'Fine of $200',
                type:                 'pre-race',
                category:             'horse-safety',
                severity:             2,
                isActive:             true,
            },
            {
                violationName:        'Result Manipulation',
                violationDescription: 'Suspected fixing or deliberate poor performance',
                defaultPenalty:       'Permanent ban pending investigation',
                type:                 'after-race',
                category:             'betting',
                severity:             5,
                isActive:             true,
            },
        ]);


        // --- PredictionMethod (3) ---
        const predictionMethods = await PredictionMethod.create([
            {
                methodName:        'Winner',
                methodDescription: 'Predict the horse that finishes in 1st place',
                isActive:          true,
            },
            {
                methodName:        'Top 3',
                methodDescription: 'Predict any horse that finishes in the top 3',
                isActive:          true,
            },
            {
                methodName:        'Exacta',
                methodDescription: 'Predict the exact 1st and 2nd place finishers in order',
                isActive:          true,
            },
        ]);


        /* ================================================
           3. HORSES (8 — spread across 3 owners)
           ================================================ */

        const horseData = [
            { name: 'Thunder Bolt',   breed: 'Thoroughbred', gender: 'male',   dob: '2020-03-10' },
            { name: 'Silver Wind',    breed: 'Arabian',       gender: 'female', dob: '2021-06-22' },
            { name: 'Dark Knight',    breed: 'Thoroughbred', gender: 'male',   dob: '2019-11-05' },
            { name: 'Golden Sunrise', breed: 'Quarter Horse', gender: 'female', dob: '2020-08-15' },
            { name: 'Storm Chaser',   breed: 'Thoroughbred', gender: 'male',   dob: '2021-01-30' },
            { name: 'Midnight Star',  breed: 'Arabian',       gender: 'female', dob: '2020-05-18' },
            { name: 'Iron Fist',      breed: 'Thoroughbred', gender: 'male',   dob: '2022-02-14' },
            { name: 'Rose Petal',     breed: 'Quarter Horse', gender: 'female', dob: '2022-09-09' },
        ];

        const horses = [];
        for (let i = 0; i < horseData.length; i++) {
            const horse = await Horse.create({
                ownerId:          horseOwners[i % 3]._id,
                horseName:        horseData[i].name,
                breed:            horseData[i].breed,
                gender:           horseData[i].gender,
                healthStatus:     i === 5 ? 'injured' : 'healthy',
                registrationDate: daysAgo(60),
                status:           i === 7 ? 'inactive' : 'active',
                img:              `https://cdn.horsari.com/horses/horse${i + 1}.jpg`,
                dateOfBirth:      new Date(horseData[i].dob),
            });
            horses.push(horse);
        }


        /* ================================================
           4. TOURNAMENT (2)
           ================================================ */

        const tournaments = await Tournament.create([
            {
                createdByAdminId: admins[0]._id,
                tournamentName:   'Horsari Spring Championship 2025',
                description:      'Annual spring horse racing championship featuring top thoroughbreds from across the country.',
                startDate:        daysAgo(30),
                endDate:          daysLater(30),
                status:           'ongoing',
                prizePool:        200000,
            },
            {
                createdByAdminId: admins[1]._id,
                tournamentName:   'Horsari Summer Invitational 2025',
                description:      'Invitational summer tournament for elite registered horses.',
                startDate:        daysLater(60),
                endDate:          daysLater(90),
                status:           'scheduled',
                prizePool:        150000,
            },
        ]);


        /* ================================================
           5. RACE ROUND (3 — 2 in T1, 1 in T2)
           ================================================ */

        const rounds = await RaceRound.create([
            {
                tournamentId:      tournaments[0]._id,
                createdByAdminId:  admins[0]._id,
                roundName:         'Quarter Final — Sprint 1600m',
                raceDate:          daysAgo(10),
                trackLength:       1600,
                maxParticipants:   6,
                status:            'completed',
                minimalRidingFees: 500,
                raceGround:        'Grass',
                requireEntranceFees: true,
                firstPlacePrize:   50000,
                secondPlacePrize:  20000,
                thirdPlacePrize:   10000,
                currencyType:      'USD',
                location:          'Phu Tho Racetrack',
                address:           '1 Ly Thuong Kiet, Ward 8, District 11, Ho Chi Minh City',
                eligibilityRuleId: rules[0]._id,
                muxLiveStreamId:   'mux-live-id-round1',
                muxStreamKey:      'mux-stream-key-round1',
                muxPlaybackId:     'mux-playback-id-round1',
                muxVodPlaybackId:  'mux-vod-id-round1',
            },
            {
                tournamentId:      tournaments[0]._id,
                createdByAdminId:  admins[0]._id,
                roundName:         'Semi Final — Classic 2000m',
                raceDate:          daysLater(5),
                trackLength:       2000,
                maxParticipants:   6,
                status:            'scheduled',
                minimalRidingFees: 700,
                raceGround:        'Turf',
                requireEntranceFees: true,
                firstPlacePrize:   70000,
                secondPlacePrize:  30000,
                thirdPlacePrize:   15000,
                currencyType:      'USD',
                location:          'Phu Tho Racetrack',
                address:           '1 Ly Thuong Kiet, Ward 8, District 11, Ho Chi Minh City',
                eligibilityRuleId: rules[1]._id,
                muxLiveStreamId:   'mux-live-id-round2',
                muxStreamKey:      'mux-stream-key-round2',
                muxPlaybackId:     'mux-playback-id-round2',
                muxVodPlaybackId:  'mux-vod-id-round2',
            },
            {
                tournamentId:      tournaments[1]._id,
                createdByAdminId:  admins[1]._id,
                roundName:         'Opening Race — Maiden 1200m',
                raceDate:          daysLater(62),
                trackLength:       1200,
                maxParticipants:   8,
                status:            'draft',
                minimalRidingFees: 300,
                raceGround:        'Dirt',
                requireEntranceFees: false,
                firstPlacePrize:   20000,
                secondPlacePrize:   8000,
                thirdPlacePrize:    4000,
                currencyType:      'USD',
                location:          'Long An Racecourse',
                address:           '50 Highway 1A, Tan An, Long An Province',
                eligibilityRuleId: rules[2]._id,
                muxLiveStreamId:   'mux-live-id-round3',
                muxStreamKey:      'mux-stream-key-round3',
                muxPlaybackId:     'mux-playback-id-round3',
                muxVodPlaybackId:  'mux-vod-id-round3',
            },
        ]);

        const round1 = rounds[0]; // completed
        const round2 = rounds[1]; // scheduled
        const round3 = rounds[2]; // draft


        /* ================================================
           6. REGISTRATION
           — Round 1: horses[0..5], all approved + laneNumber
           — Round 2: horses[0..4], mix of statuses
           ================================================ */

        const registrations = [];

        // Round 1 — 6 horses, all approved, lanes 1-6
        for (let i = 0; i < 6; i++) {
            const reg = await Registration.create({
                raceRoundId:       round1._id,
                horseId:           horses[i]._id,
                horseOwnerId:      horses[i].ownerId,
                approvedByAdminId: admins[0]._id,
                registrationStatus: 'approved',
                laneNumber:        i + 1,
                registeredAt:      daysAgo(20),
            });
            registrations.push(reg);
        }

        // Round 2 — 5 horses, mixed statuses
        const round2Statuses = ['pending', 'approved', 'approved', 'rejected', 'approved'];
        for (let i = 0; i < 5; i++) {
            const reg = await Registration.create({
                raceRoundId:        round2._id,
                horseId:            horses[i]._id,
                horseOwnerId:       horses[i].ownerId,
                approvedByAdminId:  admins[0]._id,
                registrationStatus: round2Statuses[i],
                verificationFailReason: round2Statuses[i] === 'rejected'
                    ? 'Horse does not meet minimum age requirement'
                    : undefined,
                laneNumber: round2Statuses[i] !== 'rejected' ? i + 1 : undefined,
                registeredAt: daysAgo(5),
            });
            registrations.push(reg);
        }

        // Shorthand refs for Round 1 registrations
        const r1Regs = registrations.slice(0, 6);
        // Round 2 approved registrations
        const r2Regs = registrations.slice(6);


        /* ================================================
           7. INVITATION
           — Each Round 1 registration gets a jockey
           ================================================ */

        const invitations = [];

        for (let i = 0; i < r1Regs.length; i++) {
            const invitation = await Invitation.create({
                horseId:            horses[i]._id,
                jockeyId:           jockeys[i % jockeys.length]._id,
                registrationId:     r1Regs[i]._id,
                ownerConfirmation:  true,
                jockeyConfirmation: true,
                invitationStatus:   'accepted',
                isBackup:           false,
                percentagePayout:   10,
            });
            invitations.push(invitation);

            // Link invitation back to registration
            await Registration.findByIdAndUpdate(
                r1Regs[i]._id,
                { jockeyInRaceId: invitation._id }
            );
        }

        // Backup jockey invitation for horse[0] (declined primary scenario)
        const backupInvitation = await Invitation.create({
            horseId:            horses[0]._id,
            jockeyId:           jockeys[3]._id,
            registrationId:     r1Regs[0]._id,
            ownerConfirmation:  true,
            jockeyConfirmation: false,
            invitationStatus:   'pending',
            isBackup:           true,
            percentagePayout:   8,
        });
        invitations.push(backupInvitation);

        // Round 2 pending invitation (not yet accepted)
        const pendingInvitation = await Invitation.create({
            horseId:            horses[1]._id,
            jockeyId:           jockeys[1]._id,
            registrationId:     r2Regs[1]._id,
            ownerConfirmation:  true,
            jockeyConfirmation: false,
            invitationStatus:   'pending',
            isBackup:           false,
            percentagePayout:   12,
        });
        invitations.push(pendingInvitation);


        /* ================================================
           8. RACE REFEREE
           — Round 1: 2 referees assigned
           — Round 2: 1 referee pending
           ================================================ */

        const raceReferee1 = await RaceReferee.create({
            raceRoundId:       round1._id,
            refereeId:         referees[0]._id,
            assignedByAdminId: admins[0]._id,
            assignedAt:        daysAgo(15),
            status:            'assigned',
            paymentStatus:     'paid',
            fee:               2000,
        });

        const raceReferee2 = await RaceReferee.create({
            raceRoundId:       round1._id,
            refereeId:         referees[1]._id,
            assignedByAdminId: admins[0]._id,
            assignedAt:        daysAgo(15),
            status:            'assigned',
            paymentStatus:     'paid',
            fee:               2000,
        });

        await RaceReferee.create({
            raceRoundId:       round2._id,
            refereeId:         referees[2]._id,
            assignedByAdminId: admins[0]._id,
            assignedAt:        daysAgo(2),
            status:            'pending',
            paymentStatus:     'unpaid',
            fee:               2000,
        });


        /* ================================================
           9. RACE RESULT (Round 1 — top 3 + one cancelled)
           ================================================ */

        const resultData = [
            { reg: r1Regs[0], pos: 1, time: '1:38.20', prize: 50000 },
            { reg: r1Regs[1], pos: 2, time: '1:38.95', prize: 20000 },
            { reg: r1Regs[2], pos: 3, time: '1:39.40', prize: 10000 },
            { reg: r1Regs[3], pos: 4, time: '1:40.10', prize: 0 },
            { reg: r1Regs[4], pos: 5, time: '1:41.30', prize: 0 },
        ];

        for (const rd of resultData) {
            await RaceResult.create({
                raceRoundId:       round1._id,
                registrationId:    rd.reg._id,
                publishedByAdminId: admins[0]._id,
                finishPosition:    rd.pos,
                finishTime:        rd.time,
                prizeMoney:        rd.prize,
                resultStatus:      'official',
            });
        }

        // Cancelled result (horse[5] disqualified)
        await RaceResult.create({
            raceRoundId:       round1._id,
            registrationId:    r1Regs[5]._id,
            publishedByAdminId: admins[0]._id,
            finishPosition:    6,
            finishTime:        'DQ',
            prizeMoney:        0,
            resultStatus:      'cancelled',
        });


        /* ================================================
           10. VIOLATION (Round 1)
           ================================================ */

        // False start — horse[4], warning
        await Violation.create({
            raceRoundId:     round1._id,
            registrationId:  r1Regs[4]._id,
            raceRefereeId:   raceReferee1._id,
            violationTypeId: violationTypes[0]._id,
            description:     'Horse broke early from gate #5 before the official start signal',
            severity:        1,
            actualPenalty:   'Verbal warning issued to jockey',
            stewardAction:   'warning',
            violationStatus: 'confirmed',
        });

        // Unsafe riding — horse[5], disqualified
        await Violation.create({
            raceRoundId:     round1._id,
            registrationId:  r1Regs[5]._id,
            raceRefereeId:   raceReferee1._id,
            violationTypeId: violationTypes[1]._id,
            description:     'Jockey intentionally cut across lane 4 causing collision risk at the final bend',
            severity:        3,
            actualPenalty:   'Disqualification from race',
            stewardAction:   'disqualified',
            violationStatus: 'confirmed',
        });

        // Prohibited substance — horse[5], under investigation
        await Violation.create({
            raceRoundId:     round1._id,
            registrationId:  r1Regs[5]._id,
            raceRefereeId:   raceReferee2._id,
            violationTypeId: violationTypes[2]._id,
            description:     'Post-race blood sample flagged for prohibited stimulant; sent for laboratory confirmation',
            severity:        5,
            actualPenalty:   'Pending investigation result',
            stewardAction:   'investigation',
            violationStatus: 'pending',
        });


        /* ================================================
           11. PREDICTION (spectators betting on Round 1)
           ================================================ */

        const predictionSeeds = [
            // spectator1 — predicted winner correctly
            { spec: spectators[0], reg: r1Regs[0], method: predictionMethods[0], rank: 1, status: 'correct',   points: 500 },
            // spectator1 — predicted top3, also correct
            { spec: spectators[0], reg: r1Regs[2], method: predictionMethods[1], rank: 3, status: 'correct',   points: 200 },
            // spectator2 — predicted winner, wrong
            { spec: spectators[1], reg: r1Regs[3], method: predictionMethods[0], rank: 1, status: 'incorrect', points:   0 },
            // spectator2 — predicted top3, correct
            { spec: spectators[1], reg: r1Regs[1], method: predictionMethods[1], rank: 2, status: 'correct',   points: 200 },
            // spectator3 — exacta, correct
            { spec: spectators[2], reg: r1Regs[0], method: predictionMethods[2], rank: 1, status: 'correct',   points: 800 },
            // spectator3 — winner, incorrect
            { spec: spectators[2], reg: r1Regs[4], method: predictionMethods[0], rank: 1, status: 'incorrect', points:   0 },
            // spectator4 — pending (Round 2 not yet run)
            { spec: spectators[3], reg: r2Regs[1], method: predictionMethods[0], rank: 1, status: 'pending',   points:   0 },
        ];

        const predictions = [];
        for (const ps of predictionSeeds) {
            const pred = await Prediction.create({
                spectatorId:       ps.spec._id,
                registrationId:    ps.reg._id,
                predictionMethodId: ps.method._id,
                predictedRank:     ps.rank,
                predictionStatus:  ps.status,
                rewardPoints:      ps.points,
            });
            predictions.push(pred);
        }


        /* ================================================
           12. TRANSACTION
           ================================================ */

        // Reward transactions for correct predictions
        const rewardPreds = predictionSeeds.filter(p => p.status === 'correct' && p.points > 0);
        for (let i = 0; i < rewardPreds.length; i++) {
            const ps = rewardPreds[i];
            await Transaction.create({
                userId:          ps.spec._id,
                transactionType: 'reward',
                date:            daysAgo(9),
                status:          'completed',
                amount:          ps.points,
                description:     `Prediction reward — ${ps.method.methodName} on Round 1`,
                referenceId:     predictions[predictionSeeds.indexOf(ps)]._id.toString(),
                referenceType:   'prediction',
            });
        }

        // Deposit — spectator1 topped up balance
        await Transaction.create({
            userId:          spectators[0]._id,
            transactionType: 'deposit',
            date:            daysAgo(25),
            status:          'completed',
            amount:          2000,
            description:     'Wallet top-up via VNPay',
            referenceType:   'payment',
        });

        // Withdrawal — spectator3 withdrew winnings
        await Transaction.create({
            userId:          spectators[2]._id,
            transactionType: 'withdrawal',
            date:            daysAgo(8),
            status:          'completed',
            amount:          1000,
            description:     'Withdrawal to linked bank account',
            referenceType:   'payment',
        });

        // Refund — spectator4's pending prediction refund scenario
        await Transaction.create({
            userId:          spectators[3]._id,
            transactionType: 'refund',
            date:            daysAgo(1),
            status:          'pending',
            amount:          100,
            description:     'Refund for cancelled prediction in Round 2',
            referenceType:   'prediction',
        });

        // Failed transaction for edge case testing
        await Transaction.create({
            userId:          spectators[1]._id,
            transactionType: 'deposit',
            date:            daysAgo(3),
            status:          'failed',
            amount:          500,
            description:     'Deposit failed — insufficient funds',
            referenceType:   'payment',
        });


        console.log('\n✅ Seed completed successfully');
        console.log('   Users      :', 2 + 3 + 4 + 3 + 4, '(2 admin / 3 owner / 4 jockey / 3 referee / 4 spectator)');
        console.log('   Horses     :', horses.length);
        console.log('   Tournaments:', tournaments.length);
        console.log('   RaceRounds :', rounds.length);
        console.log('   Registrations:', registrations.length);
        console.log('   Invitations:', invitations.length);
        console.log('   RaceResults: 6');
        console.log('   Violations : 3');
        console.log('   Predictions:', predictions.length);

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}


seed();