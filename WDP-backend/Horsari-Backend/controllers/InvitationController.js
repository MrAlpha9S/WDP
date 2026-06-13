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
      // Prevent a horse owner from requesting another owner's invitations
      if (req.user && req.user.role === 'horseowner' && String(req.userId) !== String(ownerId)) {
        return res.status(403).json({ code: 403, message: 'Forbidden: cannot access other owners invitations' });
      }
      // pagination: support either (limit,skip) or (page,pageSize)
      let limit = Number.parseInt(req.query.limit, 10);
      let skip = Number.parseInt(req.query.skip, 10);
      const page = Number.parseInt(req.query.page, 10);
      const pageSize = Number.parseInt(req.query.pageSize, 10);
      if (Number.isNaN(limit) || limit <= 0) limit = 10;
      if (Number.isNaN(skip) || skip < 0) skip = 0;
      if (!Number.isNaN(page) && page > 0) {
        const ps = (!Number.isNaN(pageSize) && pageSize > 0) ? pageSize : limit;
        limit = ps;
        skip = (page - 1) * ps;
      }
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
