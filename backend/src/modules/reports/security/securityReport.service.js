const { Op, fn, col, literal } = require("sequelize");

const Staff = require("../../../modules/security/staff/staff.model");
const StaffAttendance = require("../../../modules/security/staff-attendance/staffAttendance.model");
const StaffTask = require("../../../modules/security/staff-task/staffTask.model");

const Patrol = require("../../../modules/security/patrol/patrol.model");
const PatrolCheckpoint = require("../../../modules/security/patrol/patrolCheckpoint.model");
const reportsCenterService = require("../../reports-center/reports-center.service");


const getDateFilter = (fromDate, toDate) => {
    if (fromDate && toDate) return { [Op.between]: [fromDate, toDate] };
    if (fromDate) return { [Op.gte]: fromDate };
    if (toDate) return { [Op.lte]: toDate };
    return undefined;
};


/*
|--------------------------------------------------------------------------
| STAFF SUMMARY
|--------------------------------------------------------------------------
*/

const getStaffSummary = async ({
    societyId,
    fromDate,
    toDate
}) => {

    const totalStaff = await Staff.count({
        where: {
            societyId
        }
    });

    const activeStaff = await Staff.count({
        where: {
            societyId,
            status: "ACTIVE"
        }
    });

    const inactiveStaff = await Staff.count({
        where: {
            societyId,
            status: "INACTIVE"
        }
    });

    const onLeaveStaff = await Staff.count({
        where: {
            societyId,
            status: "ON_LEAVE"
        }
    });


    const attendanceRecords =
        await StaffAttendance.findAll({
            where: {
                ...(getDateFilter(fromDate, toDate)
                    ? { attendanceDate: getDateFilter(fromDate, toDate) }
                    : {})
            },
            include: [
                {
                    model: Staff,
                    as: "staff",
                    attributes: [
                        "id",
                        "employeeCode",
                        "firstName",
                        "lastName",
                        "staffType",
                        "designation"
                    ],
                    where: {
                        societyId
                    },
                    required: true
                }
            ],
            order: [
                ["attendanceDate", "DESC"]
            ]
        });


    const attendanceSummary = {};

    attendanceRecords.forEach(record => {

        const status = record.status;

        if (!attendanceSummary[status]) {
            attendanceSummary[status] = 0;
        }

        attendanceSummary[status]++;
    });


    return {

        period: {
            fromDate,
            toDate
        },

        staff: {
            total: totalStaff,
            active: activeStaff,
            inactive: inactiveStaff,
            onLeave: onLeaveStaff
        },

        attendance: {
            totalRecords: attendanceRecords.length,
            statusSummary: attendanceSummary
        },

        records: attendanceRecords
    };
};

/*
|--------------------------------------------------------------------------
| PATROL SUMMARY
|--------------------------------------------------------------------------
*/

const getPatrolSummary = async ({
    societyId,
    fromDate,
    toDate
}) => {

    try {

        const patrols = await Patrol.findAll({

            where: {
                societyId,
                ...(getDateFilter(fromDate, toDate)
                    ? { patrolDate: getDateFilter(fromDate, toDate) }
                    : {})
            },

            include: [

                /*
                |----------------------------------------------------------
                | Patrol → Staff
                |----------------------------------------------------------
                */

                {
                    model: Staff,
                    as: "staff",
                    attributes: [
                        "id",
                        "employeeCode",
                        "firstName",
                        "lastName",
                        "staffType",
                        "designation"
                    ],
                    required: false
                },


                /*
                |----------------------------------------------------------
                | Patrol → Patrol Checkpoints
                |----------------------------------------------------------
                */

                {
                    model: PatrolCheckpoint,
                    as: "checkpoints",
                    attributes: [
                        "id",
                        "checkpointId",
                        "sequenceOrder",
                        "status",
                        "verificationMethod",
                        "verifiedAt",
                        "remarks"
                    ],
                    required: false
                }

            ],

            order: [
                ["patrolDate", "DESC"]
            ]

        });


        /*
        |--------------------------------------------------------------
        | PATROL STATUS SUMMARY
        |--------------------------------------------------------------
        */

        const patrolSummary = {

            total: patrols.length,

            scheduled: 0,

            inProgress: 0,

            completed: 0,

            missed: 0,

            cancelled: 0

        };


        /*
        |--------------------------------------------------------------
        | CHECKPOINT SUMMARY
        |--------------------------------------------------------------
        */

        let totalCheckpoints = 0;

        let completedCheckpoints = 0;

        let missedCheckpoints = 0;


        /*
        |--------------------------------------------------------------
        | PROCESS PATROLS
        |--------------------------------------------------------------
        */

        patrols.forEach((patrol) => {


            /*
            | Count patrol status
            */

            switch (patrol.status) {

                case "SCHEDULED":

                    patrolSummary.scheduled++;

                    break;


                case "IN_PROGRESS":

                    patrolSummary.inProgress++;

                    break;


                case "COMPLETED":

                    patrolSummary.completed++;

                    break;


                case "MISSED":

                    patrolSummary.missed++;

                    break;


                case "CANCELLED":

                    patrolSummary.cancelled++;

                    break;

            }


            /*
            | Count checkpoints
            */

            totalCheckpoints +=
                patrol.totalCheckpoints || 0;


            completedCheckpoints +=
                patrol.completedCheckpoints || 0;


            missedCheckpoints +=
                patrol.missedCheckpoints || 0;

        });


        /*
        |--------------------------------------------------------------
        | RETURN REPORT
        |--------------------------------------------------------------
        */

        return {

            period: {

                fromDate,

                toDate

            },


            patrols: patrolSummary,


            checkpoints: {

                total: totalCheckpoints,

                completed: completedCheckpoints,

                missed: missedCheckpoints

            },


            records: patrols

        };

    } catch (error) {

        throw error;

    }

};

/*
|--------------------------------------------------------------------------
| VISITOR SUMMARY
|--------------------------------------------------------------------------
*/

const getVisitorSummary = async ({ societyId, fromDate, toDate, includeRows = true, limit = 500 }) => {
    return reportsCenterService.getVisitorReport({ societyId, fromDate, toDate, includeRows, limit });
};


/*
|--------------------------------------------------------------------------
| GATE SUMMARY
|--------------------------------------------------------------------------
*/

const getGateSummary = async ({ societyId, fromDate, toDate, includeRows = true, limit = 500 }) => {
    return reportsCenterService.getGateActivityReport({ societyId, fromDate, toDate, includeRows, limit });
};


module.exports = {
    getVisitorSummary,
    getGateSummary,
    getStaffSummary,
    getPatrolSummary,
    
};
