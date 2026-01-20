import { useState } from 'react';
import QrScanner from './components/QrScanner';
import EquipmentCard from './components/EquipmentCard';
import { scanEquipment } from './services/api';
import './index.css';

function App() {
  const [scanResult, setScanResult] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScanSuccess = async (decodedText) => {
    setScanResult(decodedText);
    setLoading(true);
    setError(null);

    try {
      const result = await scanEquipment(decodedText);

      if (result.success) {
        setEquipment(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ошибка при получении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setEquipment(null);
    setError(null);
  };

  return (
    <div className="min-h-screen matrix-bg flex flex-col">
      {/* Хедер */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-600/20" />
        <div className="relative px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-[2px] pulse-glow">
              <div className="w-full h-full rounded-xl bg-[#0a0a0f] flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
            <h1 className="text-lg font-bold gradient-text">INVENTORY SCANNER</h1>
          </div>
        </div>
        <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </header>

      {/* Контент */}
      <main className="flex-1 flex flex-col p-4 pb-20">
        {/* Сканер */}
        {!scanResult && !equipment && (
          <div className="flex-1 flex flex-col">
            <QrScanner
              onScanSuccess={handleScanSuccess}
              onScanError={(err) => setError(err.message)}
            />
          </div>
        )}

        {/* Загрузка */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="tech-card p-10 flex flex-col items-center">
              <div className="cyber-spinner mb-6" />
              <p className="text-white font-medium mb-2">Загрузка данных...</p>
              <p className="text-sm text-slate-500 font-mono">{scanResult}</p>
            </div>
          </div>
        )}

        {/* Ошибка */}
        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
            <div className="tech-card overflow-hidden w-full">
              <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 p-6 text-center border-b border-red-500/20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-400 font-semibold text-lg">{error}</p>
              </div>
              <div className="p-5">
                {scanResult && (
                  <p className="text-sm text-slate-500 mb-4 text-center">
                    Код: <span className="font-mono text-slate-300">{scanResult}</span>
                  </p>
                )}
                <button onClick={handleScanAgain} className="neon-button w-full flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Сканировать снова
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Результат */}
        {equipment && !loading && (
          <div className="flex-1 max-w-lg mx-auto w-full">
            <EquipmentCard equipment={equipment} onScanAgain={handleScanAgain} />
          </div>
        )}
      </main>

      {/* Футер */}
      <footer className="fixed bottom-0 left-0 right-0 py-2 text-center bg-[#0a0a0f]/80 backdrop-blur-lg border-t border-slate-800">
        <p className="text-xs text-slate-600">
          <span className="text-cyan-500">●</span> INVENTORY MASTER v2.0
        </p>
      </footer>
    </div>
  );
}

export default App;
