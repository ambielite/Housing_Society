const sequelize = require("./database");

// Schema changes are applied explicitly with npm run db:migrate.
const initializeDatabase = async () => {
    await sequelize.authenticate();
    console.log("PostgreSQL connected; schema managed by SQL migrations");
};
module.exports = initializeDatabase;
