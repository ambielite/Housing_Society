const cron = require("node-cron");
const { Op } = require("sequelize");
const MoveOut = require("../modules/move-InOut/move-out/moveOut.model");
const { processEffectiveMoveOut, getCurrentDateOnly } = require("../modules/move-InOut/move-out/moveOutEffectiveProcessor.service");

const processEffectiveMoveOuts = async () => {
    const today = getCurrentDateOnly();
    const dueMoveOuts = await MoveOut.findAll({
        where: {
            status: "MOVE_OUT_PASS_ISSUED",
            [Op.or]: [
                { effectiveMoveOutDate: { [Op.lte]: today } },
                { effectiveMoveOutDate: null, requestedMoveOutDate: { [Op.lte]: today } }
            ]
        }
    });

    for (const moveOut of dueMoveOuts) {
        await processEffectiveMoveOut(moveOut.id, {
            processingDate: today,
            comparisonDate: today,
            scheduled: true,
            setActualMoveOutDate: true
        });
    }
};

const startMoveOutEffectiveDateJob = () => cron.schedule("5 0 * * *", () => processEffectiveMoveOuts().catch((error) => console.error("Move-out effective-date job failed:", error.message)));

module.exports = { startMoveOutEffectiveDateJob, processEffectiveMoveOuts };
