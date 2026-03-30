"use strict";

const ServicesMod = use("App/Models/Services");

class PeddlerCustomers {
  static async run() {
    console.log("[CRON] Peddler Customer Running jobs...");

    await this.syncCustomers();
  }

  static async syncCustomers() {
    console.log("[CRON] Syncing peddler...");
    await ServicesMod.syncToMssql();
    console.log("[CRON] Peddler sync done");
  }
}

module.exports = PeddlerCustomers;
