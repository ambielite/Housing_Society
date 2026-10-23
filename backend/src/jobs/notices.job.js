const cron = require('node-cron');
const noticesService = require('../modules/notices/notices.service');

const processNotices = async () => {
  try {
    const result = await noticesService.processSchedule();
    if (Number(result?.published_count) || Number(result?.expired_count)) {
      console.log(`Notice schedule processed: ${result.published_count} published, ${result.expired_count} expired`);
    }
  } catch (error) {
    console.error('Notice schedule processing failed:', error.message);
  }
};

const startNoticesJob = () => {
  void processNotices();
  cron.schedule('* * * * *', processNotices);
  console.log('Notice scheduler started');
};

module.exports = { startNoticesJob, processNotices };
