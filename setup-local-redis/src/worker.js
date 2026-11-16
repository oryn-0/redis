import { Worker } from "bullmq";
import { connection, emailQueue } from "./queue.js";

const worker = new Worker(
    emailQueue,
    async (job) => {
        console.log("Printing about the job ... ",job.id," ",job.data," ",job.name,"\n",job,);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log("Promise Resolved");
    },
    { connection },
);

worker.on("completed", () => {
    console.log("job completed...........", job.id, job.name, job.data);
});
worker.on("failed", () => {
    console.log("job failed......", job.id, job.name, job.data);
});
