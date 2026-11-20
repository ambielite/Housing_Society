const fs = require('node:fs/promises');
const path = require('node:path');
const Module = require('node:module');
const sharp = require('sharp');
const tf = require('@tensorflow/tfjs');

// Use TensorFlow.js's pure JavaScript CPU backend. The face-api Node entrypoint
// normally imports the native tfjs-node package; the face matcher only needs
// TensorFlow tensors, so route that import to the regular tfjs runtime instead.
const originalModuleLoad = Module._load;
let faceapi;
try {
  Module._load = function loadFaceApiRuntime(request, parent, isMain) {
    if (request === '@tensorflow/tfjs-node') return tf;
    return originalModuleLoad.call(this, request, parent, isMain);
  };
  faceapi = require('@vladmandic/face-api/dist/face-api.node.js');
} finally {
  Module._load = originalModuleLoad;
}

const MODEL_DIRECTORY = path.resolve(
  __dirname,
  '../../../assets/face-recognition-model',
);
const PROFILE_PHOTO_PREFIX = '/uploads/profile-pictures/';
const MAX_CACHED_PROFILE_DESCRIPTORS = 64;
// Keep only profile templates in process memory. Selfies are never cached.
const profileDescriptorCache = new Map();
let modelLoad;

class FaceVerificationError extends Error {
  constructor(code, message, statusCode = 401) {
    super(message);
    this.name = 'FaceVerificationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function ensureModelsLoaded() {
  if (!modelLoad) {
    modelLoad = (async () => {
      await tf.setBackend('cpu');
      await tf.ready();
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_DIRECTORY),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_DIRECTORY),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_DIRECTORY),
      ]);
    })();
  }

  try {
    await modelLoad;
  } catch (error) {
    modelLoad = null;
    throw new FaceVerificationError(
      'FACE_VERIFICATION_UNAVAILABLE',
      'Face verification is temporarily unavailable. Please try again later.',
      503,
    );
  }
}

async function descriptorForImage(imageBytes, code, message) {
  let imageTensor;
  try {
    const { data, info } = await sharp(imageBytes, {
      limitInputPixels: 20_000_000,
    })
      .rotate()
      // 640px is sufficient for a centered selfie while avoiding needlessly
      // expensive CPU inference on full-resolution camera images.
      .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
      .removeAlpha()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (info.channels !== 3 || info.width < 80 || info.height < 80) {
      throw new Error('Image dimensions are not suitable for face matching.');
    }

    imageTensor = tf.tensor3d(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
      [info.height, info.width, info.channels],
      'int32',
    );
    const faces = await faceapi
      .detectAllFaces(
        imageTensor,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35, maxResults: 2 }),
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (faces.length !== 1) {
      throw new FaceVerificationError(code, message);
    }
    return faces[0].descriptor;
  } catch (error) {
    if (error instanceof FaceVerificationError) throw error;
    throw new FaceVerificationError(code, message);
  } finally {
    imageTensor?.dispose();
  }
}

function storedProfilePhotoPath(profilePictureUrl) {
  if (typeof profilePictureUrl !== 'string' ||
      !profilePictureUrl.startsWith(PROFILE_PHOTO_PREFIX)) {
    throw new FaceVerificationError(
      'PROFILE_PHOTO_UNAVAILABLE',
      'Your profile photo is unavailable for face verification. Please contact your administrator.',
    );
  }

  const filename = path.basename(decodeURIComponent(profilePictureUrl.split('?')[0]));
  if (!filename || filename === '.' || filename === path.sep) {
    throw new FaceVerificationError(
      'PROFILE_PHOTO_UNAVAILABLE',
      'Your profile photo is unavailable for face verification. Please contact your administrator.',
    );
  }

  const photoPath = path.resolve(process.cwd(), 'uploads', 'profile-pictures', filename);
  const photoDirectory = path.resolve(process.cwd(), 'uploads', 'profile-pictures') + path.sep;
  if (!photoPath.startsWith(photoDirectory)) {
    throw new FaceVerificationError(
      'PROFILE_PHOTO_UNAVAILABLE',
      'Your profile photo is unavailable for face verification. Please contact your administrator.',
    );
  }

  return photoPath;
}

