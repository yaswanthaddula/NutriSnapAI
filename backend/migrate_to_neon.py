import os
import sys
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SQLALCHEMY_DATABASE_URL
import models

def migrate():
    print("=== NutriSnap AI PostgreSQL Data Migration ===")
    print(f"Local Database URL: {SQLALCHEMY_DATABASE_URL}")
    
    # Prompt for Neon database URL
    neon_url = input("\nEnter your Neon PostgreSQL DATABASE_URL:\n> ").strip()
    if not neon_url:
        print("Error: No Neon URL provided. Exiting.")
        return
        
    if neon_url == SQLALCHEMY_DATABASE_URL:
        print("Error: Target Neon URL is the same as the local database URL. Exiting.")
        return

    try:
        # Create engines and sessionmakers
        local_engine = create_engine(SQLALCHEMY_DATABASE_URL)
        neon_engine = create_engine(neon_url)
        
        LocalSession = sessionmaker(bind=local_engine)
        NeonSession = sessionmaker(bind=neon_engine)
        
        local_db = LocalSession()
        neon_db = NeonSession()
        
        # Test connections
        local_db.execute(models.Base.metadata.tables['users'].select().limit(1))
        print("✔ Connected to local database successfully")
        
        # Ensure Neon tables exist
        models.Base.metadata.create_all(bind=neon_engine)
        print("✔ Connected to Neon database & created/verified tables")
        
        # Fetch local users
        local_users = local_db.query(models.User).all()
        print(f"\nFound {len(local_users)} users in local database.")
        
        migrated_users_count = 0
        migrated_profiles_count = 0
        
        for u in local_users:
            # Check if user already exists in Neon database
            exists = neon_db.query(models.User).filter(models.User.email == u.email).first()
            if exists:
                print(f"User '{u.email}' already exists in Neon. Skipping.")
                continue
                
            # Create User copy
            new_user = models.User(
                id=u.id,
                name=u.name,
                email=u.email,
                password_hash=u.password_hash,
                provider=u.provider,
                is_verified=u.is_verified,
                verification_code=u.verification_code,
                verification_code_expires=u.verification_code_expires,
                reset_code=u.reset_code,
                reset_code_expires=u.reset_code_expires,
                created_at=u.created_at
            )
            neon_db.add(new_user)
            neon_db.flush() # Flush to get it into session and preserve user.id
            migrated_users_count += 1
            
            # Fetch local profile for this user
            local_profile = u.profile
            if local_profile:
                # Check if profile already exists in Neon
                p_exists = neon_db.query(models.Profile).filter(models.Profile.user_id == u.id).first()
                if not p_exists:
                    new_profile = models.Profile(
                        id=local_profile.id,
                        user_id=local_profile.user_id,
                        age=local_profile.age,
                        gender=local_profile.gender,
                        weight=local_profile.weight,
                        height=local_profile.height,
                        bmi=local_profile.bmi,
                        goal=local_profile.goal,
                        selected_mode=local_profile.selected_mode,
                        suggested_mode=local_profile.suggested_mode,
                        calorie_target=local_profile.calorie_target,
                        protein_target=local_profile.protein_target
                    )
                    neon_db.add(new_profile)
                    migrated_profiles_count += 1
                    
        neon_db.commit()
        print(f"\n✔ Migration completed successfully!")
        print(f"- Migrated Users: {migrated_users_count}")
        print(f"- Migrated Profiles: {migrated_profiles_count}")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {str(e)}")
        if 'neon_db' in locals():
            neon_db.rollback()
    finally:
        if 'local_db' in locals():
            local_db.close()
        if 'neon_db' in locals():
            neon_db.close()

if __name__ == "__main__":
    migrate()
