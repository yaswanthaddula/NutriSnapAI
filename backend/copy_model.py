import os
import shutil
from ultralytics import YOLO # type: ignore

os.makedirs('c:\\NutriSnapApp\\backend\\models', exist_ok=True)
shutil.copy('c:\\AI_Model_Training\\models\\best.pt', 'c:\\NutriSnapApp\\backend\\models\\best.pt')

model = YOLO('c:\\NutriSnapApp\\backend\\models\\best.pt')
with open('c:\\NutriSnapApp\\backend\\models\\classes.txt', 'w') as f:
    for i in range(len(model.names)):
        f.write(f'{model.names[i]}\n')

req_path = 'c:\\NutriSnapApp\\backend\\requirements.txt'
if os.path.exists(req_path):
    with open(req_path, 'r') as f:
        req = f.read()
    if 'ultralytics' not in req:
        with open(req_path, 'w') as f:
            f.write(req + '\nultralytics\nopencv-python-headless\nPillow\nnumpy\n')
