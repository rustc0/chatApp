#!/bin/sh

set -e

echo "Upgrading db head"

alembic upgrade head

exec "$@"

