// Backend RaceEligibilityRule.raceType is free text with no enum constraint.
export type RaceType = string;
// Backend RaceReferee.status enum ['pending','assigned','rejected','cancelled'], mapped to display terms.
export type InviteStatus = "pending" | "accepted" | "declined" | "cancelled";
// Backend RaceReferee.paymentStatus enum — exact match.
export type PaymentStatus = "unpaid" | "processing" | "paid";
