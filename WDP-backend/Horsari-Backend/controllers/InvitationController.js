const InvitationService = require('../services/InvitationService');

class InvitationController {
  async createInvitation(req, res, next) {
    try {
      const data = req.body;
      const result = await InvitationService.createInvitation(data);
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async getInvitationById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await InvitationService.getInvitationById(id);
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async getInvitationsByJockeyId(req, res, next) {
    try {
      const { jockeyId } = req.params;
      const result = await InvitationService.getInvitationsByJockeyId(jockeyId);
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }
  async getInvitationsByOwnerId(req, res, next) {
    try {
      const { ownerId } = req.params;
      const limit = Number.parseInt(req.query.limit, 10) || 10;
      const skip = Number.parseInt(req.query.skip, 10) || 0;
      const result = await InvitationService.getInvitationsByOwnerId(ownerId, { limit, skip });
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }
  async toggleInvitationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { jockeyConfirmation } = req.body;
      const result = await InvitationService.toggleInvitationStatus(id, jockeyConfirmation);
      return res.status(result.code).json(result);
    } catch (err) {
      next(err);
    }
  }
  async updateInvitation(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await InvitationService.updateInvitation(id, updateData);
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async getTournamentsWithRoundsAndInvitations(req, res, next) {
    try {
      let ids = req.params.invitationIds || req.query.invitationIds || req.body?.invitationIds;
      if (!ids) {
        return res.status(400).json({ code: 400, message: 'invitationIds parameter is required', data: null });
      }
      if (typeof ids === 'string' && ids.includes(',')) {
        ids = ids.split(',').map(s => s.trim()).filter(Boolean);
      }
      const result = await InvitationService.getTournamentsWithRoundsAndInvitations(ids);
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // Controller method to get tournaments for a specific jockey's invitations
  async getTournamentsWithRoundsAndInvitationsForJockey(req, res, next) {
    try {
      const jockeyId = req.params.jockeyId || req.query.jockeyId || req.body?.jockeyId;
      if (!jockeyId) {
        return res.status(400).json({ code: 400, message: 'jockeyId parameter is required', data: null });
      }
      const result = await InvitationService.getTournamentsWithRoundsAndInvitationsForJockey(jockeyId);
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new InvitationController();
