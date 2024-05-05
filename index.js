const { Transform } = require("stream");
const mysql = require("mysql2/promise");
const rawMySQL = require("mysql2");

class Database {
  constructor({ host = "localhost", port = 3306, user = "root", password, database = "mysql" }) {
    this.config = {
      host: host,
      port: port,
      user: user,
      password: password,
      database: database,
      namedPlaceholders: true
    };
  }

  async open() {
    this.pool = mysql.createPool(this.config);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async execute(sql, params = {}) {
    const [rows] = await this.pool.execute(sql, params);
    return { data: rows };
  }

  async stream(sql, params = {}) {
    const pool = rawMySQL.createPool(this.config);
    const resultStream = pool.query(sql, params);

    const transform = new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        callback(null, row);
      }
    });

    resultStream.on("result", row => {
      transform.emit("data", row);
    });

    resultStream.on("error", err => {
      transform.emit("error", err);
    });

    resultStream.on("end", () => {
      transform.end();
      pool.end();
    });

    return transform;
  }
}

module.exports = Database;
