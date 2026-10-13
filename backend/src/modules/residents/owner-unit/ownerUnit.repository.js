const { Op } = require("sequelize");

const OwnerUnit = require("./ownerUnit.model");


// CREATE
const create = async (data) => {

    return await OwnerUnit.create(data);
};


// FIND BY ID
const findById = async (id) => {

    return await OwnerUnit.findByPk(id);
};


// FIND ALL
const findAll = async (where = {}) => {

    return await OwnerUnit.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};


// FIND OWNER-UNIT RELATION
const findRelation = async (
    societyId,
    ownerId,
    unitId
) => {

    return await OwnerUnit.findOne({
        where: {
            societyId,
            ownerId,
            unitId,
            status: "ACTIVE"
        }
    });
};


// FIND PRIMARY OWNER
const findPrimaryOwner = async (
    societyId,
    unitId
) => {

    return await OwnerUnit.findOne({
        where: {
            societyId,
            unitId,
            ownershipType: "PRIMARY_OWNER",
            status: "ACTIVE"
        }
    });
};


// FIND ACTIVE RELATIONS FOR UNIT
const findActiveUnitOwners = async (
    societyId,
    unitId
) => {

    return await OwnerUnit.findAll({
        where: {
            societyId,
            unitId,
            status: "ACTIVE"
        },
        order: [
            ["ownershipType", "ASC"],
            ["effective_from", "ASC"]
        ]
    });
};


// FIND OWNER'S UNITS
const findOwnerUnits = async (
    societyId,
    ownerId
) => {

    return await OwnerUnit.findAll({
        where: {
            societyId,
            ownerId
        },
        order: [
            ["effective_from", "DESC"]
        ]
    });
};


// FIND OVERLAPPING RELATION
const findOverlappingRelation = async (
    societyId,
    ownerId,
    unitId,
    effectiveFrom,
    effectiveTo,
    excludeId = null
) => {

    const where = {
        societyId,
        ownerId,
        unitId,
        status: "ACTIVE",

        effectiveFrom: {
            [Op.lte]: effectiveTo || "9999-12-31"
        },

        [Op.or]: [
            {
                effectiveTo: null
            },
            {
                effectiveTo: {
                    [Op.gte]: effectiveFrom
                }
            }
        ]
    };

    if (excludeId) {
        where.id = {
            [Op.ne]: excludeId
        };
    }

    return await OwnerUnit.findOne({
        where
    });
};


// UPDATE
const update = async (
    ownerUnit,
    data
) => {

    await ownerUnit.update(data);

    return ownerUnit;
};


// DELETE
const deleteOwnerUnit = async (
    ownerUnit
) => {

    await ownerUnit.destroy();

    return true;
};


module.exports = {
    create,
    findById,
    findAll,
    findRelation,
    findPrimaryOwner,
    findActiveUnitOwners,
    findOwnerUnits,
    findOverlappingRelation,
    update,
    deleteOwnerUnit
};