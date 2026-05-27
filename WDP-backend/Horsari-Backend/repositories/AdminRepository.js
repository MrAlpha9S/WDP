const Admin = require('../entities/Admin');

class AdminRepository {
    // Create
    async create(adminData) {
        const admin = new Admin(adminData);
        return await admin.save();
    }

    // Read
    async findById(id) {
        return await Admin.findById(id).populate('adminid');
    }

    async findByAdminId(adminId) {
        return await Admin.findOne({ adminId }).populate('adminId');
    }

    async findAll(limit = 10, skip = 0) {
        return await Admin.find()
            .populate('adminId')
            .limit(limit)
            .skip(skip);
    }


    // Update
    async updateById(id, updateData) {
        return await Admin.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('adminId');
    }

    async updateByAdminId(adminId, updateData) {
        return await Admin.findOneAndUpdate({ adminId }, updateData, {
            new: true,
        }).populate('adminId');
    }

    // Delete
    async deleteById(id) {
        return await Admin.findByIdAndDelete(id);
    }

    async deleteByAdminId(adminId) {
        return await Admin.findOneAndDelete({ adminId });
    }

    // Count
    async count() {
        return await Admin.countDocuments();
    }
}

module.exports = new AdminRepository();
