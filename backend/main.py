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
from routes import auth_routes, profile_routes, meal_routes, tracking_routes, chat_routes, sync_routes, reminder_routes

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

# FatSecret Configuration
CLIENT_ID = os.getenv("FATSECRET_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("FATSECRET_CLIENT_SECRET", "").strip()
AUTH_URL = "https://oauth.fatsecret.com/connect/token"
API_BASE_URL = "https://platform.fatsecret.com/rest/server.api"

# SAFE DEBUG PRINTS
print(f"--- DEBUG: FATSECRET CONFIGURATION ---")
print(f"1. .env path: {env_path}")
print(f"2. .env file exists: {os.path.exists(env_path)}")
print(f"3. FATSECRET_CLIENT_ID loaded: {bool(CLIENT_ID)}")
print(f"4. FATSECRET_CLIENT_SECRET loaded: {bool(CLIENT_SECRET)}")
if CLIENT_ID:
    print(f"5. CLIENT_ID starts with: {CLIENT_ID[:5]}...")
print(f"--------------------------------------")

# Token Cache
token_cache = {
    "access_token": None,
    "expires_at": 0
}

async def get_access_token():
    """Gets and caches the OAuth2 token from FatSecret."""
    now = time.time()
    
    # Check if we have a valid token in cache
    if token_cache["access_token"] and now < token_cache["expires_at"]:
        return token_cache["access_token"]

    if not CLIENT_ID or not CLIENT_SECRET:
        print("CRITICAL: FATSECRET_CLIENT_ID or FATSECRET_CLIENT_SECRET is missing!")
        raise HTTPException(status_code=500, detail="FatSecret credentials not configured in .env")

    print(f"DEBUG: Requesting token for ID: {CLIENT_ID[:5]}***")
    
    # Try to log the public IP to help with FatSecret whitelisting
    try:
        async with httpx.AsyncClient() as ip_client:
            ip_resp = await ip_client.get("https://api.ipify.org", timeout=5.0)
            public_ip = ip_resp.text
            print(f"DEBUG: Your Server Public IP is: {public_ip}")
            print(f"TIP: If you still get 'invalid_client', ensure {public_ip} is whitelisted in FatSecret Dashboard.")
    except Exception:
        print("DEBUG: Could not detect public IP (Check internet connection)")
    
    async with httpx.AsyncClient() as client:
        try:
            # AUTHENTICATION REQUEST (OAuth 2.0 Client Credentials Flow)
            # Use Basic Auth (auth parameter) AND form-data (data parameter)
            response = await client.post(
                AUTH_URL,
                auth=(CLIENT_ID, CLIENT_SECRET),
                data={
                    "grant_type": "client_credentials",
                    "scope": "basic"
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout=15.0
            )
            
            print(f"DEBUG: Token Status: {response.status_code}")
            if response.status_code != 200:
                print(f"DEBUG: Token Error Body: {response.text}")
                if "invalid_client" in response.text:
                    print("CRITICAL ERROR: 'invalid_client' means FatSecret rejected your Client ID or Secret.")
                    print("ACTION REQUIRED: Go to FatSecret Dashboard -> OAuth 2.0 and copy CLIENT ID (not Consumer Key).")
            
            response.raise_for_status()
            data = response.json()
            
            token_cache["access_token"] = data["access_token"]
            token_cache["expires_at"] = now + data.get("expires_in", 86400) - 60
            return token_cache["access_token"]
            
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            raise HTTPException(status_code=500, detail=f"FatSecret Auth Error: {error_detail}")
        except Exception as e:
            print(f"DEBUG: Connection Error during auth: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Connection Error: {str(e)}")

# Models
class SearchRequest(BaseModel):
    query: str

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
        token = await get_access_token()
        print(f"DEBUG: Search Request for: '{request.query}'")
        
        # We'll try using a POST request which is sometimes more reliable for FatSecret
        data_params = {
            "method": "foods.search",
            "search_expression": request.query,
            "format": "json",
            "max_results": 5
        }
        
        async with httpx.AsyncClient() as client:
            # Note: FatSecret often accepts params in the URL even for POST
            response = await client.post(
                API_BASE_URL,
                params=data_params,
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            
            raw_data = response.json()
            print(f"DEBUG: Raw FatSecret Data: {raw_data}")

            # Check for error in JSON body (FatSecret sometimes returns 200 but with an error inside)
            if "error" in raw_data:
                err_msg = raw_data['error'].get('message', 'Unknown API Error')
                print(f"FATSECRET API ERROR: {err_msg}")
                # Raise 502 so the frontend can show the 'IP Blocked' warning
                raise HTTPException(status_code=502, detail=f"FatSecret: {err_msg}")

            foods_obj = raw_data.get("foods")
            if not foods_obj or not foods_obj.get("food"):
                print(f"DEBUG: No food list found in response.")
                return []
                
            foods_data = foods_obj.get("food", [])
            if isinstance(foods_data, dict):
                foods_data = [foods_data]
                
            results = []
            for f in foods_data[:5]:
                desc = str(f.get("food_description", ""))
                serving = "1 serving"; calories = "0"
                try:
                    s_m = re.search(r'^(.*?) - Calories', desc)
                    if s_m: serving = s_m.group(1)
                    c_m = re.search(r'Calories: (\d+)', desc)
                    if c_m: calories = c_m.group(1)
                except: pass

                results.append({
                    "food_id": str(f.get("food_id")),
                    "food_name": str(f.get("food_name")),
                    "brand_name": str(f.get("brand_name", "")),
                    "serving_size": serving,
                    "calories": float(calories) if calories.isdigit() else 0,
                    "food_type": str(f.get("food_type", ""))
                })
            
            return results

    except Exception as e:
        print(f"ERROR in search_foods: {str(e)}")
        return []

@app.get("/foods/{food_id}", response_model=FoodDetail)
async def get_food_detail(food_id: str):
    token = await get_access_token()
    
    params = {
        "method": "food.get.v2",
        "food_id": food_id,
        "format": "json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                API_BASE_URL,
                params=params,
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            if "error" in data:
                err_msg = data['error'].get('message', 'Unknown API Error')
                print(f"DEBUG Detail Error: {err_msg}")
                raise HTTPException(status_code=502, detail=f"FatSecret: {err_msg}")

            food = data.get("food", {})
            if not food:
                raise HTTPException(status_code=404, detail="Food not found")

            servings_raw = food.get("servings", {}).get("serving", [])
            if isinstance(servings_raw, dict):
                servings_raw = [servings_raw]

            servings = [
                {
                    "serving_description": s.get("serving_description", ""),
                    "calories": float(s.get("calories", 0)),
                    "protein": float(s.get("protein", 0)),
                    "carbs": float(s.get("carbohydrate", 0)),
                    "fat": float(s.get("fat", 0))
                }
                for s in servings_raw
            ]

            # Extract images if available
            images = food.get("food_images", {}).get("food_image", [])
            if isinstance(images, dict):
                images = [images]
            
            food_image = images[0].get("image_url") if images else None

            return {
                "food_id": food.get("food_id"),
                "food_name": food.get("food_name"),
                "food_image": food_image,
                "servings": servings
            }
        except httpx.HTTPStatusError as e:
            print(f"DEBUG: FatSecret Detail API Error: {e.response.status_code}")
            print(f"DEBUG: Response Body: {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail="FatSecret Service Unavailable")
        except Exception as e:
            print(f"DEBUG: Detail Error: {e}")
            raise HTTPException(status_code=503, detail="Detail Fetch Failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
