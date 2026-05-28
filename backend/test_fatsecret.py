import httpx
import os
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("FATSECRET_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("FATSECRET_CLIENT_SECRET", "")

# Test both common FatSecret token URLs
URLS = [
    "https://platform.fatsecret.com/connect/token",
    "https://oauth.fatsecret.com/connect/token"
]

async def test_auth():
    print(f"Testing ID: {CLIENT_ID}")
    print(f"Testing Secret: {CLIENT_SECRET}")
    
    async with httpx.AsyncClient() as client:
        for url in URLS:
            print(f"\n--- Testing URL: {url} ---")
            
            # Method 1: Basic Auth (Header)
            try:
                print("Method 1: Basic Auth + grant_type in body...")
                resp = await client.post(
                    url,
                    auth=(CLIENT_ID, CLIENT_SECRET),
                    data={"grant_type": "client_credentials", "scope": "basic"},
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                print(f"Status: {resp.status_code}")
                print(f"Body: {resp.text}")
            except Exception as e:
                print(f"Error: {e}")

            # Method 2: Credentials in body
            try:
                print("\nMethod 2: Credentials directly in body...")
                resp = await client.post(
                    url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": CLIENT_ID,
                        "client_secret": CLIENT_SECRET,
                        "scope": "basic"
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                print(f"Status: {resp.status_code}")
                print(f"Body: {resp.text}")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_auth())
