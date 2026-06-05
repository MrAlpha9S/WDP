const Admin = require('../entities/Admin');

class AdminRepository {
    // Create
    async create(adminData) {
        const admin = new Admin(adminData);
        return await admin.save();
    }

    // Read
    async findById(id) {
        return await Admin.findById(id).populate('_id');
    }

    async findByAdminId(adminId) {
        return await Admin.findById(adminId).populate('_id');
    }

    async findAll(limit = 10, skip = 0) {
        return await Admin.find()
            .populate('_id')
            .limit(limit)
            .skip(skip);
    }


    // Update
    async updateById(id, updateData) {
        return await Admin.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('_id');
    }

    async updateByAdminId(adminId, updateData) {
        return await Admin.findByIdAndUpdate(adminId, updateData, {
            new: true,
        }).populate('_id');
    }

    // Delete
    async deleteById(id) {
        return await Admin.findByIdAndDelete(id);
    }

    async deleteByAdminId(adminId) {
        return await Admin.findByIdAndDelete(adminId);
    }

    // Count
    async count() {
        return await Admin.countDocuments();
    }
}

module.exports = new AdminRepository();
