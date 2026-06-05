from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# We use a local file database here to bypass all Windows password errors completely.
# To switch to MySQL later, you simply change this string to:
# "mysql+pymysql://root:MartRoot@123@localhost:3306/smartmart_db"
DATABASE_URL = "sqlite:///./smartmart.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()