const BUSINESS_TIME_ZONE = process.env.SOCIETY_BUSINESS_TIME_ZONE || "Asia/Kolkata";

const getSocietyBusinessDate = (instant = new Date(), timeZone = BUSINESS_TIME_ZONE) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(instant);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
};

module.exports = { BUSINESS_TIME_ZONE, getSocietyBusinessDate };
