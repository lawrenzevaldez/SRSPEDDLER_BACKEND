"use strict";

const ServicesMod = use("App/Models/Services");

class SyncCustomers {
  static async run() {
    console.log("[CRON] Website Customer Running jobs...");

    await this.syncWordpressUsers();
  }

  static async syncWordpressUsers() {
    console.log("[CRON] Syncing customers...");
    await ServicesMod.syncWordpressUsers();
    console.log("[CRON] Customers sync done");
  }
}

module.exports = SyncCustomers;
