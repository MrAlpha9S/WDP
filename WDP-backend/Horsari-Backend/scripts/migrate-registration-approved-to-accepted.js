// One-time migration: Registration.registrationStatus enum value 'approved' was renamed
// to 'accepted' (entities/Registration.js). Existing documents still holding the old
// string need to be backfilled, or every comparison in code that now checks for
// 'accepted' will silently stop matching them.
//
// Run manually: node scripts/migrate-registration-approved-to-accepted.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const Registration = require("../entities/Registration");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Migrating Registration.registrationStatus 'approved' -> 'accepted'...");

  const result = await Registration.updateMany(
    { registrationStatus: "approved" },
    { $set: { registrationStatus: "accepted" } }
  );

  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount} document(s).`);

  await mongoose.disconnect();
  console.log("Done.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
