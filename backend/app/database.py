import os
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from typing import AsyncGenerator

def _db_config() -> dict[str, object]:
	return {
		"host": os.getenv("POSTGRES_HOST", "localhost"),
		"port": int(os.getenv("POSTGRES_PORT", "5432")),
		"user": os.getenv("POSTGRES_USER", "postgres"),
		"password": os.getenv("POSTGRES_PASSWORD", "postgres"),
		"database": os.getenv("POSTGRES_DB", "chatapp"),
	}


def _database_url() -> str:
	database_url = os.getenv("DATABASE_URL")
	if database_url:
		return database_url

	config = _db_config()
	return (
		f"postgresql+psycopg://{config['user']}:{config['password']}"
		f"@{config['host']}:{config['port']}/{config['database']}"
	)


# Global engine instance to be used across the application
# *manages the connection pool*
engine: AsyncEngine = create_async_engine(
	_database_url(),
	pool_pre_ping=True,
)

# Global session factory
async_session_factory = async_sessionmaker(
	engine, expire_on_commit=False
)

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session