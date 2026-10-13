
const CommunityGovernanceMeeting =
    require("./governanceMeeting.model");


const create = async (data) => {

    return await CommunityGovernanceMeeting.create(data);

};


const findAll = async (where = {}) => {

    return await CommunityGovernanceMeeting.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });

};


const findById = async (id) => {

    return await CommunityGovernanceMeeting.findByPk(id);

};


const findOne = async (where) => {

    return await CommunityGovernanceMeeting.findOne({
        where
    });

};


const update = async (governanceMeeting, data) => {

    return await governanceMeeting.update(data);

};


const deleteGovernanceMeeting = async (governanceMeeting) => {

    return await governanceMeeting.destroy();

};


module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteGovernanceMeeting
};

