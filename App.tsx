
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ArrowRight, Loader2, Info, ExternalLink, Map as MapIcon } from 'lucide-react';
import { calculateDistance } from './services/geminiService';
import { CalculationResult, GeolocationState } from './types';

const App: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeolocationState>({ lat: null, lng: null, error: null });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeo({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            error: null
          });
        },
        (err) => {
          setGeo(prev => ({ ...prev, error: "Localização não disponível" }));
          console.warn("Geolocation access denied:", err);
        }
      );
    }
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      setError("Por favor, preencha a origem e o destino.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await calculateDistance({ origin, destination }, { lat: geo.lat, lng: geo.lng });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-4">
      {/* Header */}
      <header className="w-full max-w-2xl mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight hidden">
          MapDistance <span className="text-blue-600">AI</span>
        </h1>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-xl">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <form onSubmit={handleCalculate} className="p-8 space-y-6">
            <div className="space-y-4">
              {/* Origin Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Origem</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-300" />
                  </div>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Cidade de origem"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-base font-medium placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Visual Divider */}
              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white p-2 rounded-full border border-slate-50 shadow-sm text-slate-200">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </div>
              </div>

              {/* Destination Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Destino</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Navigation className="h-5 w-5 text-slate-300" />
                  </div>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Cidade de destino"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-base font-medium placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                <Info className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-5 px-6 rounded-2xl shadow-lg shadow-blue-100 text-lg font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                "Calcular Distância"
              )}
            </button>
          </form>

          {/* Results Area */}
          {result && (
            <div className="bg-slate-50/50 border-t border-slate-50 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Resultado da Pesquisa</h2>
              </div>
              
              <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm mb-6 flex items-center justify-center">
                <p className="text-slate-900 text-3xl font-black tracking-tight">
                  {result.text}
                </p>
              </div>

              {result.sources.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Referências no Mapa</span>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-slate-100 text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-500 transition-all shadow-sm"
                      >
                        {source.title || "Abrir no Maps"}
                        <ExternalLink className="ml-2 w-3.5 h-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="mt-12 text-center">
          <p className="text-slate-300 text-[10px] font-black tracking-widest uppercase">
            MapDistance AI • © {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
