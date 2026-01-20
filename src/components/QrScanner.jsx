import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

const QrScanner = ({ onScanSuccess, onScanError }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        setIsStarting(true);
        setError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          await video.play();
          setIsStarting(false);

          // Начинаем сканирование
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          const scan = () => {
            if (!mounted || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
              animationRef.current = requestAnimationFrame(scan);
              return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
              stopCamera();
              if (onScanSuccess) onScanSuccess(code.data);
              return;
            }

            animationRef.current = requestAnimationFrame(scan);
          };

          scan();
        }
      } catch (err) {
        console.error('Ошибка камеры:', err);
        if (mounted) {
          setHasPermission(false);
          setError(err.message || 'Не удалось получить доступ к камере');
          setIsStarting(false);
          if (onScanError) onScanError(err);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [onScanSuccess, onScanError, stopCamera]);

  return (
    <div className="w-full h-full">
      {/* Скрытый canvas для обработки */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Загрузка камеры */}
      {isStarting && hasPermission === null && (
        <div className="w-full h-[70vh] rounded-2xl bg-slate-900/50 border border-slate-700 flex flex-col items-center justify-center">
          <div className="cyber-spinner mb-4" />
          <p className="text-slate-400">Запуск камеры...</p>
        </div>
      )}

      {/* Видео с камеры */}
      {hasPermission && (
        <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Кастомная рамка */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Уголки */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

              {/* Линия сканирования */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-line" />
            </div>
          </div>

          {/* Подсказка */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 text-sm text-white bg-black/50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Наведите камеру на QR код</span>
            </div>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {hasPermission === false && (
        <div className="w-full p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-semibold text-red-400 text-lg mb-2">Нет доступа к камере</p>
          <p className="text-sm text-red-400/70 mb-3">{error}</p>
          <p className="text-xs text-slate-500">Разрешите доступ к камере в настройках браузера</p>
        </div>
      )}
    </div>
  );
};

export default QrScanner;
