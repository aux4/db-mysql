# aux4/db-mysql

MySQL database tools for the aux4 CLI.

The `aux4/db-mysql` package provides seamless integration with MySQL databases directly from your command line. You can execute SQL queries, perform batch inserts, stream results for large datasets, manage transactions, and handle errors gracefully. Ideal for quick prototypes, ETL pipelines, automation scripts, and interactive database tasks without writing custom scripts.

## Installation

```bash
aux4 aux4 pkger install aux4/db-mysql
```

## Quick Start

Connect to a database, create a table, insert a record, and query data:

```bash
# Create a users table
aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name TEXT, age INTEGER, email TEXT)"

# Insert a user
aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "INSERT INTO users (name, age, email) VALUES ('Alice', 30, 'alice@example.com')"

# Query all users
aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "SELECT * FROM users"
```

## Usage

### Main Commands

- [`aux4 db mysql execute`](./commands/db/mysql/execute) - Execute SQL statements on a MySQL database and return all results as a JSON array.
- [`aux4 db mysql stream`](./commands/db/mysql/stream) - Execute SQL statements and stream each row as a newline-delimited JSON object.

### Command Reference

#### aux4 db mysql execute

Run one or more SQL statements on a MySQL database and collect all results in memory.

Usage:
```bash
aux4 db mysql execute \
  [--host <hostname>] \
  [--port <port>] \
  [--database <dbname>] \
  [--user <username>] \
  [--password <password>] \
  [--query "<SQL>"] \
  [--file <script.sql>] \
  [--inputStream] \
  [--tx] \
  [--ignore]
```

Options:

- `--host <hostname>`     Database host (default: `localhost`)
- `--port <port>`         Database port (default: `3306`)
- `--database <dbname>`   Database name (default: `mysql`)
- `--user <username>`     Database user (default: `root`)
- `--password <password>` Database password
- `--query "<SQL>"`      SQL statement to execute (positional if `arg: true`)
- `--file <sql_file.sql>` Execute SQL from a file
- `--inputStream`         Read a JSON array from stdin as input parameters
- `--tx`                  Wrap all operations in a single transaction
- `--ignore`              Ignore errors and continue processing, reporting failures

Examples:

```bash
# Named-parameter insert
aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
  --name Bob --age 25 --email bob@example.com

# Batch insert from JSON via stdin
echo '[{"name":"Carol","age":22,"email":"carol@example.com"}]' | \
  aux4 db mysql execute \
    --host localhost --port 3306 --database mydb --user root --password mypass \
    --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
    --inputStream

# Transactional insert (rollback on error)
echo '[{"name":"Tx1","age":40,"email":"tx1@example.com"},{"name":""}]' | \
  aux4 db mysql execute \
    --host localhost --port 3306 --database mydb --user root --password mypass \
    --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
    --inputStream --tx
```

#### aux4 db mysql stream

Stream query results row-by-row for large datasets or piping into other commands.

Usage:
```bash
aux4 db mysql stream \
  [--host <hostname>] \
  [--port <port>] \
  [--database <dbname>] \
  [--user <username>] \
  [--password <password>] \
  [--query "<SQL>"] \
  [--file <script.sql>] \
  [--inputStream] \
  [--tx] \
  [--ignore]
```

Options are the same as `execute`, but results are emitted as newline-delimited JSON objects.

Examples:

```bash
# Stream all users
aux4 db mysql stream \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "SELECT * FROM users ORDER BY id"

# Stream with a filter parameter
aux4 db mysql stream \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "SELECT name, email FROM users WHERE age >= :minAge ORDER BY name" \
  --minAge 30

# ETL pipeline: stream and immediately insert into audit table
aux4 db mysql stream \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "SELECT id, name FROM users" | \
  aux4 db mysql stream \
    --host localhost --port 3306 --database mydb --user root --password mypass \
    --query "INSERT INTO user_audit (user_id, audit_name) VALUES (:id, :name)" \
    --inputStream
```

## Output Formats

### Execute Command Output

The `execute` command returns results as JSON arrays for SELECT queries:

**SELECT Success:**
```json
[
  {"id": 1, "name": "Alice", "age": 30, "email": "alice@example.com"},
  {"id": 2, "name": "Bob", "age": 25, "email": "bob@example.com"}
]
```

