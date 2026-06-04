const CertificationService = require('../services/CertificationService');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const RefereeRepository = require('../repositories/RefereeRepository');

class CertificationController {
    // Unified certification upload for any user
    async uploadCertification(req, res) {
        const { id } = req.params;
        
        // Get user to determine role
        const UserRepository = require('../repositories/UserRepository');
        const user = await UserRepository.findById(id);
        
        if (!user) {
            return res.status(404).json({
                code: 404,
                msg: 'User not found',
            });
        }

        // Check if user role is allowed to upload certifications
        if (!['horseowner', 'jockey', 'referee'].includes(user.role)) {
            return res.status(403).json({
                code: 403,
                msg: 'Only horse owners, jockeys, and referees can upload certifications',
            });
        }

        let fileType = 'certificate';
        let repository = null;
        
        if (user.role === 'horseowner') {
            fileType = 'horseowner_certificate';
            repository = HorseOwnerRepository;
        } else if (user.role === 'jockey') {
            fileType = 'jockey_certificate';
            repository = JockeyRepository;
        } else if (user.role === 'referee') {
            fileType = 'referee_certificate';
            repository = RefereeRepository;
        }

        const response = await CertificationService.saveCertification(
            req.file,
            id,
            fileType,
            req.body
        );

        // If save was successful, update the license_link in the respective entity
        if (response.code === 201 && repository) {
            let record = null;
            
            if (user.role === 'horseowner') {
                record = await repository.findByOwnerId(id);
            } else if (user.role === 'jockey') {
                record = await repository.findByJockeyId(id);
            } else if (user.role === 'referee') {
                record = await repository.findByRefereeId(id);
            }
            
            if (record) {
                await repository.updateById(record._id, {
                    license_link: response.data.filepath,
                });
            }
        }

        return res.status(response.code).json(response);
    }

    // Get certification file
    async getCertification(req, res) {
        const response = await CertificationService.getCertification(req.params.filename);

        if (response.code !== 200) {
            return res.status(response.code).json(response);
        }

        // Download the file
        const filePath = response.data.filePath;
        return res.download(filePath);
    }
}

module.exports = new CertificationController();
