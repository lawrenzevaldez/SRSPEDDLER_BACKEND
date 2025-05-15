'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use('Helpers')

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
  connection: Env.get('DB_CONNECTION', 'sqlite'),

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
    client: 'sqlite3',
    connection: {
      filename: Helpers.databasePath(`${Env.get('DB_DATABASE', 'development')}.sqlite`)
    },
    useNullAsDefault: true
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
    client: 'mysql',
    connection: {
      host: Env.get('DB_HOST', 'localhost'),
      port: Env.get('DB_PORT', ''),
      user: Env.get('DB_USER', 'root'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis')
    }
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
    client: 'pg',
    connection: {
      host: Env.get('DB_HOST', 'localhost'),
      port: Env.get('DB_PORT', ''),
      user: Env.get('DB_USER', 'root'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis')
    }
  },
  online_mysql: {
    client: 'mysql',
    prefix: Env.get('ONLINE_DB_PREFIX', ''),
    connection: {
      host: Env.get('ONLINE_DB_HOST', 'localhost'),
      port: Env.get('ONLINE_DB_PORT', ''),
      user: Env.get('ONLINE_DB_USER', 'root'),
      password: Env.get('ONLINE_DB_PASSWORD', ''),
      database: Env.get('ONLINE_DB_DATABASE', 'adonis')
    }
  },

  //MSSQL BRANCH DATABASE
  SRSMNOVA: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMNOVA_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMIMU: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMIMU_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMNAVO: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMNAVO_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMTON: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMTON_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMCAMA: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMCAMA_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMANT1GF: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMANT1GF_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMANT2EM: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMANT2EM_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMMALA: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMMALA_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMGAL: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMGAL_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMCAINTA: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMCAINTA_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMVAL: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMVAL_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMBSL: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMBSL_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMPUN: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMPUN_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMPAT: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMPAT_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMKUM: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMKUM_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMCAINTA2: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMCAINTA2_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMPEDRO: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMPEDRO_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMPINAS: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMPINAS_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMALAM: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMALAM_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMBAG: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMBAG_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMMUZ: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMMUZ_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMMOL: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMMOL_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMANGA: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMANGA_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMMONTB: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMMONTB_DATABASE', 'adonis')
    },
    debug: false
  },
  SAGORA: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SAGORA_DATABASE', 'adonis')
    },
    debug: false
  },
  SMARILAO: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SMARILAO_DATABASE', 'adonis')
    },
    debug: false
  },
  SMARILAO2: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SMARILAO2_DATABASE', 'adonis')
    },
    debug: false
  },
  SRSMBSL2: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SRSMBSL2_DATABASE', 'adonis')
    },
    debug: false
  },
  ISIDRO: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('ISIDRO_DATABASE', 'adonis')
    },
    debug: false
  },
  SSTAMARIA: {
    client: 'mssql',
    connection: {
      host: Env.get('MS133DB_HOST', 'localhost'),
      user: Env.get('MS133DB_USER', 'root'),
      password: Env.get('MS133DB_PASSWORD', ''),
      database: Env.get('SSTAMARIA_DATABASE', 'adonis')
    },
    debug: false
  },
  // ./MSSQL BRANCH DATABASE

  //FOR PRODUCT BATCH UPLOAD ONLY
  mssql: {
    client: 'mssql',
    connection: {
      host: Env.get('MSDB_HOST', 'localhost'),
      user: Env.get('MSDB_USER', 'root'),
      password: Env.get('MSDB_PASSWORD', ''),
      database: Env.get('MSDB_DATABASE', 'adonis')
    },
    debug: false
  },

  mysql91: {
    client: 'mysql',
    connection: {
      host: Env.get('91DB_HOST', 'localhost'),
      port: Env.get('91DB_PORT', ''),
      user: Env.get('91DB_USER', 'root'),
      password: Env.get('91DB_PASSWORD', ''),
      database: Env.get('91DB_DATABASE', 'adonis')
    }
  },
  // ./FOR PRODUCT BATCH UPLOAD ONLY
}
