import React, { useState, useEffect } from 'react';

interface AnimatedTextRedactionProps {
  originalText: string;
  maskedText: string;
  spans: Array<{ start: number; end: number; label: string }>;
  animationDuration?: number;
  onComplete?: () => void;
}

interface TextSegment {
  text: string;
  isRedacted: boolean;
  label?: string;
  delay: number;
}

export function AnimatedTextRedaction({
  originalText,
  maskedText,
  spans,
  animationDuration = 2000,
  onComplete,
}: AnimatedTextRedactionProps) {
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Parse the text into segments based on redaction spans
    const textSegments: TextSegment[] = [];
    let lastIndex = 0;

    // Sort spans by start position
    const sortedSpans = [...spans].sort((a, b) => a.start - b.start);

    sortedSpans.forEach((span, index) => {
      // Add text before this span (if any)
      if (span.start > lastIndex) {
        const beforeText = originalText.slice(lastIndex, span.start);
        textSegments.push({
          text: beforeText,
          isRedacted: false,
          delay: index * 200,
        });
      }

      // Add the redacted segment
      const redactedText = originalText.slice(span.start, span.end);
      textSegments.push({
        text: redactedText,
        isRedacted: true,
        label: span.label,
        delay: index * 200 + 100,
      });

      lastIndex = span.end;
    });

    // Add any remaining text
    if (lastIndex < originalText.length) {
      const remainingText = originalText.slice(lastIndex);
      textSegments.push({
        text: remainingText,
        isRedacted: false,
        delay: sortedSpans.length * 200,
      });
    }

    setSegments(textSegments);

    // Start animation sequence
    const totalSteps = textSegments.filter((seg) => seg.isRedacted).length;
    let step = 0;

    const animateNextStep = () => {
      if (step < totalSteps) {
        setCurrentStep(step);
        step++;
        setTimeout(animateNextStep, 400);
      } else {
        setIsAnimating(false);
        onComplete?.();
      }
    };

    setTimeout(animateNextStep, 500);
  }, [originalText, maskedText, spans, onComplete]);

  const getRedactedDisplay = (segment: TextSegment, segmentIndex: number) => {
    const redactedSegments = segments.filter((s) => s.isRedacted);
    const redactedIndex = redactedSegments.findIndex(
      (_, i) => segments.findIndex((s) => s === redactedSegments[i]) === segmentIndex,
    );

    if (redactedIndex === -1) return segment.text;

    const shouldBeAnimated = redactedIndex <= currentStep;

    if (shouldBeAnimated && isAnimating) {
      // Show the redaction animation
      return '[MASKED]';
    } else if (!isAnimating) {
      // Show final redacted state
      return '[MASKED]';
    } else {
      // Show original text
      return segment.text;
    }
  };

  return (
    <div className="relative">
      <div className="text-white leading-relaxed">
        {segments.map((segment, index) => {
          const redactedSegments = segments.filter((s) => s.isRedacted);
          const redactedIndex = redactedSegments.findIndex(
            (_, i) => segments.findIndex((s) => s === redactedSegments[i]) === index,
          );

          const shouldAnimate = segment.isRedacted && redactedIndex <= currentStep && isAnimating;
          const isAnimated = segment.isRedacted && (redactedIndex < currentStep || !isAnimating);

          return (
            <span
              key={index}
              className={`
                transition-all duration-500 relative inline-block
                ${segment.isRedacted ? 'font-medium' : ''}
                ${shouldAnimate ? 'animate-pulse' : ''}
              `}
              style={{
                animationDelay: `${segment.delay}ms`,
              }}
            >
              {segment.isRedacted ? (
                <span className="relative inline-block align-baseline">
                  {/* When not yet masked, show the original text */}
                  {!isAnimated && !shouldAnimate && <>{segment.text}</>}

                  {/* Masked replacement - inline so it doesn't overflow adjacent text */}
                  {(isAnimated || shouldAnimate) && (
                    <span className="relative inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-sm text-xs font-bold leading-none px-1">
                      [MASKED]
                      {/* Scanning effect constrained to the masked label width */}
                      {shouldAnimate && (
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-pulse rounded-sm"></span>
                      )}
                    </span>
                  )}

                  {/* Label tooltip */}
                  {(isAnimated || shouldAnimate) && segment.label && (
                    <span className="absolute -top-5 left-0 bg-gray-800 text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-in fade-in duration-200">
                      {segment.label}
                    </span>
                  )}
                </span>
              ) : (
                segment.text
              )}
            </span>
          );
        })}
      </div>

      {/* Processing indicator */}
      {isAnimating && (
        <div className="absolute right-2 top-2 flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
          <div className="ml-2 text-xs text-blue-400 animate-pulse">Redacting...</div>
        </div>
      )}

      {/* Completion indicator */}
      {!isAnimating && spans.length > 0 && (
        <div className="absolute right-2 top-2 flex items-center animate-in fade-in duration-300">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <div className="ml-2 text-xs text-green-400">Protected</div>
        </div>
      )}
    </div>
  );
}

// Simpler version for cases where we just want to show the final redacted result with subtle animation
export function StaticRedactedText({
  maskedText,
  spans,
}: {
  maskedText: string;
  spans: Array<{ start: number; end: number; label: string }>;
}) {
  return (
    <div className="text-white leading-relaxed relative">
      {maskedText.split(/(\[MASKED\])/).map((part, index) => {
        if (part === '[MASKED]') {
          const spanIndex = Math.floor(index / 2);
          const span = spans[spanIndex];

          return (
            <span key={index} className="relative inline-block group align-baseline">
              <span className="relative inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-sm text-xs font-bold leading-none px-1 animate-in zoom-in duration-300">
                [MASKED]
              </span>
              {span && (
                <span className="absolute -top-5 left-0 bg-gray-800 text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {span.label}
                </span>
              )}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
