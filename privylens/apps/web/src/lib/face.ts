import * as faceapi from 'face-api.js';

let isLoaded = false;

export async function loadFaceDetector(): Promise<void> {
  if (isLoaded) return;
  
  // Use TinyFaceDetector - smaller and more reliable
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  
  isLoaded = true;
}

export async function detectFaces(img: HTMLImageElement): Promise<
  { x: number; y: number; w: number; h: number; score: number }[]
> {
  await loadFaceDetector();
  
  // Detect faces with TinyFaceDetector
  const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }));
  
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  
  return detections.map((detection) => ({
    x: detection.box.x / W,
    y: detection.box.y / H,
    w: detection.box.width / W,
    h: detection.box.height / H,
    score: detection.score,
  }));
}


