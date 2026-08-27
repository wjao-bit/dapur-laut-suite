import { cronJobs } from "convex/server";

// Cron dinonaktifkan untuk menghemat bandwidth
const crons = cronJobs();

export default crons;
