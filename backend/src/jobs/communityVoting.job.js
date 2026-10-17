const cron = require("node-cron");
const service = require("../modules/community/voting/voting.service");

const processVotingWindows = async () => {
    try { await service.processVotingWindows(); }
    catch (error) { console.error("Community voting schedule processing failed:", error.message); }
};

const startCommunityVotingJob = () => {
    cron.schedule("* * * * *", processVotingWindows);
    processVotingWindows();
};

module.exports = { startCommunityVotingJob, processVotingWindows };
