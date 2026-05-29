from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
import random
import string
import models, schemas, auth, database, email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/check-email")
def check_email(request: schemas.EmailCheckRequest, db: Session = Depends(database.get_db)):
    import traceback
    from sqlalchemy import func
    
    email_received = request.email
    email_cleaned = email_received.strip().lower()
    
    print(f"[AUTH ROUTE LOG] POST /check-email - received email: '{email_received}'")
    print(f"[AUTH ROUTE LOG] POST /check-email - normalized email: '{email_cleaned}'")
    
    # Check if database is connected
    db_connected = False
    try:
        db.execute(func.now())
        db_connected = True
    except Exception as e:
        print(f"[AUTH ROUTE LOG] POST /check-email - database connection check failed: {str(e)}")
        
    print(f"[AUTH ROUTE LOG] POST /check-email - database connected: {db_connected}")
    
    try:
        user = db.query(models.User).filter(func.lower(models.User.email) == email_cleaned).first()
        if user:
            print("[AUTH ROUTE LOG] POST /check-email - user found: True")
            res = {"exists": True, "message": "Email found."}
        else:
            print("[AUTH ROUTE LOG] POST /check-email - user found: False")
            res = {"exists": False, "message": "Sign up first."}
        print(f"[AUTH ROUTE LOG] POST /check-email response: {res}")
        return res
    except Exception as e:
        print(f"[AUTH ROUTE LOG] POST /check-email error: {str(e)}")
        traceback.print_exc()
        
        # Log table and column information to help debug database issues on Render
        try:
            from sqlalchemy import inspect
            inspector = inspect(db.bind)
            if inspector is not None:
                tables = inspector.get_table_names()
                print(f"Database tables: {tables}")
                for table in tables:
                    columns = [col['name'] for col in inspector.get_columns(table)]
                    print(f"Table '{table}' columns: {columns}")
            else:
                print("SQLAlchemy inspector is None")
        except Exception as ie:
            print(f"Failed to inspect database tables/columns: {str(ie)}")
            
        res = {"exists": False, "message": "Sign up first."}
        print(f"[AUTH ROUTE LOG] POST /check-email response (fallback): {res}")
        return res


@router.post("/register-start")
def register_start(request: schemas.RegisterStartRequest, db: Session = Depends(database.get_db)):
    print(f"[AUTH ROUTE LOG] POST /register-start request: name={request.name}, email={request.email}")
    try:
        # Check if user already exists
        if db.query(models.User).filter(models.User.email == request.email).first():
            res = {
                "success": False,
                "message": "Email already registered. Please login."
            }
            print(f"[AUTH ROUTE LOG] POST /register-start response: {res}")
            return res
        
        # Generate code
        v_code = ''.join(random.choices(string.digits, k=6))
        
        # Save to PendingVerification
        pending = db.query(models.PendingVerification).filter(models.PendingVerification.email == request.email).first()
        if pending:
            pending.code = v_code
            pending.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)
        else:
            pending = models.PendingVerification(
                email=request.email,
                code=v_code,
                expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)
            )
            db.add(pending)
        
        db.commit()
        
        # Send Email
        email_sent = email_service.send_verification_email(request.email, v_code)
        if not email_sent:
            print(f"--- FAILED to send verification email to {request.email} ---")
            res = {
                "success": False,
                "message": "Failed to send verification email. Please check your SMTP settings or try again."
            }
            print(f"[AUTH ROUTE LOG] POST /register-start response: {res}")
            return res
        
        res = {
            "success": True,
            "message": "Verification code sent to your email.",
            "email": request.email
        }
        print(f"[AUTH ROUTE LOG] POST /register-start response: {res}")
        return res
    except Exception as e:
        print(f"[AUTH ROUTE LOG] POST /register-start error: {str(e)}")
        import traceback
        traceback.print_exc()
        res = {
            "success": False,
            "message": f"Registration failed: {str(e)}"
        }
        print(f"[AUTH ROUTE LOG] POST /register-start response (fallback): {res}")
        return res

