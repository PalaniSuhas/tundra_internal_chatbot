from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.config import settings

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        cls.client = AsyncIOMotorClient(settings.MONGODB_URI)
        
    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
    
    @classmethod
    def get_database(cls):
        if not cls.client:
            raise Exception("Database not connected")
        return cls.client[settings.MONGODB_DB_NAME]


async def get_db():
    return Database.get_database()