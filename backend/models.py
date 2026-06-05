from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    icon_name = Column(String)
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    stock_quantity = Column(Integer, default=100)
    image_url = Column(String)
    is_organic = Column(Boolean, default=False)
    category = relationship("Category", back_populates="products")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String) # Stored securely for validation
    phone_number = Column(String, nullable=True)
    role = Column(String, default="user") # 'admin' or 'user'

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    customer_email = Column(String)
    customer_phone = Column(String, nullable=True) # Captures phone number at checkout
    total_amount = Column(Float)
    status = Column(String, default="Paid") # Changes to Paid after payment simulation
    created_at = Column(DateTime, default=datetime.datetime.utcnow)