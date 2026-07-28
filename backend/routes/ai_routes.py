from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
import os

router = APIRouter(prefix="/ai", tags=["Offline AI Fallback"])

offline_model = None
offline_classes = {}

@router.on_event("startup")
def load_offline_model():
    global offline_model, offline_classes
    try:
        from ultralytics import YOLO
        
        # Paths
        base_dir = os.path.dirname(os.path.dirname(__file__))
        model_path = os.path.join(base_dir, "models", "best.pt")
        classes_path = os.path.join(base_dir, "models", "classes.txt")
        
        if os.path.exists(model_path):
            print("Loading Offline YOLOv8 Model into memory...")
            offline_model = YOLO(model_path)
            
            if os.path.exists(classes_path):
                with open(classes_path, "r") as f:
                    offline_classes = {i: line.strip() for i, line in enumerate(f.readlines())}
                print(f"Offline AI Model loaded successfully with {len(offline_classes)} classes.")
            else:
                print(f"Warning: {classes_path} not found.")
        else:
            print(f"Warning: Offline model not found at {model_path}. Fallback will be unavailable.")
            
    except ImportError:
        print("Warning: Ultralytics or required AI libraries are not installed. Offline fallback disabled.")
    except Exception as e:
        print(f"Failed to load Offline AI Model: {e}")

class DetectOfflineRequest(BaseModel):
    image_base64: str

@router.post("/detect-offline")
async def detect_offline(request: DetectOfflineRequest):
    global offline_model, offline_classes
    
    if offline_model is None:
        print("[LOG: Offline Model Failure] Model not loaded.")
        raise HTTPException(status_code=503, detail="Offline AI model is currently unavailable.")
        
    try:
        import numpy as np
        import cv2
        # Decode base64 string
        img_data = base64.b64decode(request.image_base64)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("[LOG: Offline Model Failure] Invalid image data.")
            raise HTTPException(status_code=400, detail="Invalid image data.")
            
        # Run YOLO prediction
        results = offline_model(img, verbose=False) # type: ignore
        top1_idx = int(results[0].probs.top1) # type: ignore
        confidence = float(results[0].probs.top1conf) * 100  # type: ignore
        
        predicted_name = offline_classes.get(top1_idx, "Unknown Food")
        
        print(f"[LOG: Offline Model Prediction] {predicted_name} ({confidence:.2f}%)")
        
        return {
            "food_name": predicted_name,
            "confidence": confidence,
            "source": "offline_ai"
        }
        
    except Exception as e:
        print(f"[LOG: Offline Model Failure] Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Error processing image for offline detection.")
