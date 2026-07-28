import os
import sys
import time
import base64
import re

# Add current directory to sys.path for relative imports to work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
import models, database
from routes import auth_routes, profile_routes, meal_routes, tracking_routes, chat_routes, sync_routes, reminder_routes, notification_routes, upload_routes, ai_routes
# Check and drop old reminder tables if id is integer (to support UUID migration)
try:
    from sqlalchemy import inspect, text
    inspector = inspect(database.engine)
    if inspector.has_table('reminders'):
        id_col = next((c for c in inspector.get_columns('reminders') if c['name'] == 'id'), None)
        if id_col and ('integer' in str(id_col['type']).lower() or 'int' in str(id_col['type']).lower()):
            print("Dropping old reminder tables for UUID migration...")
            with database.engine.connect() as conn:
                conn.execute(text("DROP TABLE IF EXISTS reminder_statuses CASCADE;"))
                conn.execute(text("DROP TABLE IF EXISTS notification_history CASCADE;"))
                conn.execute(text("DROP TABLE IF EXISTS reminders CASCADE;"))
                conn.commit()
except Exception as e:
    print(f"Pre-migration notice: {e}")

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

# Auto-migration for missing columns (ensure selected_mode and suggested_mode exist)
try:
    from sqlalchemy import inspect, text
    inspector = inspect(database.engine)
    if inspector is not None:
        columns = [c['name'] for c in inspector.get_columns('profiles')]
        with database.engine.connect() as conn:
            # 1. If 'mode' exists but 'selected_mode' doesn't, just rename it
            if 'mode' in columns and 'selected_mode' not in columns:
                print("Renaming column: mode to selected_mode")
                conn.execute(text("ALTER TABLE profiles RENAME COLUMN mode TO selected_mode;"))
            
            # 2. If BOTH exist (transition state), copy data and drop old one
            elif 'mode' in columns and 'selected_mode' in columns:
                print("Syncing data from mode to selected_mode and dropping mode")
                conn.execute(text("UPDATE profiles SET selected_mode = mode WHERE selected_mode IS NULL;"))
                conn.execute(text("ALTER TABLE profiles DROP COLUMN mode;"))
                
            # 3. Ensure selected_mode exists if neither were found (unlikely)
            elif 'selected_mode' not in columns:
                print("Adding missing column: selected_mode")
                conn.execute(text("ALTER TABLE profiles ADD COLUMN selected_mode VARCHAR;"))
                
            # 4. Ensure suggested_mode exists
            if 'suggested_mode' not in columns:
                print("Adding missing column: suggested_mode")
                conn.execute(text("ALTER TABLE profiles ADD COLUMN suggested_mode VARCHAR;"))
            
            # Ensure reminder columns exist in profiles table
            reminder_cols = [
                'breakfast_reminder_time',
                'lunch_reminder_time',
                'dinner_reminder_time',
                'snack_reminder_time',
                'water_reminder_interval',
                'workout_reminder_time',
                'sleep_reminder_time'
            ]
            for col in reminder_cols:
                if col not in columns:
                    print(f"Adding missing column: {col} to profiles table")
                    conn.execute(text(f"ALTER TABLE profiles ADD COLUMN {col} VARCHAR;"))
            
            # 5. Ensure last_active_platform exists in users table
            user_columns = [c['name'] for c in inspector.get_columns('users')]
            if 'last_active_platform' not in user_columns:
                print("Adding missing column: last_active_platform to users table")
                conn.execute(text("ALTER TABLE users ADD COLUMN last_active_platform VARCHAR;"))
            
            # 6. Ensure mode exists in meals table
            meal_columns = [c['name'] for c in inspector.get_columns('meals')]
            if 'mode' not in meal_columns:
                print("Adding missing column: mode to meals table")
                conn.execute(text("ALTER TABLE meals ADD COLUMN mode VARCHAR DEFAULT 'health';"))
            
            conn.commit()
except Exception as e:
    print(f"Auto-migration notice: {e}")

# Force load real keys from .env in the current script's directory
basedir = os.path.abspath(os.path.dirname(__file__))
env_path = os.path.join(basedir, ".env")
load_dotenv(env_path, override=True)

# Add startup logs
print("Starting NutriSnap backend...")
db_url = os.getenv("DATABASE_URL")
print("DATABASE_URL exists:", bool(db_url))

app = FastAPI(title="NutriSnap FatSecret Backend")

# Enable CORS for Expo and Vercel frontends (allow any origin via regex for robust cross-platform web support)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    client_host = request.client.host if request.client else "unknown"
    print(f"\n[REQUEST RECEIVED] {request.method} {request.url.path} from client {client_host}")
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    print(f"[RESPONSE SENT] {request.method} {request.url.path} -> Status {response.status_code} (took {duration:.4f}s)")
    return response