@router.post("/register-verify", response_model=schemas.UserResponse)
def register_verify(request: schemas.RegisterVerifyRequest, db: Session = Depends(database.get_db)):
    print(f"[AUTH ROUTE LOG] POST /register-verify request: name={request.name}, email={request.email}, code={request.code}")
    
    # 1. Verify code
    pending = db.query(models.PendingVerification).filter(models.PendingVerification.email == request.email).first()
    if not pending or pending.code != request.code:
        print(f"[AUTH ROUTE LOG] POST /register-verify failed: Invalid code")
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    if datetime.now(timezone.utc).replace(tzinfo=None) > pending.expires_at.replace(tzinfo=None):
        print(f"[AUTH ROUTE LOG] POST /register-verify failed: Expired code")
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    # 2. Create User
    new_user = models.User(
        name=request.name,
        email=request.email,
        password_hash=auth.get_password_hash(request.password),
        is_verified=1 # verified immediately
    )
    db.add(new_user)
    
    # 3. Cleanup pending
    db.delete(pending)
    
    try:
        db.commit()
        db.refresh(new_user)
        print(f"[AUTH ROUTE LOG] POST /register-verify response: user_id={new_user.id}, email={new_user.email}")
        return new_user
    except Exception as e:
        db.rollback()
        print(f"[AUTH ROUTE LOG] POST /register-verify error: {str(e)}")
        raise HTTPException(status_code=400, detail="Registration failed. Email might have been registered in the meantime.")

@router.post("/register-complete", response_model=schemas.UserResponse)
def register_complete(request: schemas.RegisterVerifyRequest, db: Session = Depends(database.get_db)):
    print(f"[AUTH ROUTE LOG] POST /register-complete request: name={request.name}, email={request.email}, code={request.code}")
    return register_verify(request, db)


@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    print(f"[AUTH ROUTE LOG] POST /register request: name={user.name}, email={user.email}")
    try:
        existing_user = db.query(models.User).filter(models.User.email == user.email).first()
        if existing_user:
            if existing_user.is_verified:
                print(f"[AUTH ROUTE LOG] POST /register failed: Email already registered")
                raise HTTPException(status_code=400, detail="Email already registered")
            else:
                # If user is not verified, allow them to register again (resend code)
                v_code = ''.join(random.choices(string.digits, k=6))
                existing_user.name = user.name
                existing_user.password_hash = auth.get_password_hash(user.password)
                existing_user.verification_code = v_code
                existing_user.verification_code_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)
                db.commit()
                db.refresh(existing_user)
                
                # Send Real Email
                email_sent = email_service.send_verification_email(user.email, v_code)
                if not email_sent:
                    print(f"--- FALLBACK: Verification code for {user.email} is {v_code} ---")
                
                print(f"[AUTH ROUTE LOG] POST /register response: user_id={existing_user.id}, email={existing_user.email}")
                return existing_user
        
        # Generate 6-digit verification code
        v_code = ''.join(random.choices(string.digits, k=6))
        print(f"--- DEBUG: Generating verification code for {user.email}: {v_code} ---")
        
        new_user = models.User(
            name=user.name, 
            email=user.email, 
            password_hash=auth.get_password_hash(user.password),
            verification_code=v_code,
            verification_code_expires=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10),
            is_verified=0
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Double check if saved
        if not new_user.verification_code:
            print(f"--- WARNING: Verification code still null after refresh for {user.email}! Re-assigning... ---")
            new_user.verification_code = v_code
            db.commit()
            db.refresh(new_user)

        print(f"--- DEBUG: Final DB verification_code for {user.email}: {new_user.verification_code} ---")
        
        # Send Real Email
        email_sent = email_service.send_verification_email(user.email, v_code)
        if not email_sent:
            print(f"--- FALLBACK: Verification code for {user.email} is {v_code} ---")
        
        print(f"[AUTH ROUTE LOG] POST /register response: user_id={new_user.id}, email={new_user.email}")
        return new_user
    except HTTPException as he:
        print(f"[AUTH ROUTE LOG] POST /register HTTPException: {he.detail}")
        raise he
    except Exception as e:
        print(f"--- CRITICAL REGISTER ERROR: {str(e)} ---")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-email")
