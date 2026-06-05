from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Session
from typing import List, Optional
from pydantic import BaseModel
import datetime

from .database import engine, Base, get_db
from . import models, schemas

class ResetRequestDB(Base):
    __tablename__ = "reset_requests"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    new_password = Column(String)
    status = Column(String, default="Pending")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartMart Full-Stack Enterprise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResetForm(BaseModel):
    username: str
    new_password: str

class ActionForm(BaseModel):
    request_id: int
    action: str

class OrderStatusUpdate(BaseModel):
    status: str

class OrderItemSchema(BaseModel):
    id: int
    qty: int

class AdvancedOrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    total_amount: float
    items: List[OrderItemSchema]

@app.on_event("startup")
def seed_data():
    db = next(get_db())
    if db.query(models.Category).first() is None:
        produce = models.Category(name="Fresh Produce", icon_name="Leaf")
        dairy = models.Category(name="Dairy & Eggs", icon_name="Egg")
        bakery = models.Category(name="Bakery", icon_name="Croissant")
        beverages = models.Category(name="Beverages", icon_name="Coffee")
        db.add_all([produce, dairy, bakery, beverages])
        db.commit()

        p1 = models.Product(category_id=1, name="Organic Honeycrisp Apples (1kg)", description="Crisp, sweet local apples.", price=180.00, stock_quantity=120, image_url="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6", is_organic=True)
        p2 = models.Product(category_id=1, name="Fresh Organic Spinach (Bunch)", description="Freshly harvested spinach leaves.", price=40.00, stock_quantity=85, image_url="https://images.unsplash.com/photo-1576045057995-568f588f82fb", is_organic=True)
        p3 = models.Product(category_id=2, name="Premium Whole Milk 1L", description="Pasteurized organic whole milk.", price=70.00, stock_quantity=60, image_url="https://images.unsplash.com/photo-1563636619-e9143da7973b", is_organic=False)
        db.add_all([p1, p2, p3])
        
        admin_user = models.User(username="admin", password="Admin@123", phone_number="9900112233", role="admin")
        db.add(admin_user)
        db.commit()

# --- FEATURE 1: REAL-TIME SALES ANALYTICS ---
@app.get("/api/admin/analytics")
def get_sales_analytics(db: Session = Depends(get_db)):
    orders = db.query(models.Order).all()
    total_revenue = sum(o.total_amount for o in orders)
    total_orders = len(orders)
    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders
    }

# --- FEATURE 4: ADMIN ORDER MANAGEMENT LOGS ---
@app.get("/api/admin/orders")
def get_admin_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.id.desc()).all()
    return [{
        "id": o.id, "customer_name": o.customer_name, "customer_email": o.customer_email,
        "customer_phone": o.customer_phone, "total_amount": o.total_amount, "status": o.status,
        "created_at": o.created_at.strftime('%Y-%m-%d %H:%M') if o.created_at else "Just Now"
    } for o in orders]

@app.put("/api/admin/orders/{order_id}")
def update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    return {"message": "Status updated successfully"}

# --- TRADITIONAL DATA ACCESS PORTALS ---
@app.get("/api/orders/history")
def get_order_history(customer_name: str, db: Session = Depends(get_db)):
    history = db.query(models.Order).filter(models.Order.customer_name == customer_name).order_by(models.Order.id.desc()).all()
    return [{"id": o.id, "customer_name": o.customer_name, "total_amount": o.total_amount, "status": o.status, "created_at": o.created_at.strftime('%Y-%m-%d %H:%M') if o.created_at else "Just Now"} for o in history]

@app.post("/api/reset-request")
def create_reset_request(form: ResetForm, db: Session = Depends(get_db)):
    user_check = db.query(models.User).filter(models.User.username == form.username).first()
    if not user_check: raise HTTPException(status_code=404, detail="Username not found!")
    req = ResetRequestDB(username=form.username, new_password=form.new_password, status="Pending")
    db.add(req)
    db.commit()
    return {"message": "Reset request sent to admin dashboard. Waiting for approval."}

@app.get("/api/admin/reset-requests")
def get_all_reset_requests(db: Session = Depends(get_db)):
    reqs = db.query(ResetRequestDB).filter(ResetRequestDB.status == "Pending").all()
    return [{"id": r.id, "username": r.username, "new_password": r.new_password, "status": r.status} for r in reqs]

@app.post("/api/admin/approve-reset")
def approve_reset_request(form: ActionForm, db: Session = Depends(get_db)):
    req = db.query(ResetRequestDB).filter(ResetRequestDB.id == form.request_id).first()
    if not req: raise HTTPException(status_code=404, detail="Request not found")
    if form.action == "Approve":
        user_profile = db.query(models.User).filter(models.User.username == req.username).first()
        if user_profile: user_profile.password = req.new_password
        req.status = "Approved"
        db.commit()
        return {"message": "Approved"}
    else:
        req.status = "Rejected"
        db.commit()
        return {"message": "Rejected"}

@app.get("/api/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username, "phone_number": u.phone_number, "role": u.role} for u in users]

@app.post("/api/register")
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user: raise HTTPException(status_code=400, detail="Username already exists!")
    db_user = models.User(username=user_data.username, password=user_data.password, phone_number=user_data.phone_number, role="user")
    db.add(db_user)
    db.commit()
    return {"message": "Registered", "username": db_user.username}

@app.post("/api/login")
def login(request: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == request.username).first()
    if db_user and db_user.password == request.password:
        return {"username": db_user.username, "role": db_user.role, "phone_number": db_user.phone_number, "token": "live-session-token"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)): return db.query(models.Category).all()

@app.get("/api/products")
def get_products(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    if category_id: return db.query(models.Product).filter(models.Product.category_id == category_id).all()
    return db.query(models.Product).all()

# --- SIMPLIFIED DIGITAL CHEKOUT GATEWAY ---
@app.post("/api/orders")
def create_order(order: AdvancedOrderCreate, db: Session = Depends(get_db)):
    # 1. Deduct quantities directly from product stock columns
    for item in order.items:
        db_product = db.query(models.Product).filter(models.Product.id == item.id).first()
        if db_product:
            db_product.stock_quantity = max(0, db_product.stock_quantity - item.qty)
            
    # 2. Add Row to main orders table log with instantaneous completion status
    db_order = models.Order(
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        total_amount=order.total_amount,
        status="Success" # Changes directly to Success automatically
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.post("/api/admin/products")
def add_product(product: schemas.ProductBase, db: Session = Depends(get_db)):
    db_p = models.Product(name=product.name, description=product.description, price=product.price, stock_quantity=product.stock_quantity, image_url=product.image_url, is_organic=product.is_organic, category_id=product.category_id)
    db.add(db_p)
    db.commit()
    return db_p

@app.put("/api/admin/products/{product_id}")
def update_product(product_id: int, fields: schemas.ProductBase, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p: raise HTTPException(status_code=404, detail="Not found")
    p.name = fields.name
    p.price = fields.price
    p.stock_quantity = fields.stock_quantity
    p.image_url = fields.image_url
    p.description = fields.description
    p.category_id = fields.category_id
    db.commit()
    return {"message": "Updated"}

@app.delete("/api/admin/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if p: db.delete(p); db.commit()
    return {"message": "Deleted"}