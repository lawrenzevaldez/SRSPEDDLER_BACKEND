"use strict";

const { Ignitor } = require("@adonisjs/ignitor");

new Ignitor(require("@adonisjs/fold"))
  .appRoot(__dirname)
  .fireHttpServer(false)
  .then(async () => {
    const CronScheduler = use("App/Tasks/PeddlerCustomers");
    console.log("✅ Cron Runner started...");

    // Run every 60 seconds
    setInterval(async () => {
      try {
        await CronScheduler.run();
      } catch (error) {
        console.error("❌ Cron job error:", error);
      }
    }, 60 * 1000);
  })
  .catch(console.error);
