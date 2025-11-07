# Face-API Models

This directory should contain the face-api.js model files.

## Download Models

Download the required models from the face-api.js repository:

1. **tiny_face_detector_model-weights_manifest.json** and **tiny_face_detector_model-shard1**
2. **face_landmark_68_model-weights_manifest.json** and **face_landmark_68_model-shard1**
3. **face_recognition_model-weights_manifest.json** and **face_recognition_model-shard1**
4. **face_expression_model-weights_manifest.json** and **face_expression_model-shard1**

## Quick Setup

You can download all models from:
https://github.com/justadudewhohacks/face-api.js-models

Or use this command to download them:

```bash
# Using curl (Linux/Mac)
curl -L https://github.com/justadudewhohacks/face-api.js-models/archive/refs/heads/master.zip -o models.zip
unzip models.zip
cp -r face-api.js-models-master/* public/models/

# Or download manually from:
# https://github.com/justadudewhohacks/face-api.js-models/tree/master
```

The models should be placed directly in this `public/models/` directory.

