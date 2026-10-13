const {
    validate: validateUUID
} = require("uuid");


// ============================================================
// VALIDATE CLUSTER ID
// ============================================================

const validateClusterId = (clusterId) => {

    if (!clusterId) {
        return [
            "clusterId is required"
        ];
    }

    if (!validateUUID(clusterId)) {

        return [
            "Invalid clusterId"
        ];
    }

    return [];
};


module.exports = {
    validateClusterId
};