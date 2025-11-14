#  Backend

Start the backend using the following command in dev mode

```shell
uv run fastapi dev app/main.py
```

## Database Migration

Create a new migration script using the following command.

```shell
alembic revision -m "create account table"
```

Write the migration scirpt in the newly generated script under `alembic/versions`

Run the migration script

```shell
alembic upgrade head
```

Undo the migration

```shell
alembic downgrade base
```