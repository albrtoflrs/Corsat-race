import React, { useState } from 'react';
import {
  UNITY_FOLDER_TREE,
  UNITY_PHASE1_SCRIPTS,
  UNITY_QA_CHECKLIST,
  UNITY_SETUP_STEPS,
} from '../game/unityPhase1Data';

interface UnityBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnityBlueprintModal: React.FC<UnityBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'scripts' | 'tree' | 'setup'>('scripts');
  const [selectedScriptId, setSelectedScriptId] = useState<string>(UNITY_PHASE1_SCRIPTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeScript =
    UNITY_PHASE1_SCRIPTS.find((s) => s.id === selectedScriptId) || UNITY_PHASE1_SCRIPTS[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Arquitectura Unity 6 URP Fase 4"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-auto"
      style={{ backgroundColor: 'rgba(6, 7, 10, 0.88)' }}
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0D0F14] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#12151C]">
          <div>
            <p className="text-xs font-mono text-[#E11D2A] tracking-wider">
              ENTREGABLE TÉCNICO COMPLETO · FASES 1 A 4 · UNITY 6000.0+ URP 17 RENDER GRAPH
            </p>
            <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white">
              4 Autos, 4 Pistas F1, Streaming Aditivo, LODs, Nubes Render Graph y Escalador 60 FPS
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Inspector Unity 6"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-[#E11D2A] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Cerrar [Esc]
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/10 bg-[#0A0C10] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('scripts')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'scripts'
                ? 'bg-[#E11D2A] text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            1. Código C# Compilable ({UNITY_PHASE1_SCRIPTS.length} Scripts)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'tree'
                ? 'bg-[#E11D2A] text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            2. Árbol de Carpetas Unity 6
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'setup'
                ? 'bg-[#E11D2A] text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            3. Configuración URP y Pruebas en Dispositivo (QA)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'scripts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              {/* Script Selector List */}
              <div className="lg:col-span-4 flex flex-col gap-2">
                {UNITY_PHASE1_SCRIPTS.map((script) => {
                  const isSelected = script.id === activeScript.id;
                  return (
                    <button
                      key={script.id}
                      type="button"
                      onClick={() => setSelectedScriptId(script.id)}
                      className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1D26] border-[#E11D2A] text-white'
                          : 'bg-[#111319] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-white truncate">
                          {script.filename}
                        </span>
                        <span className="text-[10px] font-mono text-[#FACC15] shrink-0">
                          {script.phase}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {script.role}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Code Viewer */}
              <div className="lg:col-span-8 flex flex-col bg-[#08090C] border border-white/10 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#12151C] border-b border-white/10">
                  <div className="truncate pr-3">
                    <span className="font-mono text-xs font-semibold text-white">
                      {activeScript.path}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeScript.code, activeScript.id)}
                    className="px-3 py-1 text-xs font-mono font-medium bg-white/10 hover:bg-[#E11D2A] text-white rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedId === activeScript.id ? 'Copiado' : 'Copiar C#'}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[52vh]">
                  <code>{activeScript.code}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'tree' && (
            <div className="bg-[#08090C] border border-white/10 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">
                  Estructura de Proyecto Unity 6 (Fases 1, 2, 3 y 4)
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy(UNITY_FOLDER_TREE, 'tree')}
                  className="px-3 py-1 text-xs font-mono bg-white/10 hover:bg-[#E11D2A] text-white rounded transition-colors cursor-pointer"
                >
                  {copiedId === 'tree' ? 'Copiado' : 'Copiar Árbol'}
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                <code>{UNITY_FOLDER_TREE}</code>
              </pre>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#111319] border border-white/10 rounded-lg p-5">
                <h3 className="text-sm font-bold text-white mb-3">
                  Pasos de Configuración en Unity 6 (URP 17 · Fase 4)
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  {UNITY_SETUP_STEPS.map((step, i) => (
                    <li key={i} className="pb-2 border-b border-white/5 last:border-none">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#111319] border border-white/10 rounded-lg p-5">
                <h3 className="text-sm font-bold text-white mb-3">
                  Lista de Verificación y Pruebas en Dispositivo (Fase 4)
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  {UNITY_QA_CHECKLIST.map((item, i) => (
                    <li key={i} className="pb-2 border-b border-white/5 last:border-none">
                      <span className="font-mono text-[#E11D2A] font-bold mr-1.5">
                        [TEST 0{i + 1}]
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
