const { Transform } = require("stream");
const { recursive } = require("merge");
const mssql = require("mssql");

class Database {
  constructor({
    host = "localhost",
    port = 1433,
    user = "sa",
    password,
    database = "master",
    azure = false,
    ...options
  }) {
    const defaultConfig = {
      server: host,
      port: port,
      user: user,
      password: password,
      database: database,
      options: {
        encrypt: azure,
        trustServerCertificate: true
      }
    };

    this.config = recursive(defaultConfig, options);
  }

  async open() {
    this.connection = await mssql.connect(this.config);
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  async execute(sql, params = {}) {
    const sqlRequest = createRequest(this.connection, params);

    const response = await sqlRequest.query(sql);
    const data = response.recordset;

    return { data };
  }

  async stream(sql, params = {}) {
    const sqlRequest = createRequest(this.connection, params);
    sqlRequest.stream = true;
    sqlRequest.query(sql);

    const transform = new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        callback(null, row);
      }
    });

    sqlRequest.on("row", row => {
      transform.emit("data", row);
    });

    sqlRequest.on("error", err => {
      transform.emit("error", err);
    });

    sqlRequest.on("done", () => {
      transform.end();
    });

    sqlRequest.on("end", () => {
      transform.end();
    });

    return transform;
  }
}

function createRequest(connection, params) {
  const sqlRequest = connection.request();

  Object.entries(params).forEach(([key, value]) => {
    sqlRequest.input(key, value);
  });

  return sqlRequest;
}

module.exports = Database;
