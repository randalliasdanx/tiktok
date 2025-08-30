import * as faceapi from 'face-api.js';

let isLoaded = false;

export async function loadFaceDetector(): Promise<void> {
  if (isLoaded) return;
  
  try {
    // Load only TinyFaceDetector for simplicity and reliability
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    isLoaded = true;
    console.log('TinyFaceDetector loaded successfully');
  } catch (error) {
    console.error('Failed to load TinyFaceDetector:', error);
    throw error;
  }
}

export async function detectFaces(img: HTMLImageElement): Promise<
  { x: number; y: number; w: number; h: number; score: number; model: string }[]
> {
  await loadFaceDetector();
  
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  
  try {
    // Use only TinyFaceDetector for simplicity
    const detections = await faceapi.detectAllFaces(
      img, 
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
    );
    
    console.log('TinyFaceDetector found:', detections.length, 'faces');
    
    return detections.map((detection) => ({
      x: detection.box.x / W,
      y: detection.box.y / H,
      w: detection.box.width / W,
      h: detection.box.height / H,
      score: detection.score,
      model: 'tiny',
    }));
  } catch (error) {
    console.error('Face detection failed:', error);
    return [];
  }
}


