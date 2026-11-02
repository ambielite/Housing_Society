const Resident = require("./resident.model");
const sequelize = require("../../../config/database");
const { QueryTypes } = require("sequelize");

const create = async (data, options = {}) => {

    return await Resident.create(data, options);
};

const listResidentRoleUsers = async ({ societyId, userId, transaction } = {}) => {
    const userFilter = userId ? "AND u.id = :userId" : "";
    return sequelize.query(
        `SELECT u.id, u.email, u.phone, u.first_name, u.last_name,
                r.id AS resident_role_id
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE u.status = 'ACTIVE'
           AND r.code = 'RESIDENT_APP'
           AND r.status = 'ACTIVE'
           AND (ur.society_id = :societyId OR ur.society_id IS NULL)
           AND (
             u.society_id = :societyId
             OR EXISTS (
               SELECT 1 FROM user_society_access usa
               WHERE usa.user_id = u.id AND usa.society_id = :societyId
                 AND usa.active_from <= now()
                 AND (usa.active_until IS NULL OR usa.active_until > now())
             )
           )
           AND NOT EXISTS (
             SELECT 1
             FROM user_roles other_ur
             JOIN roles other_role ON other_role.id = other_ur.role_id
             WHERE other_ur.user_id = u.id
               AND other_role.code <> 'RESIDENT_APP'
               AND (other_ur.society_id = :societyId OR other_ur.society_id IS NULL)
           )
           AND NOT EXISTS (
             SELECT 1 FROM residents linked
             WHERE linked.society_id = :societyId AND linked.user_id = u.id
           )
           ${userFilter}
         ORDER BY u.first_name, u.last_name, u.email`,
        {
            replacements: { societyId, ...(userId ? { userId } : {}) },
            type: QueryTypes.SELECT,
            transaction
        }
    );
};


const findById = async (id) => {

    return await Resident.findByPk(id);
};


const findByIdAndSociety = async (id, societyId) => {

    return await Resident.findOne({
        where: {
            id,
            societyId
        }
    });
};


const findByMobile = async (societyId, mobile) => {

    return await Resident.findOne({
        where: {
            societyId,
            mobile
        }
    });
};


const findByEmail = async (societyId, email) => {
    const { Op } = require("sequelize");

    return await Resident.findOne({
        where: {
            societyId,
            email: { [Op.iLike]: String(email).trim() }
        }
    });
};


const findAll = async (where = {}) => {

    return await Resident.findAll({
        where,
        order: [
            ["createdAt", "DESC"]
        ]
    });
};


const update = async (resident, data) => {

    await resident.update(data);

    return resident;
};


const deleteResident = async (resident) => {

    await resident.destroy();

    return true;
};


module.exports = {
    create,
    listResidentRoleUsers,
    findById,
    findByIdAndSociety,
    findByMobile,
    findByEmail,
    findAll,
    update,
    deleteResident
};