@app.on_event("startup")
def list_users_on_startup():
    try:
        from database import SessionLocal
        import models
        db = SessionLocal()
        users = db.query(models.User).all()
        print("Backend started successfully")
        print(f"--- STARTUP DATABASE CHECK: {len(users)} registered users found ---")
        for u in users:
            print(f"User ID: {u.id}, Name: {u.name}, Email: {u.email}, Verified: {u.is_verified}")
        print("-----------------------------------------------------------------")
        db.close()
    except Exception as e:
        print(f"--- STARTUP DATABASE CHECK FAILED: {str(e)} ---")

@app.get("/")
async def root():
    return {"status": "online", "message": "NutriSnap Backend is running"}

# Add validation error logging
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("--- VALIDATION ERROR ---")
    print(f"Error details: {exc.errors()}")
    # We attempt to log the body, but it might have been already consumed
    try:
        body = await request.body()
        print(f"Request Body: {body.decode()}")
    except:
        print("Could not log request body")
        
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation Error", "errors": exc.errors()},
    )


# New Feature Routers
app.include_router(auth_routes.router)
app.include_router(profile_routes.router)
app.include_router(meal_routes.router)
app.include_router(tracking_routes.router)
app.include_router(chat_routes.router)
app.include_router(sync_routes.router)
app.include_router(reminder_routes.router)
app.include_router(notification_routes.router)
app.include_router(upload_routes.router)
app.include_router(ai_routes.router)

# USDA API Configuration
USDA_API_KEY = os.getenv("USDA_API_KEY", "DEMO_KEY").strip()
USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
USDA_DETAIL_URL = "https://api.nal.usda.gov/fdc/v1/food/"

print(f"--- DEBUG: USDA API CONFIGURATION ---")
print(f"1. .env path: {env_path}")
print(f"2. USDA_API_KEY loaded: {bool(USDA_API_KEY)}")
if USDA_API_KEY and USDA_API_KEY != "DEMO_KEY":
    print(f"3. USDA_API_KEY starts with: {USDA_API_KEY[:5]}...")
print(f"--------------------------------------")

# Models
class SearchRequest(BaseModel):
    query: str
    fallbackNutrition: Optional[dict] = None

class FoodItem(BaseModel):
    food_id: str
    food_name: str
    food_description: str
    food_type: str

class Serving(BaseModel):
    serving_description: str
    calories: float
    protein: float
    carbs: float
    fat: float

class FoodDetail(BaseModel):
    food_id: str
    food_name: str
    food_image: Optional[str] = None
    servings: List[Serving]

@app.post("/foods/search", response_model=List[dict])
async def search_foods(request: SearchRequest):
    try:
        print(f"DEBUG: Search Request for: '{request.query}'")
        
        params = {
            "query": request.query,
            "api_key": USDA_API_KEY,
            "pageSize": 5,
            "requireAllWords": False
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                USDA_API_BASE_URL,
                params=params,
                timeout=10.0
            )
            
            raw_data = response.json()
            
            if "error" in raw_data:
                err_msg = raw_data['error'].get('message', 'Unknown API Error')
                print(f"USDA API ERROR: {err_msg}")
                raise HTTPException(status_code=502, detail=f"USDA: {err_msg}")

            foods_data = raw_data.get("foods", [])
                
            results = []
            for f in foods_data[:5]:
                desc = str(f.get("description", ""))
                brand = str(f.get("brandName", ""))
                serving_size = f.get("servingSize", 1)
                serving_unit = f.get("servingSizeUnit", "serving")
                serving_desc = f"{serving_size} {serving_unit}"
                
                nutrients = f.get("foodNutrients", [])
                calories = 0
                for n in nutrients:
                    if n.get("nutrientId") == 1008 or n.get("nutrientName") == "Energy":
                        calories = n.get("value", 0)
                        break

                results.append({
                    "food_id": str(f.get("fdcId")),
                    "food_name": desc,
                    "brand_name": brand,
                    "serving_size": serving_desc,
                    "calories": float(calories),
                    "food_type": "USDA Food"
                })
            
            if not results and request.fallbackNutrition:
                # Use Gemini fallback
                cal = request.fallbackNutrition.get("calories", 0)
                pro = request.fallbackNutrition.get("protein", 0)
                carbs = request.fallbackNutrition.get("carbs", 0)
                fat = request.fallbackNutrition.get("fat", 0)
                fallback_id = f"gemini_fallback:{cal}:{pro}:{carbs}:{fat}"
                
                results.append({
                    "food_id": fallback_id,
                    "food_name": request.query,
                    "brand_name": "AI Estimate",
                    "serving_size": "1 serving",
                    "calories": float(cal),
                    "food_type": "Fallback"
                })
            
            return results

    except Exception as e:
        print(f"ERROR in search_foods: {str(e)}")
        return []