async function getStoredProfileDescriptor(profilePictureUrl) {
  const photoPath = storedProfilePhotoPath(profilePictureUrl);
  let stat;
  try {
    stat = await fs.stat(photoPath);
  } catch (error) {
    throw new FaceVerificationError(
      'PROFILE_PHOTO_UNAVAILABLE',
      'Your profile photo is unavailable for face verification. Please contact your administrator.',
    );
  }

  const pathKey = `${photoPath}:`;
  const cacheKey = `${pathKey}${stat.size}:${stat.mtimeMs}`;
  const cached = profileDescriptorCache.get(cacheKey);
  if (cached) {
    // Refresh insertion order so frequently used guards stay in the small LRU.
    profileDescriptorCache.delete(cacheKey);
    profileDescriptorCache.set(cacheKey, cached);
    return cached;
  }

  // A changed photo invalidates the previous in-memory descriptor for this path.
  for (const [key, descriptor] of profileDescriptorCache) {
    if (key.startsWith(pathKey)) {
      descriptor.fill(0);
      profileDescriptorCache.delete(key);
    }
  }

  let photoBytes;
  let descriptor;
  try {
    photoBytes = await fs.readFile(photoPath);
    descriptor = await descriptorForImage(
      photoBytes,
      'PROFILE_PHOTO_UNUSABLE',
      'Your profile photo cannot be used for face verification. Please contact your administrator.',
    );
    const cachedDescriptor = Float32Array.from(descriptor);
    descriptor.fill(0);

    if (profileDescriptorCache.size >= MAX_CACHED_PROFILE_DESCRIPTORS) {
      const oldestKey = profileDescriptorCache.keys().next().value;
      profileDescriptorCache.get(oldestKey)?.fill(0);
      profileDescriptorCache.delete(oldestKey);
    }
    profileDescriptorCache.set(cacheKey, cachedDescriptor);
    return cachedDescriptor;
  } finally {
    photoBytes?.fill(0);
    descriptor?.fill(0);
  }
}

async function verifySecurityGuardFace({ selfieBytes, selfieMimeType, profilePictureUrl }) {
  if (!Buffer.isBuffer(selfieBytes) || selfieBytes.length === 0 || selfieBytes.length > 1_500_000) {
    throw new FaceVerificationError(
      'INVALID_SECURITY_SELFIE',
      'Take a clear selfie before signing in as a guard.',
      400,
    );
  }
  if (!['image/jpeg', 'image/png'].includes(selfieMimeType)) {
    throw new FaceVerificationError(
      'INVALID_SECURITY_SELFIE',
      'Take a clear selfie before signing in as a guard.',
      400,
    );
  }

  let referenceDescriptor;
  let selfieDescriptor;
  try {
    await ensureModelsLoaded();
    referenceDescriptor = await getStoredProfileDescriptor(profilePictureUrl);
    selfieDescriptor = await descriptorForImage(
      selfieBytes,
      'FACE_NOT_CLEAR',
      'No clear face was found. Center your face and take the selfie again.',
    );

    const distance = faceapi.euclideanDistance(referenceDescriptor, selfieDescriptor);
    const configuredThreshold = Number(process.env.FACE_MATCH_MAX_DISTANCE || 0.5);
    const threshold = Number.isFinite(configuredThreshold)
      ? Math.min(Math.max(configuredThreshold, 0.35), 0.6)
      : 0.5;

    if (distance > threshold) {
      throw new FaceVerificationError(
        'FACE_NOT_MATCHED',
        'Face not matched. Please take your picture again.',
      );
    }
  } finally {
    selfieBytes.fill(0);
    selfieDescriptor?.fill(0);
  }
}

module.exports = { FaceVerificationError, verifySecurityGuardFace };
