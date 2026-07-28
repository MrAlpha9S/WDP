const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const User = require("../entities/User");
const Admin = require("../entities/Admin");
const Jockey = require("../entities/Jockey");
const HorseOwner = require("../entities/HorseOwner");
const Referee = require("../entities/Referee");
const Spectator = require("../entities/Spectator");

const Horse = require("../entities/Horse");
const Tournament = require("../entities/Tournament");
const RaceRound = require("../entities/RaceRound");
const RaceEligibilityRule = require("../entities/RaceEligibilityRule");

const Registration = require("../entities/Registration");
const Invitation = require("../entities/Invitation");
const RaceReferee = require("../entities/RaceReferee");

const ViolationType = require("../entities/ViolationType");
const Violation = require("../entities/Violation");

const PredictionMethod = require("../entities/PredictionMethod");
const Prediction = require("../entities/Prediction");

const PASSWORD_HASH =
  "$2b$10$smxEWfBiOmkrAkvaBpyfJ.Lv/uxe4inN8KRymH6TN.W10RSAWMbrO";

const now = new Date();
const daysAgo = (n) => new Date(now - n * 86400000);
const daysLater = (n) => new Date(now.getTime() + n * 86400000);
const atHour = (date, h) => { const d = new Date(date); d.setHours(h, 0, 0, 0); return d; };

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo connected");

    await mongoose.connection.db.dropDatabase();
    console.log("Database cleared");

    /* ================================================
           1. USER + PROFILE
           ================================================ */

    const admins = [];
    const horseOwners = [];
    const jockeys = [];
    const referees = [];
    const spectators = [];

    // --- Admins (2) ---
    for (let i = 1; i <= 2; i++) {
      const user = await User.create({
        username: `admin${i}`,
        passwordHash: PASSWORD_HASH,
        email: `admin${i}@horsari.com`,
        fullName: `Admin ${i}`,
        phoneNumber: `090000000${i}`,
        address: `Admin Office ${i}, Ho Chi Minh City`,
        role: "admin",
        status: "active",
        dateOfBirth: new Date("1980-01-01"),
      });
      await Admin.create({ _id: user._id, isMainAdmin: i === 1, wallet: 0 });
      admins.push(user);
    }

    // --- Horse Owners (6) ---
    const ownerData = [
      { name: "Nguyen Van A", phone: "0901111111", address: "Hanoi" },
      { name: "Tran Thi B", phone: "0902222222", address: "Da Nang" },
      { name: "Le Van C", phone: "0903333333", address: "Ho Chi Minh City" },
      { name: "Phan Thi Dao", phone: "0904444444", address: "Hue" },
      { name: "Nguyen Minh Khoa", phone: "0905555555", address: "Can Tho" },
      { name: "Dang Thi Thu", phone: "0906666666", address: "Bien Hoa" },
    ];
    for (let i = 0; i < 6; i++) {
      const user = await User.create({
        username: `owner${i + 1}`,
        passwordHash: PASSWORD_HASH,
        email: `owner${i + 1}@horsari.com`,
        fullName: ownerData[i].name,
        phoneNumber: ownerData[i].phone,
        address: ownerData[i].address,
        role: "horseowner",
        status: "active",
        dateOfBirth: new Date("1985-05-15"),
      });
      await HorseOwner.create({
        _id: user._id,
        address: ownerData[i].address,
        licenseLink: `https://cdn.horsari.com/licenses/owner${i + 1}.pdf`,
        licenseStatus: "approved",
      });
      horseOwners.push(user);
    }

    // --- Jockeys (6) ---
    // races/wins start at 0 for all — no race round in this seed script ever
    // reaches "completed" (round2=scheduled, round3=draft, round4=prepared),
    // so there's no basis for any jockey to already have a race history.
    // matchesRaced/totalWins now increment for real via confirmRaceResult.
    const jockeyData = [
      {
        name: "Pham Minh Duc",
        height: 168,
        weight: 57,
        races: 0,
        wins: 0,
        bookingFee: 500000
      },
      {
        name: "Tran Minh Anh",
        height: 175,
        weight: 55,
        races: 0,
        wins: 0,
        bookingFee: 450000
      },
      {
        name: "Le Hoang Anh",
        height: 170,
        weight: 55,
        races: 0,
        wins: 0,
        bookingFee: 450000
      },
      {
        name: "Hoang Tuan Kiet",
        height: 165,
        weight: 55,
        races: 0,
        wins: 0,
        bookingFee: 300000
      },
      {
        name: "Vu Quoc Hung",
        height: 170,
        weight: 60,
        races: 0,
        wins: 0,
        bookingFee: 250000
      },
      {
        name: "Bui Thanh Long",
        height: 167,
        weight: 58,
        races: 0,
        wins: 0,
        bookingFee: 200000
      },
    ];
    for (let i = 0; i < 6; i++) {
      const user = await User.create({
        username: `jockey${i + 1}`,
        passwordHash: PASSWORD_HASH,
        email: `jockey${i + 1}@horsari.com`,
        fullName: jockeyData[i].name,
        phoneNumber: `091111111${i + 1}`,
        role: "jockey",
        status: "active",
        dateOfBirth: new Date("1995-03-20"),
      });
      await Jockey.create({
        _id: user._id,
        height: jockeyData[i].height,
        weight: jockeyData[i].weight,
        matchesRaced: jockeyData[i].races,
        totalWins: jockeyData[i].wins,
        bookingFee: jockeyData[i].bookingFee,
        licenseLink: `https://cdn.horsari.com/licenses/jockey${i + 1}.pdf`,
        licenseStatus: "approved",
        status: "active",
      });
      jockeys.push(user);
    }

    // --- Referees (3) ---
    const refereeData = [
      { name: "Do Van Quang", phone: "0921111111" },
      { name: "Mai Thi Huong", phone: "0922222222" },
      { name: "Nguyen Duc Tai", phone: "0923333333" },
    ];
    for (let i = 0; i < 3; i++) {
      const user = await User.create({
        username: `referee${i + 1}`,
        passwordHash: PASSWORD_HASH,
        email: `referee${i + 1}@horsari.com`,
        fullName: refereeData[i].name,
        phoneNumber: refereeData[i].phone,
        role: "referee",
        status: "active",
        dateOfBirth: new Date("1978-07-10"),
      });
      await Referee.create({
        _id: user._id,
        licenseLink: `https://cdn.horsari.com/licenses/referee${i + 1}.pdf`,
        licenseStatus: "approved",
      });
      referees.push(user);
    }

    // --- Spectators (4) ---
    const spectatorData = [
      { name: "Cao Thi Mai", points: 1500 },
      { name: "Truong Van Binh", points: 800 },
      { name: "Ly Thi Lan", points: 2200 },
      { name: "Dinh Quoc Viet", points: 300 },
    ];
    for (let i = 0; i < 4; i++) {
      const user = await User.create({
        username: `spectator${i + 1}`,
        passwordHash: PASSWORD_HASH,
        email: `spectator${i + 1}@horsari.com`,
        fullName: spectatorData[i].name,
        phoneNumber: `093111111${i + 1}`,
        role: "spectator",
        status: "active",
        dateOfBirth: new Date("2000-11-25"),
      });
      await Spectator.create({
        _id: user._id,
        wallet: spectatorData[i].points,
      });
      spectators.push(user);
    }

    /* ================================================
           2. MASTER DATA
           ================================================ */

    // --- RaceEligibilityRule (6) ---
    // rules[0]=Stakes G1, [1]=Stakes G2, [2]=Stakes G3, [3]=Allowance, [4]=Claiming, [5]=Maiden
    const rules = await RaceEligibilityRule.create([
      {
        // Stakes G1 — top tier, proven champions only
        raceType: "Stakes G1",
        minAge: 3,
        maxAge: null,
        minRacesRun: 0,
        minRacesWon: 3,
        requiredGender: null,
        licenseRequired: false,
        requireNomination: false,
        isActive: true,
      },
      {
        // Stakes G2 — high tier
        raceType: "Stakes G2",
        minAge: 3,
        maxAge: null,
        minRacesRun: 0,
        minRacesWon: 2,
        requiredGender: null,
        licenseRequired: false,
        requireNomination: false,
        isActive: true,
      },
      {
        // Stakes G3 — entry-level stakes
        raceType: "Stakes G3",
        minAge: 2,
        maxAge: null,
        minRacesRun: 0,
        minRacesWon: 1,
        requiredGender: null,
        licenseRequired: false,
        requireNomination: false,
        isActive: true,
      },
      {
        // Allowance — won at least once but not stakes-ready; max 2 wins (condition)
        raceType: "Allowance",
        minAge: 2,
        maxAge: null,
        minRacesRun: 0,
        minRacesWon: 1,
        maxRacesWon: 2,
        requiredGender: null,
        licenseRequired: false,
        requireNomination: false,
        isActive: true,
      },
      {
        // Claiming — any owner can claim the horse at the listed price
        raceType: "Claiming",
        minAge: 2,
        maxAge: null,
        minRacesRun: 0,
        minRacesWon: null,
        requiredGender: null,
        licenseRequired: false,
        requireNomination: false,
        claimingPrice: 40000,
        isActive: true,
      },
      {
        // Maiden — for horses that have never won a race
        raceType: "Maiden",
        minAge: 2,
        maxAge: null,
        minRacesRun: 0,
        minRacesWon: null,
        maxRacesWon: 0,
        requiredGender: null,
        licenseRequired: false,
        requireNomination: false,
        isActive: true,
      },
    ]);

    // --- ViolationType (29 — pre-race, during-race and after-race) ---
    const violationTypes = await ViolationType.create([
      // ── PRE-RACE / horse-safety ───────────────────────────────────────────
      { violationName: "Unfit Horse", violationDescription: "Horse is unsafe or unhealthy to race.", defaultPenalty: "Horse scratched", type: "pre-race", category: "horse-safety", severity: 3, isActive: true },
      { violationName: "Unauthorized Equipment", violationDescription: "Illegal or undeclared racing tack detected.", defaultPenalty: "Disqualification", type: "pre-race", category: "horse-safety", severity: 3, isActive: true },
      { violationName: "Injury Non-Disclosure", violationDescription: "Failure to report a known injury before race.", defaultPenalty: "Fine", type: "pre-race", category: "horse-safety", severity: 2, isActive: true },
      { violationName: "Improper Treatment", violationDescription: "Unauthorized veterinary treatment administered pre-race.", defaultPenalty: "Suspension", type: "pre-race", category: "horse-safety", severity: 3, isActive: true },
      { violationName: "Horse Abuse", violationDescription: "Abuse, neglect, or unsafe handling of the horse in stable/paddock.", defaultPenalty: "Major suspension", type: "pre-race", category: "horse-safety", severity: 4, isActive: true },
      // ── PRE-RACE / medication ─────────────────────────────────────────────
      { violationName: "Race-Day Medication", violationDescription: "Prohibited medication administered within race-day window.", defaultPenalty: "Fine or DQ", type: "pre-race", category: "medication", severity: 4, isActive: true },
      // ── PRE-RACE / administrative ─────────────────────────────────────────
      { violationName: "False Documentation", violationDescription: "Fake records or fraudulent registration documents submitted.", defaultPenalty: "Suspension", type: "pre-race", category: "administrative", severity: 4, isActive: true },
      { violationName: "Unlicensed Participation", violationDescription: "Participant racing without valid authorization or license.", defaultPenalty: "Removal", type: "pre-race", category: "administrative", severity: 4, isActive: true },
      { violationName: "Restricted Area Access", violationDescription: "Unauthorized access to stable, paddock, or restricted zones.", defaultPenalty: "Removal", type: "pre-race", category: "administrative", severity: 2, isActive: true },
      { violationName: "Failure to Comply", violationDescription: "Ignoring official steward or referee instructions.", defaultPenalty: "Fine", type: "pre-race", category: "administrative", severity: 2, isActive: true },
      { violationName: "Does not response to invitation", violationDescription: "Participant failed to respond to a race invitation within the required timeframe.", defaultPenalty: "None", type: "pre-race", category: "administrative", severity: 1, isActive: true },
      // ── DURING-RACE / riding ──────────────────────────────────────────────
      { violationName: "Interference", violationDescription: "Blocking or impeding another horse during the race.", defaultPenalty: "Warning or demotion", type: "during-race", category: "riding", severity: 2, isActive: true },
      { violationName: "Careless Riding", violationDescription: "Unsafe riding without reckless intent.", defaultPenalty: "Fine or suspension", type: "during-race", category: "riding", severity: 2, isActive: true },
      { violationName: "Dangerous Riding", violationDescription: "Reckless riding causing serious danger to others.", defaultPenalty: "Suspension", type: "during-race", category: "riding", severity: 3, isActive: true },
      { violationName: "Course Deviation", violationDescription: "Failure to maintain the prescribed racing line.", defaultPenalty: "Warning", type: "during-race", category: "riding", severity: 1, isActive: true },
      { violationName: "Excessive Whip Use", violationDescription: "Whip usage exceeds permitted limits.", defaultPenalty: "Fine", type: "during-race", category: "riding", severity: 2, isActive: true },
      { violationName: "False Start", violationDescription: "Horse leaves the gate before the official start signal.", defaultPenalty: "Declared non-starter", type: "during-race", category: "riding", severity: 2, isActive: true },
      { violationName: "Non-Competitive Riding", violationDescription: "Jockey fails to make a full, genuine racing effort.", defaultPenalty: "Investigation", type: "during-race", category: "riding", severity: 2, isActive: true },
      // ── DURING-RACE / betting ─────────────────────────────────────────────
      { violationName: "Race Fixing", violationDescription: "Deliberate manipulation of the race outcome.", defaultPenalty: "Permanent ban", type: "during-race", category: "betting", severity: 5, isActive: true },
      { violationName: "Collusion", violationDescription: "Coordinated manipulation between parties to affect the result.", defaultPenalty: "Ban", type: "during-race", category: "betting", severity: 5, isActive: true },
      { violationName: "Insider Betting", violationDescription: "Restricted individual placing bets using non-public race information.", defaultPenalty: "Account suspension", type: "during-race", category: "betting", severity: 3, isActive: true },
      { violationName: "Betting Fraud", violationDescription: "Fraudulent betting activity to gain unlawful advantage.", defaultPenalty: "Account closure", type: "during-race", category: "betting", severity: 4, isActive: true },
      { violationName: "Odds Manipulation", violationDescription: "Artificially manipulating market odds.", defaultPenalty: "Investigation", type: "during-race", category: "betting", severity: 3, isActive: true },
      // ── AFTER-RACE / riding ───────────────────────────────────────────────
      { violationName: "Weigh-In Violation", violationDescription: "Incorrect rider weight recorded after the race.", defaultPenalty: "Disqualification", type: "after-race", category: "riding", severity: 3, isActive: true },
      // ── AFTER-RACE / medication ───────────────────────────────────────────
      { violationName: "Positive Drug Test", violationDescription: "Prohibited substance detected in post-race sample.", defaultPenalty: "Disqualification", type: "after-race", category: "medication", severity: 4, isActive: true },
      { violationName: "Banned Substance", violationDescription: "Possession of an illegal substance confirmed post-race.", defaultPenalty: "Suspension", type: "after-race", category: "medication", severity: 4, isActive: true },
      { violationName: "Sample Tampering", violationDescription: "Interfering with or adulterating drug test samples.", defaultPenalty: "Severe suspension", type: "after-race", category: "medication", severity: 5, isActive: true },
      { violationName: "Test Refusal", violationDescription: "Refusing to participate in mandatory post-race testing.", defaultPenalty: "Automatic violation", type: "after-race", category: "medication", severity: 4, isActive: true },
      // ── AFTER-RACE / administrative ───────────────────────────────────────
      { violationName: "Failure to Attend Inquiry", violationDescription: "Ignoring or failing to appear at a mandatory steward inquiry.", defaultPenalty: "Fine", type: "after-race", category: "administrative", severity: 2, isActive: true },
    ]);

    // --- PredictionMethod (3) ---
    const predictionMethods = await PredictionMethod.create([
      {
        methodName: "Champion",
        methodDescription:
          "Predict the horse that finishes in 1st place of Tournament",
        methodType: "tournament_champion",
        isActive: true,
      },
      {
        methodName: "Ranking",
        methodDescription:
          "Predict any horse that finishes in the guess position of RaceRound (1st, 2nd, 3rd,...)",
        methodType: "race_rank",
        isActive: true,
      },
      {
        methodName: "Exacta",
        methodDescription: "Predict the exact 1st place of RaceRound",
        methodType: "race_winner",
        isActive: true,
      },
    ]);

    /* ================================================
           3. HORSES (8 — spread across 3 owners)
           ================================================ */

    const horseData = [
      {
        name: "Thunder Bolt",
        breed: "Thoroughbred",
        gender: "male",
        dob: "2020-03-10",
      },
      {
        name: "Silver Wind",
        breed: "Arabian",
        gender: "female",
        dob: "2021-06-22",
      },
      {
        name: "Dark Knight",
        breed: "Thoroughbred",
        gender: "male",
        dob: "2019-11-05",
      },
      {
        name: "Golden Sunrise",
        breed: "Quarter Horse",
        gender: "female",
        dob: "2020-08-15",
      },
      {
        name: "Storm Chaser",
        breed: "Thoroughbred",
        gender: "male",
        dob: "2021-01-30",
      },
      {
        name: "Midnight Star",
        breed: "Arabian",
        gender: "female",
        dob: "2020-05-18",
      },
      {
        name: "Iron Fist",
        breed: "Thoroughbred",
        gender: "male",
        dob: "2022-02-14",
      },
      {
        name: "Rose Petal",
        breed: "Quarter Horse",
        gender: "female",
        dob: "2022-09-09",
      },
    ];

    const horses = [];
    for (let i = 0; i < horseData.length; i++) {
      const horse = await Horse.create({
        ownerId: horseOwners[i % 6]._id,
        horseName: horseData[i].name,
        breed: horseData[i].breed,
        gender: horseData[i].gender,
        healthStatus: i === 5 ? "injured" : "healthy",
        registrationDate: daysAgo(60),
        status: i === 7 ? "inactive" : "active",
        img: `https://cdn.horsari.com/horses/horse${i + 1}.jpg`,
        dateOfBirth: new Date(horseData[i].dob),
      });
      horses.push(horse);
    }

    /* ================================================
           4. TOURNAMENT (3)
           ================================================ */

    const tournaments = await Tournament.create([
      {
        createdByAdminId: admins[0]._id,
        tournamentName: "Horsari Spring Championship 2025",
        description:
          "Annual spring horse racing championship featuring top thoroughbreds from across the country.",
        startDate: daysAgo(30),
        endDate: daysLater(30),
        status: "ongoing",
        prizePool: 200000,
      },
      {
        createdByAdminId: admins[1]._id,
        tournamentName: "Horsari Summer Invitational 2025",
        description:
          "Invitational summer tournament for elite registered horses.",
        startDate: daysLater(60),
        endDate: daysLater(90),
        status: "scheduled",
        prizePool: 150000,
      },
      {
        createdByAdminId: admins[0]._id,
        tournamentName: "Non-tournament",
        description:
          "non-tournament",
        startDate: null,
        endDate: null,
        status: "ongoing",
        prizePool: null,
      },
    ]);

    /* ================================================
           5. RACE ROUND (2 — 1 in T1, 1 in T2)
           ================================================ */

    const rounds = await RaceRound.create([
      {
        tournamentId: tournaments[0]._id,
        createdByAdminId: admins[0]._id,
        roundName: "Semi Final — Allowance 2000m",
        raceDate: atHour(daysLater(5), 14),
        trackLength: 2000,
        maxParticipants: 6,
        status: "scheduled",
        baseFee: 17_500_000,
        housingFeePercentage: 0.20,
        raceGround: "Turf",
        requireEntranceFees: true,
        firstPlacePrize: 1_750_000_000,
        secondPlacePrize: 750_000_000,
        thirdPlacePrize: 375_000_000,
        currencyType: "VND",
        location: "Phu Tho Racetrack",
        address: "1 Ly Thuong Kiet, Ward 8, District 11, Ho Chi Minh City",
        eligibilityRuleId: rules[3]._id,
        muxLiveStreamId: "mux-live-id-round2",
        muxStreamKey: "mux-stream-key-round2",
        muxPlaybackId: "mux-playback-id-round2",
        muxVodPlaybackId: "mux-vod-id-round2",
      },
      {
        tournamentId: tournaments[1]._id,
        createdByAdminId: admins[1]._id,
        roundName: "Opening Race — Maiden 1200m",
        raceDate: atHour(daysLater(62), 10),
        trackLength: 1200,
        maxParticipants: 8,
        status: "draft",
        baseFee: 7_500_000,
        raceGround: "Dirt",
        requireEntranceFees: false,
        firstPlacePrize: 500_000_000,
        secondPlacePrize: 200_000_000,
        thirdPlacePrize: 100_000_000,
        currencyType: "VND",
        location: "Long An Racecourse",
        address: "50 Highway 1A, Tan An, Long An Province",
        eligibilityRuleId: rules[5]._id,
        muxLiveStreamId: "mux-live-id-round3",
        muxStreamKey: "mux-stream-key-round3",
        muxPlaybackId: "mux-playback-id-round3",
        muxVodPlaybackId: "mux-vod-id-round3",
      },
    ]);

    const round2 = rounds[0]; // scheduled
    const round3 = rounds[1]; // draft

    /* ================================================
           6. REGISTRATION
           — Round 2: horses[0..4], mix of statuses
           ================================================ */

    const registrations = [];

    // Round 2 — 5 horses, mixed owner-decision statuses
    // Flow: admin invited owners → owners responded independently
    //   pending  = owner has not responded yet
    //   approved = owner accepted and selected a horse
    //   rejected = owner declined the invitation
    // Lane numbers are not assigned yet (race is still scheduled, referee has not run pre-check)
    // verificationFailReason is NOT set here — it is only written by the referee during verifyRegistration
    const round2Statuses = [
      "pending",   // owner[0] hasn't responded
      "approved",  // owner[1] accepted
      "approved",  // owner[2] accepted
      "rejected",  // owner[3] declined
      "approved",  // owner[4] accepted
    ];
    for (let i = 0; i < 5; i++) {
      const reg = await Registration.create({
        raceRoundId: round2._id,
        horseId: horses[i]._id,
        horseOwnerId: horses[i].ownerId,
        approvedByAdminId: admins[0]._id,
        registrationStatus: round2Statuses[i],
        registeredAt: daysAgo(5),
      });
      registrations.push(reg);
    }

    const r2Regs = registrations;

    /* ================================================
           7. INVITATION
           Rules:
           - All invitations for a registration share the same horseId as that registration
           - Exactly one main jockey per registration (isBackup: false)
           - One or more backup jockeys per registration (isBackup: true)
           ================================================ */

    const invitations = [];

    // Helper: pick a backup jockey that is different from the main and any already used backups
    const pickBackup = (mainIdx, ...excludeIdx) =>
      jockeys.find((j, i) => i !== mainIdx && !excludeIdx.includes(i));

    // ── Round 2 (scheduled) — invitations only for approved registrations ────────
    // r2Regs[0]=pending  → no invitation (owner hasn't approved yet;
    //                       InvitationService rejects invitations on non-approved regs)
    // r2Regs[1]=approved → main jockey invited, accepted; backup pending
    // r2Regs[2]=approved → main jockey invited, not yet responded; backup pending
    // r2Regs[3]=rejected → no invitation (owner declined; horse won't race)
    // r2Regs[4]=approved → main jockey invited, accepted; backup pending
    //
    // jockeyInRaceId is NOT set here — it is only written by the referee during
    // verifyRegistration. Race is still scheduled; referee pre-check has not run.
    const r2InvMap = [
      { regIdx: 1, mainIdx: 1, isAccepted: true },   // owner1 approved, jockey confirmed
      { regIdx: 2, mainIdx: 2, isAccepted: false },  // owner2 approved, jockey not yet replied
      { regIdx: 4, mainIdx: 3, isAccepted: true },   // owner4 approved, jockey confirmed
    ];

    for (const entry of r2InvMap) {
      const reg = r2Regs[entry.regIdx];
      const horse = horses[entry.regIdx];

      const mainInv = await Invitation.create({
        horseId: horse._id,
        jockeyId: jockeys[entry.mainIdx]._id,
        registrationId: reg._id,
        ownerConfirmation: true,
        jockeyConfirmation: entry.isAccepted,
        invitationStatus: entry.isAccepted ? "accepted" : "pending",
        isBackup: false,
        percentagePayout: 10,
      });
      invitations.push(mainInv);
      await Registration.findByIdAndUpdate(reg._id, { horseId: horse._id });
      // jockeyInRaceId stays null — referee sets it when verifying the registration

      // Backup — always pending until referee selects the jockey for the race
      const backupJockey = pickBackup(entry.mainIdx);
      const backupInv = await Invitation.create({
        horseId: horse._id,
        jockeyId: backupJockey._id,
        registrationId: reg._id,
        ownerConfirmation: true,
        jockeyConfirmation: false,
        invitationStatus: "pending",
        isBackup: true,
        percentagePayout: 8,
      });
      invitations.push(backupInv);
    }

    /* ================================================
           8. RACE REFEREE
           — Round 2: 1 referee pending
           ================================================ */

    await RaceReferee.create({
      raceRoundId: round2._id,
      refereeId: referees[2]._id,
      assignedByAdminId: admins[0]._id,
      assignedAt: daysAgo(2),
      status: "pending",
      paymentStatus: "unpaid",
      fee: 50_000_000,
    });

    /* ================================================
       9. PREPARED RACE ROUND (Round 4 — ready for simulation)
       ================================================ */

    const round4 = await RaceRound.create({
      tournamentId: tournaments[0]._id,
      createdByAdminId: admins[0]._id,
      roundName: "Final — Stakes G1 1400m",
      raceDate: atHour(daysLater(1), 10),
      trackLength: 1400,
      maxParticipants: 6,
      status: "prepared",
      baseFee: 15_000_000,
      housingFeePercentage: 0.10,
      raceGround: "Turf",
      requireEntranceFees: true,
      firstPlacePrize: 2_000_000_000,
      secondPlacePrize: 875_000_000,
      thirdPlacePrize: 450_000_000,
      currencyType: "VND",
      location: "Phu Tho Racetrack",
      address: "1 Ly Thuong Kiet, Ward 8, District 11, Ho Chi Minh City",
      eligibilityRuleId: rules[0]._id,
      muxLiveStreamId: "mux-live-id-round4",
      muxStreamKey: "mux-stream-key-round4",
      muxPlaybackId: "mux-playback-id-round4",
      muxVodPlaybackId: "mux-vod-id-round4",
    });

    // 6 horses — all referee-verified, lanes assigned
    const r4Regs = [];
    for (let i = 0; i < 6; i++) {
      const reg = await Registration.create({
        raceRoundId: round4._id,
        horseId: horses[i]._id,
        horseOwnerId: horses[i].ownerId,
        approvedByAdminId: admins[0]._id,
        registrationStatus: "verified",
        laneNumber: i + 1,
        registeredAt: daysAgo(7),
      });
      r4Regs.push(reg);
    }

    // Accepted invitations — 1 main (confirmed, in race) + 1 backup (pending) per registration
    for (let i = 0; i < r4Regs.length; i++) {
      const mainIdx = i % jockeys.length;

      // Main jockey — accepted and flagged as in race
      const mainInv = await Invitation.create({
        horseId: horses[i]._id,
        jockeyId: jockeys[mainIdx]._id,
        registrationId: r4Regs[i]._id,
        ownerConfirmation: true,
        jockeyConfirmation: true,
        invitationStatus: "accepted",
        isJockeyInRace: true,
        isBackup: false,
        percentagePayout: 10,
      });
      invitations.push(mainInv);
      await Registration.findByIdAndUpdate(r4Regs[i]._id, { jockeyInRaceId: mainInv._id, horseId: horses[i]._id });

      // Backup jockey — same horse, pending response
      const backupJockey = pickBackup(mainIdx);
      const backupInv = await Invitation.create({
        horseId: horses[i]._id,
        jockeyId: backupJockey._id,
        registrationId: r4Regs[i]._id,
        ownerConfirmation: true,
        jockeyConfirmation: false,
        invitationStatus: "pending",
        isJockeyInRace: false,
        isBackup: true,
        percentagePayout: 8,
      });
      invitations.push(backupInv);
    }

    // Two referees assigned to Round 4 — round is still "prepared" (hasn't run,
    // confirmRaceResult never fired), so nothing has actually been paid yet.
    const raceReferee4a = await RaceReferee.create({
      raceRoundId: round4._id,
      refereeId: referees[0]._id,
      assignedByAdminId: admins[0]._id,
      assignedAt: daysAgo(5),
      status: "assigned",
      paymentStatus: "unpaid",
      fee: 50_000_000,
    });

    const raceReferee4b = await RaceReferee.create({
      raceRoundId: round4._id,
      refereeId: referees[1]._id,
      assignedByAdminId: admins[0]._id,
      assignedAt: daysAgo(5),
      status: "assigned",
      paymentStatus: "unpaid",
      fee: 50_000_000,
    });

    /* ================================================
           10. VIOLATIONS
           ================================================ */

    // ── Round 4 — pre-race violations (not yet resolved) ─────────────────────

    // False start during warm-up — horse[3] (confirmed, warning)
    await Violation.create({
      raceRoundId: round4._id,
      registrationId: r4Regs[3]._id,
      raceRefereeId: raceReferee4a._id,
      violationTypeId: violationTypes.find(v => v.violationName === "False Start")._id,
      description: "Horse broke through the warm-up gate during pre-race parade",
      severity: 1,
      actualPenalty: "Formal warning noted in race dossier",
      stewardAction: "warning",
      violationStatus: "confirmed",
    });

    /* ================================================
           11. PREDICTIONS (Round 4 — spectator wagers on the upcoming final)
           ================================================ */

    // Round 4 hasn't run yet ("prepared"), so every wager is still "pending" —
    // PayoutService settles these once confirmRaceResult records finish positions.
    const round4Predictions = await Prediction.create([
      {
        spectatorId: spectators[0]._id,
        registrationId: r4Regs[0]._id,
        predictedHorseId: horses[0]._id,
        predictionMethodId: predictionMethods[2]._id, // Exacta (race_winner)
        predictionStatus: "pending",
        rewardPoints: 12_000,
      },
      {
        spectatorId: spectators[2]._id,
        registrationId: r4Regs[1]._id,
        predictedHorseId: horses[1]._id,
        predictionMethodId: predictionMethods[2]._id, // Exacta (race_winner)
        predictionStatus: "pending",
        rewardPoints: 15_000,
      },
      {
        spectatorId: spectators[1]._id,
        registrationId: r4Regs[2]._id,
        predictedHorseId: horses[2]._id,
        predictionMethodId: predictionMethods[2]._id, // Exacta (race_winner)
        predictionStatus: "pending",
        rewardPoints: 9_000,
      },
      {
        spectatorId: spectators[0]._id,
        registrationId: r4Regs[3]._id,
        predictedHorseId: horses[3]._id,
        predictionMethodId: predictionMethods[2]._id, // Exacta (race_winner)
        predictionStatus: "pending",
        rewardPoints: 10_000,
      },
      {
        spectatorId: spectators[3]._id,
        registrationId: r4Regs[4]._id,
        predictedHorseId: horses[4]._id,
        predictionMethodId: predictionMethods[2]._id, // Exacta (race_winner)
        predictionStatus: "pending",
        rewardPoints: 8_000,
      },
      {
        spectatorId: spectators[1]._id,
        registrationId: r4Regs[5]._id,
        predictedHorseId: horses[5]._id,
        predictionMethodId: predictionMethods[2]._id, // Exacta (race_winner)
        predictionStatus: "pending",
        rewardPoints: 11_000,
      },
    ]);

    console.log("\n✅ Seed completed successfully");
    console.log(
      "   Users      :",
      2 + 6 + 4 + 3 + 4,
      "(2 admin / 6 owner / 4 jockey / 3 referee / 4 spectator)",
    );
    console.log("   Horses     :", horses.length);
    console.log("   Tournaments:", tournaments.length);
    console.log("   RaceRounds :", rounds.length + 1, "(1 scheduled + 1 draft + 1 prepared)");
    console.log("   Registrations:", registrations.length + r4Regs.length);
    console.log("   Invitations:", invitations.length);
    console.log("   ViolationTypes: 29 (pre-race, during-race, after-race)");
    console.log("   Violations : 1 (Round 4 pre-race)");
    console.log("   Predictions:", round4Predictions.length, "(Round 4, pending)");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
