"use strict";

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use("Env");

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use("Helpers");

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Default Connection
  |--------------------------------------------------------------------------
  |
  | Connection defines the default connection settings to be used while
  | interacting with SQL databases.
  |
  */
  connection: Env.get("DB_CONNECTION", "sqlite"),

  /*
  |--------------------------------------------------------------------------
  | Sqlite
  |--------------------------------------------------------------------------
  |
  | Sqlite is a flat file database and can be good choice under development
  | environment.
  |
  | npm i --save sqlite3
  |
  */
  sqlite: {
    client: "sqlite3",
    connection: {
      filename: Helpers.databasePath(
        `${Env.get("DB_DATABASE", "development")}.sqlite`,
      ),
    },
    useNullAsDefault: true,
  },

  /*
  |--------------------------------------------------------------------------
  | MySQL
  |--------------------------------------------------------------------------
  |
  | Here we define connection settings for MySQL database.
  |
  | npm i --save mysql
  |
  */
  mysql: {
    client: "mysql",
    connection: {
      host: Env.get("DB_HOST", "localhost"),
      port: Env.get("DB_PORT", ""),
      user: Env.get("DB_USER", "root"),
      password: Env.get("DB_PASSWORD", ""),
      database: Env.get("DB_DATABASE", "adonis"),
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
    },
  },

  /*
  |--------------------------------------------------------------------------
  | PostgreSQL
  |--------------------------------------------------------------------------
  |
  | Here we define connection settings for PostgreSQL database.
  |
  | npm i --save pg
  |
  */
  pg: {
    client: "pg",
    connection: {
      host: Env.get("DB_HOST", "localhost"),
      port: Env.get("DB_PORT", ""),
      user: Env.get("DB_USER", "root"),
      password: Env.get("DB_PASSWORD", ""),
      database: Env.get("DB_DATABASE", "adonis"),
    },
  },
  online_mysql: {
    client: "mysql",
    prefix: Env.get("ONLINE_DB_PREFIX", ""),
    connection: {
      host: Env.get("ONLINE_DB_HOST", "localhost"),
      port: Env.get("ONLINE_DB_PORT", ""),
      user: Env.get("ONLINE_DB_USER", "root"),
      password: Env.get("ONLINE_DB_PASSWORD", ""),
      database: Env.get("ONLINE_DB_DATABASE", "adonis"),
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
    },
  },

  mysql_srspos: {
    client: "mysql",
    connection: {
      host: Env.get("SRSPOSMYDB_HOST", "localhost"),
      port: Env.get("SRSPOSMYDB_PORT", ""),
      user: Env.get("SRSPOSMYDB_USER", "root"),
      password: Env.get("SRSPOSMYDB_PASSWORD", ""),
      database: Env.get("SRSPOSMYDB_DATABASE", "adonis"),
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
    },
  },

  mssql_srspos: {
    client: "mssql",
    connection: {
      host: Env.get("SRSPOSMSDB_HOST", "localhost"),
      user: Env.get("SRSPOSMSDB_USER", "root"),
      password: Env.get("SRSPOSMSDB_PASSWORD", ""),
      database: Env.get("SRSPOSMSDB_DATABASE", "adonis"),
      requestTimeout: 150000,
      connectionTimeout: 150000,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
    },
  },

  //FOR PRODUCT BATCH UPLOAD ONLY
  mssql: {
    client: "mssql",
    connection: {
      host: Env.get("MSDB_HOST", "localhost"),
      user: Env.get("MSDB_USER", "root"),
      password: Env.get("MSDB_PASSWORD", ""),
      database: Env.get("MSDB_DATABASE", "adonis"),
    },
    debug: false,
  },

  mysql91: {
    client: "mysql",
    connection: {
      host: Env.get("91DB_HOST", "localhost"),
      port: Env.get("91DB_PORT", ""),
      user: Env.get("91DB_USER", "root"),
      password: Env.get("91DB_PASSWORD", ""),
      database: Env.get("91DB_DATABASE", "adonis"),
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
    },
  },
  // ./FOR PRODUCT BATCH UPLOAD ONLY
};
