import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name='hjk6in6j',
    api_key='921656848316314',
    api_secret='oT91XZ4dDJ8y6d6lUufaLAQ0_-0'
)

# create a dummy text file to test upload
with open("test.txt", "w") as f:
    f.write("hello")

try:
    result = cloudinary.uploader.upload(
        "test.txt",
        folder="test",
        resource_type="raw"
    )
    print("SUCCESS")
    print(result.get('secure_url'))
except Exception as e:
    print("FAILED:", str(e))
