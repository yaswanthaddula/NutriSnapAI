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
    try:
        user = db.query(models.User).filter(models.User.email == request.email).first()
        if user:
            return {"exists": True, "message": "Email found."}
        else:
            return {"exists": False, "message": "Email not registered. Please sign up first."}
    except Exception as e:
        print(f"--- ERROR IN /auth/check-email ---")
        print(f"Request email: {request.email}")
        print(f"Exception: {str(e)}")
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
            
        return {"exists": False, "message": "Email not registered. Please sign up first."}

@router.post("/register-start")
def register_start(request: schemas.RegisterStartRequest, db: Session = Depends(database.get_db)):
    # Check if user already exists
    if db.query(models.User).filter(models.User.email == request.email).first():
         raise HTTPException(status_code=400, detail="Email already registered")
    
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
        print(f"--- FALLBACK: Verification code for {request.email} is {v_code} ---")
        return {"message": "Verification code generated (Check console if email fails)"}
    
    return {"message": "Verification code sent to email"}

@router.post("/register-verify", response_model=schemas.UserResponse)
def register_verify(request: schemas.RegisterVerifyRequest, db: Session = Depends(database.get_db)):
    # 1. Verify code
    pending = db.query(models.PendingVerification).filter(models.PendingVerification.email == request.email).first()
    if not pending or pending.code != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    if datetime.now(timezone.utc).replace(tzinfo=None) > pending.expires_at.replace(tzinfo=None):
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
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Registration failed. Email might have been registered in the meantime.")

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    try:
        existing_user = db.query(models.User).filter(models.User.email == user.email).first()
        if existing_user:
            if existing_user.is_verified:
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
        
        return new_user
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"--- CRITICAL REGISTER ERROR: {str(e)} ---")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-email")
def verify_email(request: schemas.EmailVerificationRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"detail": "Email already verified"}

    if not user.verification_code or user.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if not user.verification_code_expires or datetime.now(timezone.utc).replace(tzinfo=None) > user.verification_code_expires.replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="Verification code expired. Please register again.")
    
    user.is_verified = 1
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()
    return {"detail": "Email verified successfully"}

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    try:
        print(f"Login attempt: {user_credentials.email}")
        user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Account not found. Please sign up first."
            )
        
        if not auth.verify_password(user_credentials.password, user.password_hash):
            print(f"Password mismatch for {user_credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Incorrect password"
            )
        
        if user.is_verified == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Email not verified. Please verify your email first."
            )
        
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
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
    return current_user

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # For security, don't reveal if user exists. Just return OK.
        return {"detail": "If the account exists, a reset code has been sent."}
    
    # Generate 6-digit code
    code = ''.join(random.choices(string.digits, k=6))
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10)
    
    db.commit()
    
    # Send Real Email
    email_sent = email_service.send_reset_password_email(request.email, code)
    if not email_sent:
        print(f"--- FALLBACK: Reset code for {request.email} is {code} ---")
        return {"detail": "Failed to send email. Code printed to console for demo."}

    return {"detail": "Reset code sent to your email."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    print(f"--- DEBUG: Reset Password Attempt for {request.email} ---")
    if user:
        print(f"--- DEBUG: Stored Code: {user.verification_code}, Provided Code: {request.code} ---")
        if user.verification_code_expires:
             print(f"--- DEBUG: Code Expires at: {user.verification_code_expires}, Current Time: {datetime.now(timezone.utc).replace(tzinfo=None)} ---")
    else:
        print(f"--- DEBUG: User {request.email} not found ---")

    if not user or user.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    if not user.verification_code_expires or datetime.now(timezone.utc).replace(tzinfo=None) > user.verification_code_expires.replace(tzinfo=None):
         raise HTTPException(status_code=400, detail="Reset code expired")
    
    user.password_hash = auth.get_password_hash(request.new_password)
    user.verification_code = None
    user.verification_code_expires = None
    
    db.commit()
    return {"detail": "Password reset successful"}
