const { Op } = require("sequelize");
const reportsCenterService = require("../../reports-center/reports-center.service");

const Society =
    require("../../../modules/societies/society/society.model");

const Unit =
    require("../../../modules/societies/unit/unit.model");

const Floor =
    require("../../../modules/societies/floor/floor.model");

const Tower =
    require("../../../modules/societies/tower/tower.model");

const Resident =
    require("../../../modules/residents/resident/resident.model");

const OwnerUnit =
    require("../../../modules/residents/owner-unit/ownerUnit.model");

const {
    validateSocietyId,
    validateDateRange
} = require("./operationsReport.validation");


/*
|--------------------------------------------------------------------------
| Society Validation
|--------------------------------------------------------------------------
*/

const validateSociety = async (societyId) => {

    const society =
        await Society.findByPk(societyId);

    if (!society) {
        throw new Error("Society not found");
    }

    return society;
};


/*
|--------------------------------------------------------------------------
| 1. Occupancy Report
|--------------------------------------------------------------------------
*/

const getOccupancyReport = async ({
    societyId
}) => {

    validateSocietyId(societyId);

    await validateSociety(societyId);


    /*
     * Unit -> Floor -> Tower
     *
     * We already have these associations:
     *
     * Unit.belongsTo(Floor, { as: "floor" })
     * Floor.belongsTo(Tower, { as: "tower" })
     */

    const units =
        await Unit.findAll({

            attributes: [
                "id",
                "unitNumber",
                "propertyType",
                "status"
            ],

            include: [
                {
                    model: Floor,
                    as: "floor",

                    attributes: [
                        "id",
                        "floorNumber"
                    ],

                    required: true,

                    include: [
                        {
                            model: Tower,
                            as: "tower",

                            attributes: [
                                "id",
                                "name"
                            ],

                            where: {
                                societyId
                            },

                            required: true
                        }
                    ]
                }
            ],

            order: [
                [
                    "unitNumber",
                    "ASC"
                ]
            ]
        });


    let totalUnits = 0;
    let occupiedUnits = 0;
    let vacantUnits = 0;
    let underMoveInUnits = 0;
    let underMoveOutUnits = 0;
    let inactiveUnits = 0;


    const byPropertyType = {};


    for (const unit of units) {

        totalUnits++;


        switch (unit.status) {

            case "OCCUPIED":
                occupiedUnits++;
                break;

            case "VACANT":
                vacantUnits++;
                break;

            case "UNDER_MOVE_IN":
                underMoveInUnits++;
                break;

            case "UNDER_MOVE_OUT":
                underMoveOutUnits++;
                break;

            case "INACTIVE":
                inactiveUnits++;
                break;
        }


        const propertyType =
            unit.propertyType || "UNKNOWN";


        if (!byPropertyType[propertyType]) {

            byPropertyType[propertyType] = {
                total: 0,
                occupied: 0,
                vacant: 0
            };
        }


        byPropertyType[propertyType].total++;


        if (
            unit.status ===
            "OCCUPIED"
        ) {
            byPropertyType[propertyType]
                .occupied++;
        }


        if (
            unit.status ===
            "VACANT"
        ) {
            byPropertyType[propertyType]
                .vacant++;
        }
    }


    const occupancyPercentage =
        totalUnits > 0
            ? (
                occupiedUnits /
                totalUnits
            ) * 100
            : 0;


    return {

        totalUnits,

        occupiedUnits,

        vacantUnits,

        underMoveInUnits,

        underMoveOutUnits,

        inactiveUnits,

        occupancyPercentage:
            Number(
                occupancyPercentage.toFixed(2)
            ),

        vacancyPercentage:
            Number(
                (
                    totalUnits > 0
                        ? (
                            vacantUnits /
                            totalUnits
                        ) * 100
                        : 0
                ).toFixed(2)
            ),

        byPropertyType
    };
};


/*
|--------------------------------------------------------------------------
| 2. Resident Report
|--------------------------------------------------------------------------
*/

const getResidentReport = async ({
    societyId
}) => {

    validateSocietyId(societyId);

    await validateSociety(societyId);


    const residents = await Resident.findAll({
        where: { societyId },
        attributes: ["role", "status"],
        raw: true
    });

    const roleBreakdown = {};
    const statusBreakdown = {};
    residents.forEach(({ role, status }) => {
        roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    const activeOwnerRelations = await OwnerUnit.findAll({
        where: { societyId, status: "ACTIVE" },
        attributes: ["ownerId"],
        raw: true
    });

    return {
        available: true,
        totalResidents: residents.filter((resident) => resident.status !== "ARCHIVED").length,
        totalResidentRecords: residents.length,
        activeResidents: statusBreakdown.ACTIVE || 0,
        pendingResidents: statusBreakdown.PENDING || 0,
        suspendedResidents: statusBreakdown.SUSPENDED || 0,
        archivedResidents: statusBreakdown.ARCHIVED || 0,
        owners: (roleBreakdown.PRIMARY_OWNER || 0) + (roleBreakdown.CO_OWNER || 0),
        tenants: roleBreakdown.TENANT || 0,
        familyMembers: roleBreakdown.FAMILY_MEMBER || 0,
        propertyManagers: roleBreakdown.PROPERTY_MANAGER || 0,
        ownersWithActiveUnits: new Set(activeOwnerRelations.map((relation) => relation.ownerId)).size,
        activeOwnerUnitRelations: activeOwnerRelations.length,
        roleBreakdown,
        statusBreakdown
    };
};


/*
|--------------------------------------------------------------------------
| 3. Vehicle Report
|--------------------------------------------------------------------------
*/

const getVehicleReport = async ({ societyId, includeRows = true, limit = 500 }) => {

    validateSocietyId(societyId);

    await validateSociety(societyId);


    return reportsCenterService.getVehicleReport({ societyId, includeRows, limit });
};


/*
|--------------------------------------------------------------------------
| 4. Parking Report
|--------------------------------------------------------------------------
*/

const getParkingReport = async ({ societyId, fromDate, toDate, includeRows = true, limit = 500 }) => {

    validateSocietyId(societyId);

    await validateSociety(societyId);


    return reportsCenterService.getParkingReport({ societyId, fromDate, toDate, includeRows, limit });
};


/*
|--------------------------------------------------------------------------
| 5. Complete Operations Dashboard
|--------------------------------------------------------------------------
*/

const getOperationsDashboard = async ({
    societyId,
    fromDate,
    toDate
}) => {

    validateSocietyId(societyId);

    validateDateRange(
        fromDate,
        toDate
    );


    const [
        occupancy,
        residents,
        vehicles,
        parking
    ] = await Promise.all([

        getOccupancyReport({
            societyId
        }),

        getResidentReport({
            societyId
        }),

        getVehicleReport({
            societyId
        }),

        getParkingReport({
            societyId,
            fromDate,
            toDate
        })

    ]);


    return {

        societyId,

        period: {

            fromDate:
                fromDate || null,

            toDate:
                toDate || null
        },

        occupancy,

        residents,

        vehicles,

        parking
    };
};


module.exports = {

    getOccupancyReport,

    getResidentReport,

    getVehicleReport,

    getParkingReport,

    getOperationsDashboard

};
