"use strict";

/*
|--------------------------------------------------------------------------
| Http server
|--------------------------------------------------------------------------
|
| This file bootstrap Adonisjs to start the HTTP server. You are free to
| customize the process of booting the http server.
|
| """ Loading ace commands """
|     At times you may want to load ace commands when starting the HTTP server.
|     Same can be done by chaining `loadCommands()` method after
|
| """ Preloading files """
|     Also you can preload files by calling `preLoad('path/to/file')` method.
|     Make sure to pass relative path from the project root.
*/

const { Ignitor } = require("@adonisjs/ignitor");

new Ignitor(require("@adonisjs/fold"))
  .appRoot(__dirname)
  .fireHttpServer()
  .then(async () => {
    const CronScheduler = use("App/Tasks/PeddlerCustomers");
    const WebsiteScheduler = use("App/Tasks/SyncCustomers");
    console.log("✅ Cron Runner started...");

    // Run every 60 seconds
    setInterval(async () => {
      try {
        await CronScheduler.run();
      } catch (error) {
        console.error("❌ PeddlerScheduler error:", error);
      }

      try {
        await WebsiteScheduler.run();
      } catch (error) {
        console.error("❌ WebsiteScheduler error:", error);
      }
    }, 60 * 1000);
  })
  .catch(console.error);