def get_base_unit_type(food_name: str) -> str:
    name = food_name.lower().strip()
    if any(x in name for x in ['juice','milk','tea','coffee','smoothie','drink','water','beverage','soup','soda','beer','wine','alcohol','liquid','broth']):
        return 'ml'
    if any(x in name for x in ['rice','noodle','pasta','curry','dal','spaghetti','gravy','chicken breast','beef','pork','fish','steak','oats','porridge','quinoa','lentil','beans']):
        return 'grams'
    if any(x in name for x in ['slices','sliced','cut','pieces','salad','chopped','diced','chunks','halves']):
        return 'grams'
    if any(x in name for x in ['chips','biscuit','chocolate','cookie','wafer','cracker','snack','popcorn','candy','nut','almond','cashew','peanut']):
        return 'grams'
    return 'count'

def get_piece_grams(food_name: str) -> float:
    name = food_name.lower()
    if 'apple' in name: return 182.0
    if 'banana' in name: return 120.0
    if 'mango' in name: return 200.0
    if 'orange' in name: return 130.0
    if 'egg' in name: return 50.0
    if 'burger' in name: return 220.0
    if 'sandwich' in name: return 150.0
    if 'chapati' in name or 'roti' in name: return 40.0
    if 'idli' in name: return 50.0
    if 'dosa' in name: return 80.0
    if 'pizza' in name: return 120.0
    if 'donut' in name: return 60.0
    if 'cookie' in name: return 30.0
    if 'biscuit' in name: return 10.0
    if 'chocolate' in name: return 40.0
    if 'packet' in name: return 50.0
    return 150.0

@app.get("/foods/{food_id}", response_model=FoodDetail)
async def get_food_detail(food_id: str):
    if food_id.startswith("gemini_fallback:"):
        parts = food_id.split(":")
        cal = float(parts[1]) if len(parts) > 1 else 0
        prot = float(parts[2]) if len(parts) > 2 else 0
        carbs = float(parts[3]) if len(parts) > 3 else 0
        fat = float(parts[4]) if len(parts) > 4 else 0
        return {
            "food_id": food_id,
            "food_name": "AI Estimated Food",
            "food_image": None,
            "servings": [{
                "serving_description": "1 serving",
                "calories": cal,
                "protein": prot,
                "carbs": carbs,
                "fat": fat
            }]
        }
        
    params = {
        "api_key": USDA_API_KEY
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{USDA_DETAIL_URL}{food_id}",
                params=params,
                timeout=10.0
            )
            response.raise_for_status()
            food = response.json()
            
            if "error" in food:
                err_msg = food['error'].get('message', 'Unknown API Error')
                raise HTTPException(status_code=502, detail=f"USDA: {err_msg}")

            nutrients = food.get("foodNutrients", [])
            cal = 0
            prot = 0
            carbs = 0
            fat = 0
            
            for n in nutrients:
                n_info = n.get("nutrient", {})
                n_id = n_info.get("id") or n.get("nutrientId")
                n_name = n_info.get("name") or n.get("nutrientName")
                n_value = n.get("amount") or n.get("value") or 0
                
                if n_id == 1008 or n_name == "Energy": cal = float(n_value)
                elif n_id == 1003 or n_name == "Protein": prot = float(n_value)
                elif n_id == 1005 or n_name == "Carbohydrate, by difference": carbs = float(n_value)
                elif n_id == 1004 or n_name == "Total lipid (fat)": fat = float(n_value)

            serving_size = food.get("servingSize")
            serving_unit = food.get("servingSizeUnit", "serving")
            serving_desc = f"{serving_size} {serving_unit}" if serving_size else "1 serving"
            
            # The nutrients extracted from foodNutrients are per 100g or 100mL by USDA standards.
            # Scale them to per piece if the frontend treats this as a countable item.
            food_desc = str(food.get("description", "Unknown Food"))
            base_type = get_base_unit_type(food_desc)
            
            if base_type == 'count':
                # Determine piece weight
                piece_weight = serving_size
                if piece_weight is None or float(piece_weight) <= 0:
                    piece_weight = get_piece_grams(food_desc)
                else:
                    piece_weight = float(piece_weight)
                
                # Scale from per 100g to per piece
                cal = (cal / 100.0) * piece_weight
                prot = (prot / 100.0) * piece_weight
                carbs = (carbs / 100.0) * piece_weight
                fat = (fat / 100.0) * piece_weight
                
            return {
                "food_id": str(food.get("fdcId", food_id)),
                "food_name": food_desc,
                "food_image": None,
                "servings": [{
                    "serving_description": serving_desc,
                    "calories": float(cal),
                    "protein": float(prot),
                    "carbs": float(carbs),
                    "fat": float(fat)
                }]
            }
        except httpx.HTTPStatusError as e:
            print(f"DEBUG: USDA Detail API Error: {e.response.status_code}")
            print(f"DEBUG: Response Body: {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail="USDA Service Unavailable")
        except Exception as e:
            print(f"DEBUG: Detail Error: {e}")
            raise HTTPException(status_code=503, detail="Detail Fetch Failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