**INSERT/UPDATE/DELETE Success:**
```json
[{"fieldCount":0,"affectedRows":1,"insertId":1,"info":"","serverStatus":2,"warningStatus":0,"changedRows":0}]
```

**Errors (to stderr):**
```json
[{"item": {"name": "Bad Data"}, "query": "INSERT INTO users...", "error": "Column 'age' cannot be null"}]
```

### Stream Command Output

The `stream` command returns newline-delimited JSON objects (NDJSON) for SELECT queries:

```json
{"id": 1, "name": "Alice", "age": 30, "email": "alice@example.com"}
{"id": 2, "name": "Bob", "age": 25, "email": "bob@example.com"}
```

**Errors (to stderr):**
```json
{"item": {}, "query": "SELECT invalid_column FROM users", "error": "Unknown column 'invalid_column' in 'field list'"}
```

## Advanced Features

### Batch Processing with inputStream

Process multiple records from JSON input:

```bash
# Create JSON file with batch data
cat > users.json << EOF
[
  {"name": "User1", "age": 25, "email": "user1@example.com"},
  {"name": "User2", "age": 30, "email": "user2@example.com"}
]
EOF

# Execute batch insert
cat users.json | aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
  --inputStream
```

### Parameter Override

CLI parameters override JSON input parameters:

```bash
# Override email for all records in the batch
cat users.json | aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
  --email "override@example.com" \
  --inputStream
```

### Transaction Management

**With transactions (`--tx`):**
- All operations execute within a single transaction
- On error, all changes are rolled back
- Ensures data consistency for batch operations

```bash
# Transactional batch - all or nothing
cat batch.json | aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
  --inputStream --tx
```

**Without transactions:**
- Each operation commits individually
- Successful operations persist even if later ones fail
- Faster for large batches but less consistent

### Error Handling

**Default behavior (`--ignore` not set):**
- Stop on first error
- Exit with non-zero code
- Error details sent to stderr

**With `--ignore` flag:**
- Continue processing remaining records
- Output successful results to stdout
- Send errors to stderr but exit with zero code

```bash
# Process all records, ignoring failures
cat mixed_data.json | aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
  --inputStream --ignore
```

## Examples

### Basic Query

```bash
aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "SELECT * FROM users"
```

### Insert with Named Parameters

```bash
aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
  --name "Dave" --age 45 --email dave@example.com
```

### Query with Parameters

```bash
aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "SELECT * FROM users WHERE age >= :minAge AND email LIKE :domain" \
  --minAge 25 --domain "%@example.com"
```

### Transaction Rollback Demonstration

```bash
# Good and bad records in a single batch; --tx rolls back all if any fail
echo '[{"name":"Good","age":20,"email":"good@example.com"},{"name":"Bad"}]' | \
  aux4 db mysql execute \
    --host localhost --port 3306 --database mydb --user root --password mypass \
    --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
    --inputStream --tx
```

### Stream Processing Pipeline

```bash
# Create audit table
aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "CREATE TABLE user_audit (audit_id INT AUTO_INCREMENT PRIMARY KEY, user_id INTEGER, user_name TEXT, user_email TEXT, audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"

# Stream users and insert audit records
aux4 db mysql stream \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "SELECT id, name, email FROM users WHERE age >= 25" | \
  aux4 db mysql stream \
    --host localhost --port 3306 --database mydb --user root --password mypass \
    --query "INSERT INTO user_audit (user_id, user_name, user_email) VALUES (:id, :name, :email)" \
    --inputStream
```

### Error Recovery with --ignore

```bash
# Process mixed data, continuing despite errors
cat > mixed_data.json << EOF
[
  {"name": "Valid User", "age": 30, "email": "valid@example.com"},
  {"invalid_field": "bad data"},
  {"name": "Another Valid User", "age": 25, "email": "another@example.com"}
]
EOF

cat mixed_data.json | aux4 db mysql execute \
  --host localhost --port 3306 --database mydb --user root --password mypass \
  --query "INSERT INTO users (name, age, email) VALUES (:name, :age, :email)" \
  --inputStream --ignore
```

## License

Apache-2.0. See the [LICENSE](./LICENSE) file for details.
