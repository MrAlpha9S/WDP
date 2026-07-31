const JockeyRepository = require("../repositories/JockeyRepository");
const UserRepository = require("../repositories/UserRepository");
const HorseOwnerJockeyService = require("./HorseOwnerJockeyService");
const ProfileUpdateUtil = require("../utils/ProfileUpdateUtil");

class ProfileService {
  // Get all jockeys
  async getAllJockeys(page = 1, limit = 10, sortBy = 'createdAt', order = 'desc') {
    try {
      const skip = (page - 1) * limit;
      const orderNum = order === 'asc' ? 1 : -1;

      let items, totalItems;
      if (sortBy === 'winRate') {
        [items, totalItems] = await Promise.all([
          JockeyRepository.findAllSortedByWinRate(limit, skip, orderNum),
          JockeyRepository.count(),
        ]);
      } else {
        const sortObj = { [sortBy]: orderNum };
        const [jockeys, total] = await Promise.all([
          JockeyRepository.findAll(limit, skip, sortObj),
          JockeyRepository.count(),
        ]);
        items = jockeys.map((i) => {
          const { _id, ...rest } = i.toObject();
          const { passwordHash, ...rest2 } = i._id.toObject();
          return Object.assign({}, rest, rest2);
        });
        totalItems = total;
      }

      return {
        code: 200,
        data: {
          items,
          pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
        },
        msg: "Jockeys retrieved successfully",
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  // Mobile: jockey's own profile — reuses the horse-owner-facing jockey
  // profile lookup (rank, stats, recent races), since it's already keyed
  // purely off jockeyId with no horse-owner-specific access check.
  async getMyProfile(jockeyId) {
    return HorseOwnerJockeyService.getJockeyProfile(jockeyId);
  }

  // Mobile: jockey self-service profile edit. Only these whitelisted fields
  // are ever touched — email/username/password/role/status/licenseStatus/
  // licenseLink/wallet/matchesRaced/totalWins are system-managed and never
  // accepted here.
  async updateMyProfile(jockeyId, updateData) {
    const { bookingFee, weight, height, fullName, phoneNumber, address, image, dateOfBirth } = updateData;

    if (bookingFee != null && (typeof bookingFee !== 'number' || bookingFee < 0)) {
      return { code: 400, msg: 'bookingFee must be a non-negative number' };
    }
    if (weight != null && (typeof weight !== 'number' || weight <= 0)) {
      return { code: 400, msg: 'weight must be a positive number' };
    }
    if (height != null && (typeof height !== 'number' || height <= 0)) {
      return { code: 400, msg: 'height must be a positive number' };
    }
    let parsedDateOfBirth;
    if (dateOfBirth != null) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (Number.isNaN(parsedDateOfBirth.getTime()) || parsedDateOfBirth > new Date()) {
        return { code: 400, msg: 'dateOfBirth must be a valid, non-future date' };
      }
    }

    const jockeyFields = {};
    if (bookingFee != null) jockeyFields.bookingFee = bookingFee;
    if (weight != null) jockeyFields.weight = weight;
    if (height != null) jockeyFields.height = height;

    const userFields = {};
    if (fullName != null) userFields.fullName = fullName;
    if (phoneNumber != null) userFields.phoneNumber = phoneNumber;
    if (address != null) userFields.address = address;
    if (image != null) userFields.image = image;
    if (parsedDateOfBirth != null) userFields.dateOfBirth = parsedDateOfBirth;

    await Promise.all([
      Object.keys(jockeyFields).length ? JockeyRepository.updateByJockeyId(jockeyId, jockeyFields) : null,
      Object.keys(userFields).length ? UserRepository.updateById(jockeyId, userFields) : null,
    ]);

    return HorseOwnerJockeyService.getJockeyProfile(jockeyId);
  }

  // Re-uploading a license requires re-verification, so licenseStatus
  // always resets to 'pending' regardless of its previous value.
  async updateMyLicense(jockeyId, fileBuffer, fileName) {
    try {
      if (!fileBuffer) return { code: 400, msg: 'License PDF is required' };
      const { licenseLink, licenseStatus } = await ProfileUpdateUtil.reuploadLicense(fileBuffer, fileName, 'licenses/jockey');
      await JockeyRepository.updateByJockeyId(jockeyId, { licenseLink, licenseStatus });
      return HorseOwnerJockeyService.getJockeyProfile(jockeyId);
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }
}

module.exports = new ProfileService();
