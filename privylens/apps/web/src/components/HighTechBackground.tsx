import React from 'react';

export function HighTechBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Animated grid */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Scanning lines */}
      <div className="absolute inset-0">
        <div
          className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
          style={{
            animation: 'scanVertical 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent"
          style={{
            animation: 'scanHorizontal 12s ease-in-out infinite',
          }}
        />
      </div>

      {/* Corner indicators */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-400/30 animate-pulse" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-400/30 animate-pulse" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-400/30 animate-pulse" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-400/30 animate-pulse" />

      {/* Data streams */}
      <div className="absolute right-8 top-1/4 opacity-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="mb-2 flex space-x-1"
            style={{
              animation: `dataStream ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {Array.from({ length: 8 }).map((_, j) => (
              <div
                key={j}
                className="w-1 h-1 bg-green-400 rounded-full"
                style={{
                  animationDelay: `${j * 0.1}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes scanVertical {
          0%,
          100% {
            top: -2px;
            opacity: 0;
          }
          50% {
            top: 50%;
            opacity: 1;
          }
        }

        @keyframes scanHorizontal {
          0%,
          100% {
            left: -2px;
            opacity: 0;
          }
          50% {
            left: 50%;
            opacity: 1;
          }
        }

        @keyframes dataStream {
          0%,
          100% {
            opacity: 0.1;
            transform: translateX(0);
          }
          50% {
            opacity: 0.8;
            transform: translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 rounded-full border-2 border-gray-600"></div>
      <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
      <div
        className="absolute inset-1 rounded-full border border-purple-500 border-r-transparent animate-spin animation-reverse"
        style={{ animationDuration: '1.5s' }}
      ></div>
    </div>
  );
}

export function GlowEffect({
  children,
  color = 'blue',
}: {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'shadow-blue-500/20 hover:shadow-blue-500/40',
    green: 'shadow-green-500/20 hover:shadow-green-500/40',
    purple: 'shadow-purple-500/20 hover:shadow-purple-500/40',
    red: 'shadow-red-500/20 hover:shadow-red-500/40',
  };

  return (
    <div
      className={`transition-all duration-300 ${colorClasses[color]} shadow-2xl hover:shadow-3xl`}
    >
      {children}
    </div>
  );
}
