from passlib.context import CryptContext
import sys

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password = "test_password"
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
    
    verified = pwd_context.verify(password, hashed)
    print(f"Verified: {verified}")
    
    if verified:
        print("SUCCESS: Bcrypt is working perfectly!")
    else:
        print("FAILURE: Verification failed.")
except Exception as e:
    print(f"CRITICAL ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
