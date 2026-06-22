const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const User = require('../entities/User');
const Admin = require('../entities/Admin');
const HorseOwner = require('../entities/HorseOwner');
const Jockey = require('../entities/Jockey');
const Referee = require('../entities/Referee');
const Spectator = require('../entities/Spectator');
const Horse = require('../entities/Horse');
const Tournament = require('../entities/Tournament');
const RaceRound = require('../entities/RaceRound');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Registration = require('../entities/Registration');
const Invitation = require('../entities/Invitation');
const RaceReferee = require('../entities/RaceReferee');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');
const ViolationType = require('../entities/ViolationType');
const Prediction = require('../entities/Prediction');
const PredictionMethod = require('../entities/PredictionMethod');
const Transaction = require('../entities/Transaction');

const PASSWORD_HASH = '$2b$10$smxEWfBiOmkrAkvaBpyfJ.Lv/uxe4inN8KRymH6TN.W10RSAWMbrO';
// 123456

const mockData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await mongoose.connection.db.dropDatabase();
        console.log('Cleared existing data');

        // ==================== ADMINS ====================
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
            await Admin.create({ _id: user._id });
            adminUsers.push(user);
        }
        console.log('✅ Created 3 admins');

        // ==================== HORSE OWNERS ====================
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
                address: `${i}00 Farm Lane, Horse City`,
                licenseLink: `https://storage.horsari.com/licenses/owner_${i}.pdf`,
                licenseStatus: 'approved',
            });
            horseOwners.push(owner);
        }
        console.log('✅ Created 3 horse owners');

        // ==================== JOCKEYS ====================
        const jockeys = [];
        const jockeyUsers = [];
        for (let i = 1; i <= 5; i++) {
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

            const jockey = await Jockey.create({
                _id: user._id,
                height: 165 + i,
                weight: 50 + i,
                matchesRaced: 10 * i,
                totalWins: 3 * i,
                ranking: i,
                licenseLink: `https://storage.horsari.com/licenses/jockey_${i}.pdf`,
                licenseStatus: 'approved',
                status: 'active',
            });
            jockeys.push(jockey);
        }
        console.log('✅ Created 5 jockeys');

        // ==================== REFEREES ====================
        const referees = [];
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

            const referee = await Referee.create({
                _id: user._id,
                licenseLink: `https://storage.horsari.com/licenses/referee_${i}.pdf`,
                licenseStatus: 'approved',
            });
            referees.push(referee);
        }
        console.log('✅ Created 3 referees');

        // ==================== SPECTATORS ====================
        const spectators = [];
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

            const spectator = await Spectator.create({
                _id: user._id,
                rewardPoints: 5000 * i,
            });
            spectators.push(spectator);
        }
        console.log('✅ Created 3 spectators');

        // ==================== HORSES ====================
        // Owner 1,2: 2 active horses each
        // Owner 3: 1 retired + 1 too young (edge case)
        const horses = [];
        const horseNames = [
            'Midnight Star', 'Amber Flame',
            'Golden Hoof', 'Storm Rider',
            'Silk Road', 'Thunder Bay',
        ];
        const breeds = ['Thoroughbred', 'Arabian', 'Quarter Horse', 'Standardbred'];

        for (let ownerIndex = 0; ownerIndex < horseOwners.length; ownerIndex++) {
            const owner = horseOwners[ownerIndex];
            for (let j = 0; j < 2; j++) {
                const nameIndex = ownerIndex * 2 + j;
                let status = 'active';
                let age = 4 + ownerIndex;

                if (ownerIndex === 2) {
                    status = j === 0 ? 'retired' : 'active';
                    age = j === 0 ? 5 : 1;
                }

                const horse = await Horse.create({
                    ownerId: owner._id,
                    horseName: horseNames[nameIndex],
                    breed: breeds[nameIndex % breeds.length],
                    dateOfBirth: new Date(new Date().getFullYear() - age, 0, 1),
                    gender: j % 2 === 0 ? 'female' : 'male',
                    healthStatus: 'healthy',
                    status: status,
                    img: `https://storage.horsari.com/horses/horse_${nameIndex + 1}.jpg`,
                    registrationDate: new Date(),
                });
                horses.push(horse);
            }
        }
        console.log('✅ Created 6 horses');

        // ==================== RACE ELIGIBILITY RULES ====================
        const ruleClaiming = await RaceEligibilityRule.create({
            raceType: 'Claiming',
            licenseRequired: true,
            isActive: true,
        });

        const ruleMaiden = await RaceEligibilityRule.create({
            raceType: 'Maiden',
            minAge: 2,
            minRacesWon: 0,
            licenseRequired: true,
            isActive: true,
        });
        console.log('✅ Created 2 race eligibility rules');

        // ==================== TOURNAMENTS ====================
        const tournamentNon = await Tournament.create({
            createdByAdminId: adminUsers[0]._id,
            tournamentName: 'Non-tournament',
            description: 'Standalone races not part of any tournament',
            startDate: null,
            endDate: null,
            status: 'ongoing',
            prizePool: 0,
        });

        const tournamentA = await Tournament.create({
            createdByAdminId: adminUsers[0]._id,
            tournamentName: 'Cúp Hoàng Gia 2024',
            description: 'Giải đấu đua ngựa uy tín nhất năm 2024',
            startDate: new Date('2024-05-01'),
            endDate: new Date('2024-06-30'),
            status: 'ongoing',
            prizePool: 500000000,
        });

        const tournamentB = await Tournament.create({
            createdByAdminId: adminUsers[1]._id,
            tournamentName: 'Đường Đua Ánh Sáng',
            description: 'Giải đua ngựa dành cho ngựa trẻ',
            startDate: new Date('2024-06-01'),
            endDate: new Date('2024-07-31'),
            status: 'scheduled',
            prizePool: 120000000,
        });
        console.log('✅ Created 3 tournaments');

        // ==================== RACE ROUNDS ====================
        // Round 1: completed (có kết quả)
        const round1 = await RaceRound.create({
            tournamentId: tournamentA._id,
            createdByAdminId: adminUsers[0]._id,
            roundName: 'Ascot Prestige Cup - Race 4',
            raceDate: new Date('2024-05-19T14:30:00'),
            trackLength: 1600,
            maxParticipants: 8,
            status: 'completed',
            minimalRidingFees: 500000,
            raceGround: 'Grass',
            requireEntranceFees: true,
            location: 'Sân vận động Quốc gia Mỹ Đình',
            address: 'Mỹ Đình, Nam Từ Liêm, Hà Nội',
            eligibilityRuleId: ruleClaiming._id,
            livestreamUrl: 'https://stream.horsari.com/live/round1',
        });

        // Round 2: running (đang diễn ra)
        const round2 = await RaceRound.create({
            tournamentId: tournamentA._id,
            createdByAdminId: adminUsers[0]._id,
            roundName: 'Cúp Hoàng Gia - Vòng 1',
            raceDate: new Date(),
            trackLength: 2000,
            maxParticipants: 8,
            status: 'running',
            minimalRidingFees: 1000000,
            raceGround: 'Dirt',
            requireEntranceFees: true,
            location: 'Trường đua Sài Gòn',
            address: 'Quận 1, TP. Hồ Chí Minh',
            eligibilityRuleId: ruleMaiden._id,
            livestreamUrl: 'https://stream.horsari.com/live/round2',
        });

        // Round 3: scheduled (sắp diễn ra)
        const round3 = await RaceRound.create({
            tournamentId: tournamentB._id,
            createdByAdminId: adminUsers[1]._id,
            roundName: 'Đường Đua Ánh Sáng - Vòng 1',
            raceDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            trackLength: 1200,
            maxParticipants: 6,
            status: 'scheduled',
            minimalRidingFees: 300000,
            raceGround: 'Grass',
            requireEntranceFees: false,
            location: 'Trường đua Rạch Chiếc',
            address: 'Rạch Chiếc, Quận 2, TP. Hồ Chí Minh',
            eligibilityRuleId: ruleMaiden._id,
            livestreamUrl: null,
        });
        console.log('✅ Created 3 race rounds');

        // ==================== REGISTRATIONS ====================
        // Round 1 (completed): 4 registrations — verified + confirmedJockey
        const reg1 = await Registration.create({
            raceRoundId: round1._id,
            horseId: horses[0]._id,
            horseOwnerId: horseOwners[0]._id,
            approvedByAdminId: adminUsers[0]._id,
            laneNumber: 1,
            registrationStatus: 'verified',
            registeredAt: new Date('2024-05-10'),
            confirmedJockeyId: jockeys[0]._id,
        });

        const reg2 = await Registration.create({
            raceRoundId: round1._id,
            horseId: horses[1]._id,
            horseOwnerId: horseOwners[0]._id,
            approvedByAdminId: adminUsers[0]._id,
            laneNumber: 2,
            registrationStatus: 'verified',
            registeredAt: new Date('2024-05-10'),
            confirmedJockeyId: jockeys[1]._id,
        });

        const reg3 = await Registration.create({
            raceRoundId: round1._id,
            horseId: horses[2]._id,
            horseOwnerId: horseOwners[1]._id,
            approvedByAdminId: adminUsers[0]._id,
            laneNumber: 3,
            registrationStatus: 'verified',
            registeredAt: new Date('2024-05-10'),
            confirmedJockeyId: jockeys[2]._id,
        });

        const reg4 = await Registration.create({
            raceRoundId: round1._id,
            horseId: horses[3]._id,
            horseOwnerId: horseOwners[1]._id,
            approvedByAdminId: adminUsers[0]._id,
            laneNumber: 4,
            registrationStatus: 'verified',
            registeredAt: new Date('2024-05-10'),
            confirmedJockeyId: jockeys[3]._id,
        });

        // Round 2 (running): 2 registrations — approved
        const reg5 = await Registration.create({
            raceRoundId: round2._id,
            horseId: horses[0]._id,
            horseOwnerId: horseOwners[0]._id,
            approvedByAdminId: adminUsers[0]._id,
            laneNumber: 1,
            registrationStatus: 'approved',
            registeredAt: new Date(),
            confirmedJockeyId: jockeys[0]._id,
        });

        const reg6 = await Registration.create({
            raceRoundId: round2._id,
            horseId: horses[2]._id,
            horseOwnerId: horseOwners[1]._id,
            approvedByAdminId: adminUsers[0]._id,
            laneNumber: 2,
            registrationStatus: 'approved',
            registeredAt: new Date(),
            confirmedJockeyId: jockeys[1]._id,
        });

        // Round 3 (scheduled): 2 registrations — pending
        const reg7 = await Registration.create({
            raceRoundId: round3._id,
            horseId: horses[1]._id,
            horseOwnerId: horseOwners[0]._id,
            laneNumber: 1,
            registrationStatus: 'pending',
            registeredAt: new Date(),
        });

        const reg8 = await Registration.create({
            raceRoundId: round3._id,
            horseId: horses[3]._id,
            horseOwnerId: horseOwners[1]._id,
            laneNumber: 2,
            registrationStatus: 'pending',
            registeredAt: new Date(),
        });
        console.log('✅ Created 8 registrations');

        // ==================== INVITATIONS ====================
        // Round 1 — accepted invitations
        await Invitation.create({
            jockeyId: jockeys[0]._id,
            registrationId: reg1._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });

        await Invitation.create({
            jockeyId: jockeys[1]._id,
            registrationId: reg2._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });

        await Invitation.create({
            jockeyId: jockeys[2]._id,
            registrationId: reg3._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 12,
        });

        await Invitation.create({
            jockeyId: jockeys[3]._id,
            registrationId: reg4._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 15,
        });

        // Round 2 — main + backup jockey
        await Invitation.create({
            jockeyId: jockeys[0]._id,
            registrationId: reg5._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });

        await Invitation.create({
            jockeyId: jockeys[4]._id,
            registrationId: reg5._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: true,
            percentagePayout: 8,
        });

        await Invitation.create({
            jockeyId: jockeys[1]._id,
            registrationId: reg6._id,
            ownerConfirmation: true,
            jockeyConfirmation: true,
            invitationStatus: 'accepted',
            isBackup: false,
            percentagePayout: 10,
        });

        // Round 3 — pending invitations
        await Invitation.create({
            jockeyId: jockeys[2]._id,
            registrationId: reg7._id,
            ownerConfirmation: true,
            jockeyConfirmation: false,
            invitationStatus: 'pending',
            isBackup: false,
            percentagePayout: 10,
        });

        await Invitation.create({
            jockeyId: jockeys[3]._id,
            registrationId: reg8._id,
            ownerConfirmation: true,
            jockeyConfirmation: false,
            invitationStatus: 'pending',
            isBackup: false,
            percentagePayout: 12,
        });
        console.log('✅ Created 9 invitations');

        // ==================== RACE REFEREES ====================
        const raceRef1 = await RaceReferee.create({
            raceRoundId: round1._id,
            refereeId: referees[0]._id,
            assignedByAdminId: adminUsers[0]._id,
            assignedAt: new Date('2024-05-15'),
            status: 'assigned',
            paymentStatus: 'paid',
            fee: 2000000,
        });

        const raceRef2 = await RaceReferee.create({
            raceRoundId: round1._id,
            refereeId: referees[1]._id,
            assignedByAdminId: adminUsers[0]._id,
            assignedAt: new Date('2024-05-15'),
            status: 'assigned',
            paymentStatus: 'paid',
            fee: 2000000,
        });

        await RaceReferee.create({
            raceRoundId: round2._id,
            refereeId: referees[2]._id,
            assignedByAdminId: adminUsers[0]._id,
            assignedAt: new Date(),
            status: 'assigned',
            paymentStatus: 'unpaid',
            fee: 2000000,
        });
        console.log('✅ Created 3 race referees');

        // ==================== RACE RESULTS (Round 1 only) ====================
        await RaceResult.create({
            raceRoundId: round1._id,
            registrationId: reg1._id,
            publishedByAdminId: adminUsers[0]._id,
            finishPosition: 1,
            finishTime: '1:42.30',
            prizeMoney: 200000000,
            resultStatus: 'official',
        });

        await RaceResult.create({
            raceRoundId: round1._id,
            registrationId: reg2._id,
            publishedByAdminId: adminUsers[0]._id,
            finishPosition: 2,
            finishTime: '1:43.10',
            prizeMoney: 100000000,
            resultStatus: 'official',
        });

        await RaceResult.create({
            raceRoundId: round1._id,
            registrationId: reg3._id,
            publishedByAdminId: adminUsers[0]._id,
            finishPosition: 3,
            finishTime: '1:44.50',
            prizeMoney: 50000000,
            resultStatus: 'official',
        });

        await RaceResult.create({
            raceRoundId: round1._id,
            registrationId: reg4._id,
            publishedByAdminId: adminUsers[0]._id,
            finishPosition: 4,
            finishTime: '1:45.20',
            prizeMoney: 0,
            resultStatus: 'official',
        });
        console.log('✅ Created 4 race results');

        // ==================== VIOLATION TYPES ====================
        const vtFalseStart = await ViolationType.create({
            violationName: 'False Start',
            violationDescription: 'Xuất phát sớm trước tín hiệu',
            defaultPenalty: 'Cảnh cáo',
            isActive: true,
        });

        const vtObstruction = await ViolationType.create({
            violationName: 'Obstruction',
            violationDescription: 'Cản trở ngựa khác trong đường đua',
            defaultPenalty: 'Hạ 1 bậc xếp hạng',
            isActive: true,
        });
        console.log('✅ Created 2 violation types');

        // ==================== VIOLATIONS ====================
        await Violation.create({
            registrationId: reg3._id,
            raceRefereeId: raceRef1._id,
            raceRoundId: round1._id,
            violationTypeId: vtFalseStart._id,
            description: 'Ngựa số 3 xuất phát trước tín hiệu 0.5 giây',
            actualPenalty: 'Cảnh cáo',
            violationStatus: 'confirmed',
        });

        await Violation.create({
            registrationId: reg4._id,
            raceRefereeId: raceRef2._id,
            raceRoundId: round1._id,
            violationTypeId: vtObstruction._id,
            description: 'Ngựa số 4 cản trở ngựa số 2 tại vòng cuối',
            actualPenalty: 'Hạ 1 bậc xếp hạng',
            violationStatus: 'confirmed',
        });
        console.log('✅ Created 2 violations');

        // ==================== PREDICTION METHODS ====================
        const pmFirst = await PredictionMethod.create({
            methodName: 'Dự đoán ngựa về nhất',
            methodDescription: 'Dự đoán chính xác ngựa về vị trí số 1',
            isActive: true,
        });

        const pmTop3 = await PredictionMethod.create({
            methodName: 'Dự đoán top 3',
            methodDescription: 'Dự đoán ngựa lọt vào top 3 về đích',
            isActive: true,
        });
        console.log('✅ Created 2 prediction methods');

        // ==================== PREDICTIONS ====================
        // Spectator 1: round1 — đúng (reg1 về nhất)
        const pred1 = await Prediction.create({
            spectatorId: spectators[0]._id,
            registrationId: reg1._id,
            predictionMethodId: pmFirst._id,
            predictedRank: 1,
            predictionStatus: 'correct',
            rewardPoints: 2400,
        });

        // Spectator 1: round1 — sai
        await Prediction.create({
            spectatorId: spectators[0]._id,
            registrationId: reg4._id,
            predictionMethodId: pmTop3._id,
            predictedRank: 1,
            predictionStatus: 'incorrect',
            rewardPoints: 0,
        });

        // Spectator 2: round1 — đúng top3
        const pred3 = await Prediction.create({
            spectatorId: spectators[1]._id,
            registrationId: reg2._id,
            predictionMethodId: pmTop3._id,
            predictedRank: 2,
            predictionStatus: 'correct',
            rewardPoints: 1000,
        });

        // Spectator 3: round2 — đang chờ
        await Prediction.create({
            spectatorId: spectators[2]._id,
            registrationId: reg5._id,
            predictionMethodId: pmFirst._id,
            predictedRank: 1,
            predictionStatus: 'pending',
            rewardPoints: 0,
        });
        console.log('✅ Created 4 predictions');

        // ==================== TRANSACTIONS ====================
        // Spectator 1: nạp + thưởng
        await Transaction.create({
            userId: spectatorUsers[0]._id,
            transactionType: 'deposit',
            amount: 5000,
            date: new Date('2024-05-18T18:45:00'),
            status: 'completed',
            description: 'Nạp tiền từ Vietcombank',
            referenceId: null,
            referenceType: null,
        });

        await Transaction.create({
            userId: spectatorUsers[0]._id,
            transactionType: 'reward',
            amount: 2400,
            date: new Date('2024-05-19T15:00:00'),
            status: 'completed',
            description: 'Thưởng dự đoán đúng: Dự đoán ngựa về nhất',
            referenceId: pred1._id.toString(),
            referenceType: 'prediction',
        });

        // Spectator 2: nạp + thưởng
        await Transaction.create({
            userId: spectatorUsers[1]._id,
            transactionType: 'deposit',
            amount: 3000,
            date: new Date('2024-05-17T10:00:00'),
            status: 'completed',
            description: 'Nạp tiền từ MoMo',
            referenceId: null,
            referenceType: null,
        });

        await Transaction.create({
            userId: spectatorUsers[1]._id,
            transactionType: 'reward',
            amount: 1000,
            date: new Date('2024-05-19T15:00:00'),
            status: 'completed',
            description: 'Thưởng dự đoán đúng: Dự đoán top 3',
            referenceId: pred3._id.toString(),
            referenceType: 'prediction',
        });

        // Spectator 3: nạp đang chờ xử lý
        await Transaction.create({
            userId: spectatorUsers[2]._id,
            transactionType: 'deposit',
            amount: 10000,
            date: new Date(),
            status: 'pending',
            description: 'Nạp tiền từ Vietcombank',
            referenceId: null,
            referenceType: null,
        });
        console.log('✅ Created 5 transactions');

        // ==================== SUMMARY ====================
        console.log('\n✅ Mock data generation completed!');
        console.log('====================================');
        console.log('Summary:');
        console.log('- 3 Admins');
        console.log('- 3 Horse Owners');
        console.log('- 5 Jockeys');
        console.log('- 3 Referees');
        console.log('- 3 Spectators');
        console.log('- 6 Horses (2 per owner)');
        console.log('- 2 Race Eligibility Rules (Claiming, Maiden)');
        console.log('- 3 Tournaments (Non-tournament, Cúp Hoàng Gia, Đường Đua Ánh Sáng)');
        console.log('- 3 Race Rounds (completed, running, scheduled)');
        console.log('- 8 Registrations');
        console.log('- 9 Invitations');
        console.log('- 3 Race Referees');
        console.log('- 4 Race Results (Round 1 - completed)');
        console.log('- 2 Violation Types');
        console.log('- 2 Violations');
        console.log('- 2 Prediction Methods');
        console.log('- 4 Predictions');
        console.log('- 5 Transactions');
        console.log('====================================');
        console.log('Password for all accounts: Mongodb@1234');
        console.log('\nLogin examples:');
        console.log('- admin1 / admin1@horsari.com');
        console.log('- horseowner1 / horseowner1@horsari.com');
        console.log('- jockey1 / jockey1@horsari.com');
        console.log('- referee1 / referee1@horsari.com');
        console.log('- spectator1 / spectator1@horsari.com');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error generating mock data:', error);
        process.exit(1);
    }
};

mockData();