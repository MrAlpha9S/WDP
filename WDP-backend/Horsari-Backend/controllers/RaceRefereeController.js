const RaceRefereeService = require('../services/RaceRefereeService');

class RaceRefereeController {
    async getByReferee(req, res) {
        const { refereeId } = req.params;
        const response = await RaceRefereeService.getByRefereeId(refereeId);
        return res.status(response.code).json(response);
    }

    async setStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        if (!['assigned', 'rejected'].includes(status)) {
            return res.status(400).json({ code: 400, message: 'Invalid status' });
        }
        // ensure requester is the assigned referee
        const existing = await RaceRefereeService.getById(id);
        if (existing.code !== 200) {
            return res.status(existing.code).json(existing);
        }

        const assignment = existing.data;
        if (!assignment.refereeId || assignment.refereeId.toString() !== req.userId.toString()) {
            return res.status(403).json({ code: 403, message: 'Forbidden: only the assigned referee can change this status' });
        }

        const response = await RaceRefereeService.update(id, { status });
        return res.status(response.code).json(response);
    }
}

module.exports = new RaceRefereeController();
