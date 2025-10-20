#  Backend

Start the backend using the following command in dev mode

```shell
fastapi dev main.py
```

## Database Migration

Create a new migration script using the following command.

```shell
alembic revision -m "create account table"
```

Run the migration script

```shell
alembic upgrade head
```

Undo the migration

```shell
alembic downgrade base
```