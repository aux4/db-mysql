# @aux4/db-mysql

## JavaScript

### Install

```bash
$ npm install @aux4/db-mysql
```

### Execute Query

```javascript
const Database = require("@aux4/db-mysql");
const db = new Database({
  host: "localhost",
  user: "root",
  password: "******",
  database: "mysql"
});

(async () => {
  await db.open();
  const { data } = await db.execute("select * from table where id = @id", { id: 1 });
  console.log(JSON.stringify(data, null, 2));
  await db.close();
})();
```

### Query Stream

```javascript
const Database = require("@aux4/db-mysql");
const db = new Database({
  host: "localhost",
  user: "root",
  password: "******",
  database: "mysql"
});

const stream = await db.stream("select * from table where id = @id", { id: 1 });

stream.on("data", row => {
console.log(JSON.stringify(row, null, 2));
});

stream.on("error", err => {
console.error(err.message);
});

stream.on("close", async () => {
await db.close();
});
```

## Command Line

### Install

```bash
$ npm install --global @aux4/db
$ npm install --global @aux4/db-mysql
```

### Usage

#### Execute Query

```bash
$ db execute --host localhost --port 3306 --user root --database mysql --query "select * from table where id = @id" --id 1
```

#### Stream Query

```bash
$ db stream --host localhost --port 3306 --user root --database mysql --query "select * from table where id = @id" --id 1
```

#### Using @aux4/config

create `config.yaml`

```yaml
config:
  dev:
    mysql:
      type: mysql
      host: localhost
      port: 3306
      user: root
      password: "******"
      database: mysql
```

```bash
$ db execute --configFile config.yaml --config dev/mysql --query "select * from table where id = @id" --id 1
```

## See Also

* aux4 [website](https://aux4.io) / [npm](https://www.npmjs.com/package/aux4) / [GitHub](https://github.com/aux4/aux4)
* @aux4/config [npm](https://www.npmjs.com/package/@aux4/config) / [GitHub](https://github.com/aux4/config)
* @aux4/db [npm](https://www.npmjs.com/package/@aux4/db) / [GitHub](https://github.com/aux4/db)
