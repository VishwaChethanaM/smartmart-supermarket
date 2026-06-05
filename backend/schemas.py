from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon_name: str
    class Config:
        orm_mode = True

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    stock_quantity: int
    image_url: Optional[str] = None
    is_organic: bool
    category_id: int

class ProductResponse(ProductBase):
    id: int
    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    username: str
    password: str
    phone_number: Optional[str] = None

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str # Required at purchase time
    total_amount: float

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    customer_phone: Optional[str]
    total_amount: float
    status: str
    created_at: datetime
    class Config:
        orm_mode = True