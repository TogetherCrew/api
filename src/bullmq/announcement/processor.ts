import { Job } from 'bullmq';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const jobProcessor = async (job: Job) => {
    await job.log(`Started processing job with id ${job.id} and name ${job.name}}`);
  
    // ! This is just a dummy example. Replace this with your own logic. with a function that manage the announcement scheduling

    await job.updateProgress(100);
    return 'DONE';
};

export default jobProcessor;
