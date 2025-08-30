import React, { useState, useEffect } from 'react';

interface ImageProcessingPipelineProps {
  originalUrl: string;
  redactedUrl: string | null;
  isProcessing: boolean;
  facesFound: number;
  onComplete?: () => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export function ImageProcessingPipeline({
  originalUrl,
  redactedUrl,
  isProcessing,
  facesFound,
  onComplete,
}: ImageProcessingPipelineProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'upload',
      label: 'Image Upload',
      description: 'Securely uploading image...',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
      duration: 800,
      status: 'pending',
    },
    {
      id: 'analysis',
      label: 'AI Analysis',
      description: 'Scanning for faces using TinyFaceDetector...',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      duration: 1500,
      status: 'pending',
    },
    {
      id: 'detection',
      label: 'Face Detection',
      description: 'Identifying facial features...',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      duration: 1200,
      status: 'pending',
    },
    {
      id: 'redaction',
      label: 'Privacy Protection',
      description: 'Applying pixel blur to detected faces...',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      duration: 1000,
      status: 'pending',
    },
    {
      id: 'complete',
      label: 'Complete',
      description: `${facesFound} face${facesFound !== 1 ? 's' : ''} protected`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      duration: 500,
      status: 'pending',
    },
  ]);

  useEffect(() => {
    if (!isProcessing) {
      // Reset or complete all steps
      if (redactedUrl) {
        setSteps((prev) => prev.map((step) => ({ ...step, status: 'completed' })));
        setCurrentStep(steps.length);
        onComplete?.();
      }
      return;
    }

    // Start the animation sequence
    let stepIndex = 0;

    const processStep = () => {
      if (stepIndex >= steps.length) return;

      setSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === stepIndex ? 'active' : index < stepIndex ? 'completed' : 'pending',
        })),
      );
      setCurrentStep(stepIndex);

      setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            status: index <= stepIndex ? 'completed' : 'pending',
          })),
        );

        stepIndex++;
        if (stepIndex < steps.length) {
          setTimeout(processStep, 200);
        }
      }, steps[stepIndex]?.duration || 1000);
    };

    // Start after a small delay
    setTimeout(processStep, 300);
  }, [isProcessing, redactedUrl, facesFound]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 animate-pulse"></span>
          Privacy Processing Pipeline
        </h3>
        <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">AI-Powered</div>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-4">
            {/* Step Icon */}
            <div
              className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${step.status === 'pending' ? 'bg-gray-700 text-gray-400' : ''}
              ${step.status === 'active' ? 'bg-blue-500 text-white animate-pulse' : ''}
              ${step.status === 'completed' ? 'bg-green-500 text-white' : ''}
              ${step.status === 'error' ? 'bg-red-500 text-white' : ''}
            `}
            >
              {step.status === 'active' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                step.icon
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1">
              <div
                className={`
                font-medium transition-colors duration-300
                ${step.status === 'pending' ? 'text-gray-400' : ''}
                ${step.status === 'active' ? 'text-blue-400' : ''}
                ${step.status === 'completed' ? 'text-green-400' : ''}
                ${step.status === 'error' ? 'text-red-400' : ''}
              `}
              >
                {step.label}
              </div>
              <div
                className={`
                text-sm transition-colors duration-300
                ${step.status === 'pending' ? 'text-gray-500' : ''}
                ${step.status === 'active' ? 'text-blue-300' : ''}
                ${step.status === 'completed' ? 'text-green-300' : ''}
                ${step.status === 'error' ? 'text-red-300' : ''}
              `}
              >
                {step.id === 'complete' && facesFound > 0
                  ? `${facesFound} face${facesFound !== 1 ? 's' : ''} protected`
                  : step.description}
              </div>
            </div>

            {/* Progress Indicator */}
            <div
              className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${step.status === 'pending' ? 'bg-gray-600' : ''}
              ${step.status === 'active' ? 'bg-blue-400 animate-ping' : ''}
              ${step.status === 'completed' ? 'bg-green-400' : ''}
              ${step.status === 'error' ? 'bg-red-400' : ''}
            `}
            ></div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Start</span>
          <span>{Math.round((currentStep / (steps.length - 1)) * 100)}%</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Image Transition */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-400 mb-2">Original</div>
          <div className="relative">
            <img
              src={originalUrl}
              alt="Original"
              className="w-full h-32 object-cover rounded-lg border border-gray-600"
            />
            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
              Unprotected
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-2">Protected</div>
          <div className="relative">
            <img
              src={redactedUrl || originalUrl}
              alt="Protected"
              className={`w-full h-32 object-cover rounded-lg border border-gray-600 transition-all duration-1000 ${
                isProcessing && !redactedUrl ? 'filter blur-sm opacity-75' : ''
              }`}
            />
            {redactedUrl && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                ✓ Protected
              </div>
            )}
            {isProcessing && !redactedUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                <div className="bg-blue-500/90 text-white px-3 py-1 rounded text-xs">
                  Processing...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
