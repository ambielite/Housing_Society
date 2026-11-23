const cron = require("node-cron");
const sequelize = require("../config/database");

const completeExpiredRosters = async () => {
    const [, metadata] = await sequelize.query(
        `UPDATE staff_rosters AS roster
            SET status = 'COMPLETED', updated_at = now()
           FROM shifts AS shift, societies AS society
          WHERE roster.shift_id = shift.id
            AND roster.society_id = society.id
            AND shift.society_id = society.id
            AND roster.status IN ('SCHEDULED', 'CONFIRMED')
            AND roster.roster_end_date IS NOT NULL
            AND now() >= ((roster.roster_end_date + shift.end_time +
                CASE WHEN shift.is_overnight OR shift.end_time <= shift.start_time
                     THEN interval '1 day' ELSE interval '0 day' END)
                AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata'))`
    );
    return metadata?.rowCount || 0;
};

const startStaffRosterCompletionJob = () => {
    cron.schedule("* * * * *", () => {
        completeExpiredRosters().catch((error) => {
            console.error("Staff roster completion job failed:", error.message);
        });
    });
    console.log("Staff roster completion job started");
};

module.exports = { startStaffRosterCompletionJob, completeExpiredRosters };
