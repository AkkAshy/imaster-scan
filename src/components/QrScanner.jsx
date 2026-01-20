import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

const QrScanner = ({ onScanSuccess, onScanError }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  const log = (msg) => {
    console.log('[QrScanner]', msg);
    setDebugInfo(prev => prev + '\n' + msg);
  };

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
        setDebugInfo('Запуск камеры...');

        // Проверяем поддержку mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Браузер не поддерживает доступ к камере. Используйте HTTPS.');
        }

        log('mediaDevices доступен');

        // Пробуем получить доступ к камере
        let stream;
        try {
          // Сначала пробуем заднюю камеру
          log('Запрос задней камеры...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          log('Задняя камера получена');
        } catch (e) {
          // Если не получилось — пробуем любую камеру
          log('Задняя камера недоступна: ' + e.message);
          log('Пробуем любую камеру...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          log('Любая камера получена');
        }

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        const tracks = stream.getVideoTracks();
        log(`Треков: ${tracks.length}`);
        if (tracks.length > 0) {
          const settings = tracks[0].getSettings();
          log(`Разрешение: ${settings.width}x${settings.height}`);
        }

        const video = videoRef.current;
        if (video) {
          log('Привязка стрима к video...');
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('autoplay', 'true');
          video.setAttribute('muted', 'true');
          video.muted = true;

          // Ждём загрузки метаданных
          await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
              log(`Video metadata: ${video.videoWidth}x${video.videoHeight}`);
              resolve();
            };
            video.onerror = (e) => {
              log('Video error: ' + e.message);
              reject(e);
            };
            // Таймаут на случай если событие не сработает
            setTimeout(() => {
              log('Metadata timeout, trying play anyway');
              resolve();
            }, 3000);
          });

          try {
            await video.play();
            log('Video play успешно');
          } catch (playErr) {
            log('Play error: ' + playErr.message);
            // На некоторых браузерах нужно ждать user interaction
          }

          setIsStarting(false);

          // Начинаем сканирование
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          let scanCount = 0;
          const scan = () => {
            if (!mounted || !video) {
              return;
            }

            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
              animationRef.current = requestAnimationFrame(scan);
              return;
            }

            if (scanCount === 0) {
              log(`Первый скан: video ${video.videoWidth}x${video.videoHeight}`);
            }
            scanCount++;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
              log('QR найден: ' + code.data);
              stopCamera();
              if (onScanSuccess) onScanSuccess(code.data);
              return;
            }

            animationRef.current = requestAnimationFrame(scan);
          };

          scan();
        } else {
          log('videoRef.current is null!');
        }
      } catch (err) {
        console.error('Ошибка камеры:', err);
        log('ОШИБКА: ' + err.name + ' - ' + err.message);
        if (mounted) {
          setHasPermission(false);
          // Понятные сообщения об ошибках
          let errorMessage = 'Не удалось получить доступ к камере';
          if (err.name === 'NotAllowedError') {
            errorMessage = 'Доступ к камере запрещён. Разрешите доступ в настройках браузера.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'Камера не найдена на устройстве.';
          } else if (err.name === 'NotReadableError') {
            errorMessage = 'Камера занята другим приложением.';
          } else if (err.name === 'OverconstrainedError') {
            errorMessage = 'Камера не поддерживает запрошенные параметры.';
          } else if (err.name === 'SecurityError' || err.message?.includes('HTTPS')) {
            errorMessage = 'Камера требует безопасное соединение (HTTPS).';
          }
          setError(errorMessage);
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
  }, [onScanSuccess, onScanError, stopCamera, retryCount]);

  const handleRetry = () => {
    setHasPermission(null);
    setError(null);
    setIsStarting(true);
    setRetryCount(c => c + 1);
  };

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
            autoPlay
            muted
            style={{ minHeight: '300px' }}
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

          {/* Debug info (временно) */}
          {debugInfo && (
            <div className="absolute top-2 left-2 right-2 bg-black/70 text-xs text-green-400 font-mono p-2 rounded max-h-24 overflow-auto">
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}
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
          <p className="text-xs text-slate-500 mb-4">Разрешите доступ к камере в настройках браузера</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
};

export default QrScanner;
