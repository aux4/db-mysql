# Basic Database Operations

```beforeAll
aux4 db mysql execute --host localhost --port 3306 --user root --password mysecretpassword --query "CREATE DATABASE IF NOT EXISTS test"
```

```beforeAll
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name TEXT, age INTEGER, email TEXT)"
```

```afterAll
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "DROP TABLE IF EXISTS users"
```

```afterAll
aux4 db mysql execute --host localhost --port 3306 --user root --password mysecretpassword --query "DROP DATABASE IF EXISTS test"
```

## Insert single record

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "INSERT INTO users (name, age, email) VALUES ('John', 28, 'john@example.com')"
```

```expect
[{"fieldCount":0,"affectedRows":1,"insertId":1,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}]
```

## Verify inserted record

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT * FROM users WHERE id = 1" | jq .
```

```expect
[
  {
    "id": 1,
    "name": "John",
    "age": 28,
    "email": "john@example.com"
  }
]
```

## Insert using parameters

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" --name Peter --age 55 --email peter@nothere.com
```

```expect
[{"fieldCount":0,"affectedRows":1,"insertId":2,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}]
```

## Verify parameter insert

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT * FROM users WHERE id = 2" | jq .
```

```expect
[
  {
    "id": 2,
    "name": "Peter",
    "age": 55,
    "email": "peter@nothere.com"
  }
]
```

## Insert using JSON file

```file:users.json
[
  {
    "name": "Alice",
    "age": 30,
    "email": "alice@person.com"
  },
  {
    "name": "Bob",
    "age": 25,
    "email": "bob@person.com"
  }
]
```

### Only the values from the file

```execute
cat users.json | aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" --inputStream
```

```expect
[{"fieldCount":0,"affectedRows":1,"insertId":3,"info":"","serverStatus":3,"warningStatus":0,"changedRows":0},{"fieldCount":0,"affectedRows":1,"insertId":4,"info":"","serverStatus":3,"warningStatus":0,"changedRows":0}]
```

### Verify batch insert

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT * FROM users WHERE id IN (3, 4) ORDER BY id" | jq .
```

```expect
[
  {
    "id": 3,
    "name": "Alice",
    "age": 30,
    "email": "alice@person.com"
  },
  {
    "id": 4,
    "name": "Bob",
    "age": 25,
    "email": "bob@person.com"
  }
]
```

### Overriding one of the parameters

```execute
cat users.json | aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" --email noemail@example.com --inputStream
```

```expect
[{"fieldCount":0,"affectedRows":1,"insertId":5,"info":"","serverStatus":3,"warningStatus":0,"changedRows":0},{"fieldCount":0,"affectedRows":1,"insertId":6,"info":"","serverStatus":3,"warningStatus":0,"changedRows":0}]
```

### Verify overridden parameters

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT * FROM users WHERE id IN (5, 6) ORDER BY id" | jq .
```

```expect
[
  {
    "id": 5,
    "name": "Alice",
    "age": 30,
    "email": "noemail@example.com"
  },
  {
    "id": 6,
    "name": "Bob",
    "age": 25,
    "email": "noemail@example.com"
  }
]
```

## Stream mode

### Query all users as stream

```execute
aux4 db mysql stream --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT * FROM users ORDER BY id"
```

```expect
{"id":1,"name":"John","age":28,"email":"john@example.com"}
{"id":2,"name":"Peter","age":55,"email":"peter@nothere.com"}
{"id":3,"name":"Alice","age":30,"email":"alice@person.com"}
{"id":4,"name":"Bob","age":25,"email":"bob@person.com"}
{"id":5,"name":"Alice","age":30,"email":"noemail@example.com"}
{"id":6,"name":"Bob","age":25,"email":"noemail@example.com"}
```

### Stream with parameters

```execute
aux4 db mysql stream --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT name, email FROM users WHERE age >= :minAge ORDER BY name" --minAge 30
```

```expect
{"name":"Alice","email":"alice@person.com"}
{"name":"Alice","email":"noemail@example.com"}
{"name":"Peter","email":"peter@nothere.com"}
```

## Stream piping

```beforeAll
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "CREATE TABLE IF NOT EXISTS user_audit (audit_id INT AUTO_INCREMENT PRIMARY KEY, user_id INTEGER, user_name TEXT, user_email TEXT, audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
```

```afterAll
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "DROP TABLE IF EXISTS user_audit"
```

### Stream users and insert into audit table

```execute
aux4 db mysql stream --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT id, name, email FROM users WHERE age >= 25" | aux4 db mysql stream --host localhost --port 3306 --database test --user root --password mysecretpassword --query "INSERT INTO user_audit (user_id, user_name, user_email) VALUES (:id, :name, :email)" --inputStream
```

```expect
{"fieldCount":0,"affectedRows":1,"insertId":1,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}
{"fieldCount":0,"affectedRows":1,"insertId":2,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}
{"fieldCount":0,"affectedRows":1,"insertId":3,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}
{"fieldCount":0,"affectedRows":1,"insertId":4,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}
{"fieldCount":0,"affectedRows":1,"insertId":5,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}
{"fieldCount":0,"affectedRows":1,"insertId":6,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}
```

### Verify audit records count

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT COUNT(*) as audit_count FROM user_audit" | jq .
```

```expect
[
  {
    "audit_count": 6
  }
]
```

## Transaction Tests

### Execute with Transaction - Good Input

```file:good_transaction_users.json
[
  {
    "name": "Transaction User 1",
    "age": 35,
    "email": "txuser1@example.com"
  },
  {
    "name": "Transaction User 2",
    "age": 42,
    "email": "txuser2@example.com"
  }
]
```

#### With Transaction

```execute
cat good_transaction_users.json | aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" --inputStream --tx
```

```expect
[{"fieldCount":0,"affectedRows":1,"insertId":7,"info":"","serverStatus":3,"warningStatus":0,"changedRows":0},{"fieldCount":0,"affectedRows":1,"insertId":8,"info":"","serverStatus":3,"warningStatus":0,"changedRows":0}]
```

#### Without Transaction

```execute
cat good_transaction_users.json | aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" --inputStream
```

```expect
[{"fieldCount":0,"affectedRows":1,"insertId":9,"info":"","serverStatus":3,"warningStatus":0,"changedRows":0},{"fieldCount":0,"affectedRows":1,"insertId":10,"info":"","serverStatus":3,"warningStatus":0,"changedRows":0}]
```

## Error Handling Tests

### Test invalid SQL query error

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT * FROM nonexistent_table"
```

```error
[{"item":{},"query":"SELECT * FROM nonexistent_table","error":"Table 'test.nonexistent_table' doesn't exist"}]
```

### Test stream error with invalid query

```execute
aux4 db mysql stream --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT invalid_column FROM users"
```

```error
{"item":{},"query":"SELECT invalid_column FROM users","error":"Unknown column 'invalid_column' in 'field list'"}
```

## Ignore Errors Tests

### Test execute with --ignore flag - single error

```execute
aux4 db mysql execute --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT * FROM nonexistent_table" --ignore
```

```expect

```

```error
[{"item":{},"query":"SELECT * FROM nonexistent_table","error":"Table 'test.nonexistent_table' doesn't exist"}]
```

### Test stream with --ignore flag and error

```execute
aux4 db mysql stream --host localhost --port 3306 --database test --user root --password mysecretpassword --query "SELECT invalid_column FROM users LIMIT 1" --ignore
```

```expect

```

```error
{"item":{},"query":"SELECT invalid_column FROM users LIMIT 1","error":"Unknown column 'invalid_column' in 'field list'"}
```
