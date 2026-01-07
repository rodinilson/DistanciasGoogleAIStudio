
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
      setError("Por favor, informe a origem e o destino.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await calculateDistance({ origin, destination }, { lat: geo.lat, lng: geo.lng });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="w-full max-w-4xl mb-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-200 ring-4 ring-white">
            <MapIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          MapDistance <span className="text-blue-600">AI</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Calcule distâncias e rotas inteligentes entre qualquer lugar do mundo.
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-2xl">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden transition-all duration-300">
          <form onSubmit={handleCalculate} className="p-8 md:p-10 space-y-8">
            <div className="space-y-6">
              {/* Origin Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="origin" className="text-sm font-bold text-slate-700 ml-1">
                  Ponto de Origem
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="origin"
                    type="text"
                    autoComplete="off"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Ex: Curitiba, PR"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Swap Icon / Separator */}
              <div className="flex justify-center -my-3 relative z-10">
                <div className="bg-white p-2 rounded-full border border-slate-200 shadow-sm text-slate-300">
                  <ArrowRight className="h-6 w-6 rotate-90" />
                </div>
              </div>

              {/* Destination Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="destination" className="text-sm font-bold text-slate-700 ml-1">
                  Ponto de Destino
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Navigation className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="destination"
                    type="text"
                    autoComplete="off"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ex: Florianópolis, SC"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-lg shadow-sm"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start gap-3 animate-pulse">
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-5 px-6 rounded-2xl shadow-lg text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                  Consultando Inteligência...
                </>
              ) : (
                "Calcular Rota e Distância"
              )}
            </button>
          </form>

          {/* Results Section */}
          {result && (
            <div className="border-t border-slate-100 bg-slate-50/80 p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  Resultado
                </h2>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8">
                <div className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                  {result.text}
                </div>
              </div>

              {result.sources.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    Fontes de Dados Grounding
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {result.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm"
                      >
                        <span className="truncate max-w-[200