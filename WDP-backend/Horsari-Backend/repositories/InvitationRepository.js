//entities not models
const Invitation = require('../entities/Invitation');
class InvitationRepository {
    async create(invitationData) {
        const invitation = new Invitation(invitationData);
        return await invitation.save();
    }
    async findById(id) {
        return await Invitation.findById(id).populate('invitationId');
    }
    async findByInvitationId(invitationId) {
        return await Invitation.findOne({ invitationId }).populate('invitationId');
    }
    async findByJockeyId(jockeyId) {
        return await Invitation.find({ jockeyId }).populate('invitationId');
    }
    async findAll( limit = 10, page = 1) {
        const skip = (page - 1) * limit;
        return await Invitation.find()
            .populate('invitationId')
            .limit(limit)
            .skip(skip);
    }
    async findByStatus(status) {
        return await Invitation.find({ status }).populate('invitationId');
    }
    async updateById(id, updateData) {
        return await Invitation.findByIdAndUpdate(id, updateData, { new: true });
    }
    async updateManyByRegistrationIds(registrationIds, updateData) {
        return await Invitation.updateMany({ registrationId: { $in: registrationIds } }, updateData);
    }

}
module.exports = new InvitationRepository();