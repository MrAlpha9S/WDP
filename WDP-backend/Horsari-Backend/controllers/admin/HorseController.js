const AdminHorseService = require('../../services/AdminHorseService');

class HorseController {
    // ── Horse Management ────────────────────────────────────────────────────────

    async getAllHorses(req, res) {
        const { page = 1, limit = 10, search, status, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await AdminHorseService.getAllHorses(+page, +limit, search, status, sortBy, order);
        return res.status(response.code).json(response);
    }

    async getHorseDetail(req, res) {
        const response = await AdminHorseService.getHorseDetail(req.params.horseId);
        return res.status(response.code).json(response);
    }

    async updateHorseStatus(req, res) {
        const { horseId } = req.params;
        const { status } = req.body;
        const response = await AdminHorseService.updateHorseStatus(horseId, status);
        return res.status(response.code).json(response);
    }
}

module.exports = new HorseController();
