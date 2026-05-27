const User = require('../entities/User');

class UserRepository {
    // Create
    async create(userData) {
        const user = new User(userData);
        return await user.save();
    }

    // Read
    async findById(id) {
        return await User.findById(id);
    }

    async findByUsername(username) {
        return await User.findOne({ username });
    }

    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async findAll(filter = {}, limit = 10, skip = 0) {
        return await User.find(filter).limit(limit).skip(skip);
    }

    async findByRole(role) {
        return await User.find({ role });
    }

    // Update
    async updateById(id, updateData) {
        return await User.findByIdAndUpdate(id, updateData, { new: true });
    }

    async updateByUsername(username, updateData) {
        return await User.findOneAndUpdate({ username }, updateData, { new: true });
    }

    // Delete
    async deleteById(id) {
        return await User.findByIdAndDelete(id);
    }

    async deleteByUsername(username) {
        return await User.findOneAndDelete({ username });
    }

    // Count
    async count(filter = {}) {
        return await User.countDocuments(filter);
    }

    // Exists
    async exists(username) {
        return await User.exists({ username });
    }
}

module.exports = new UserRepository();