def verify_email(request: schemas.EmailVerificationRequest, db: Session = Depends(database.get_db)):
    print(f"[AUTH ROUTE LOG] POST /verify-email request: email={request.email}, code={request.code}")
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        print(f"[AUTH ROUTE LOG] POST /verify-email failed: User not found")
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        res = {"detail": "Email already verified"}
        print(f"[AUTH ROUTE LOG] POST /verify-email response: {res}")
        return res

    if not user.verification_code or user.verification_code != request.code:
        print(f"[AUTH ROUTE LOG] POST /verify-email failed: Invalid verification code")
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if not user.verification_code_expires or datetime.now(timezone.utc).replace(tzinfo=None) > user.verification_code_expires.replace(tzinfo=None):
        print(f"[AUTH ROUTE LOG] POST /verify-email failed: Verification code expired")
        raise HTTPException(status_code=400, detail="Verification code expired. Please register again.")
    
    user.is_verified = 1
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()
    res = {"detail": "Email verified successfully"}
    print(f"[AUTH ROUTE LOG] POST /verify-email response: {res}")
    return res

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    print(f"[AUTH ROUTE LOG] POST /login request: email={user_credentials.email}")
    try:
        print(f"Login attempt: {user_credentials.email}")
        user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
        
        if not user:
            print(f"[AUTH ROUTE LOG] POST /login failed: Account not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Account not found. Please sign up first."
            )
        
        if not auth.verify_password(user_credentials.password, user.password_hash):
            print(f"Password mismatch for {user_credentials.email}")
            print(f"[AUTH ROUTE LOG] POST /login failed: Incorrect password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Incorrect password"
            )
        
        if user.is_verified == 0:
            print(f"[AUTH ROUTE LOG] POST /login failed: Email not verified")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Email not verified. Please verify your email first."
            )
        
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        print(f"[AUTH ROUTE LOG] POST /login response: user_id={user.id}, email={user.email}, token_type=bearer")
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": user
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"--- CRITICAL LOGIN ERROR: {str(e)} ---")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    print(f"[AUTH ROUTE LOG] GET /me request: current_user={current_user.email}")
    print(f"[AUTH ROUTE LOG] GET /me response: user_id={current_user.id}, email={current_user.email}")
    return current_user

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    print(f"[AUTH ROUTE LOG] POST /forgot-password request: email={request.email}")
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # For security, don't reveal if user exists. Just return OK.
        res = {"detail": "If the account exists, a reset code has been sent."}
        print(f"[AUTH ROUTE LOG] POST /forgot-password response: {res}")
        return res
    
    # Generate 6-digit code
    code = ''.join(random.choices(string.digits, k=6))
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)
    
    db.commit()
    
    # Send Real Email
    email_sent = email_service.send_reset_password_email(request.email, code)
    if not email_sent:
        print(f"--- FALLBACK: Reset code for {request.email} is {code} ---")
        res = {"detail": "Failed to send email. Code printed to console for demo."}
        print(f"[AUTH ROUTE LOG] POST /forgot-password response (fallback): {res}")
        return res

    res = {"detail": "Reset code sent to your email."}
    print(f"[AUTH ROUTE LOG] POST /forgot-password response: {res}")
    return res

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    print(f"[AUTH ROUTE LOG] POST /reset-password request: email={request.email}, code={request.code}")
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    print(f"--- DEBUG: Reset Password Attempt for {request.email} ---")
    if user:
        print(f"--- DEBUG: Stored Code: {user.verification_code}, Provided Code: {request.code} ---")
        if user.verification_code_expires:
             print(f"--- DEBUG: Code Expires at: {user.verification_code_expires}, Current Time: {datetime.now(timezone.utc).replace(tzinfo=None)} ---")
    else:
        print(f"--- DEBUG: User {request.email} not found ---")

    if not user or user.verification_code != request.code:
        print(f"[AUTH ROUTE LOG] POST /reset-password failed: Invalid reset code")
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    if not user.verification_code_expires or datetime.now(timezone.utc).replace(tzinfo=None) > user.verification_code_expires.replace(tzinfo=None):
         print(f"[AUTH ROUTE LOG] POST /reset-password failed: Reset code expired")
         raise HTTPException(status_code=400, detail="Reset code expired")
    
    user.password_hash = auth.get_password_hash(request.new_password)
    user.verification_code = None
    user.verification_code_expires = None
    
    db.commit()
    res = {"detail": "Password reset successful"}
    print(f"[AUTH ROUTE LOG] POST /reset-password response: {res}")
    return res

@router.get("/diagnostic-users")
def diagnostic_users(db: Session = Depends(database.get_db)):
    try:
        users = db.query(models.User).all()
        return [{"id": u.id, "email": u.email, "is_verified": u.is_verified} for u in users]
    except Exception as e:
        return {"error": str(e)}
