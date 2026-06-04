const UserRepository = require('../repositories/UserRepository');

class UserService {
    async create(userData) {
        return await UserRepository.create(userData);
    }

    async findById(id) {
        return await UserRepository.findById(id);
    }

    async findByUsername(username) {
        return await UserRepository.findByUsername(username);
    }

    async findByEmail(email) {
        return await UserRepository.findByEmail(email);
    }

    async findAll(filter = {}, limit = 10, skip = 0) {
        return await UserRepository.findAll(filter, limit, skip);
    }

    async findByRole(role) {
        return await UserRepository.findByRole(role);
    }

    async updateById(id, updateData) {
        return await UserRepository.updateById(id, updateData);
    }

    async updateByUsername(username, updateData) {
        return await UserRepository.updateByUsername(username, updateData);
    }

    async deleteById(id) {
        return await UserRepository.deleteById(id);
    }

    async deleteByUsername(username) {
        return await UserRepository.deleteByUsername(username);
    }

    async count(filter = {}) {
        return await UserRepository.count(filter);
    }

    async exists(username) {
        return await UserRepository.exists(username);
    }
}

module.exports = new UserService();
