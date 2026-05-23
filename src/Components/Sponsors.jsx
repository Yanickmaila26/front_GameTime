import React from 'react';
import { ShieldCheck, Sparkles, Award } from 'lucide-react';

export default function Sponsors() {
  const sponsors = [
    {
      id: 'electrodomesticos-Quito',
      name: 'Electrodomésticos Quito',
      tagline: 'Equipando hogares desde 1995. ¡Tu tienda de confianza!',
      offer: '15% de Descuento presentando tu app HoopCenter',
      icon: Award,
      gradient: 'from-amber-600 to-red-800'
    },
    {
      id: 'cooperativa-Quito',
      name: 'Cooperativa Quito Ltda.',
      tagline: 'Apoyando el desarrollo del deporte y emprendedores locales.',
      offer: 'Crédito Deportivo Inmediato con tasa preferencial',
      icon: ShieldCheck,
      gradient: 'from-blue-800 to-indigo-950'
    }
  ];

  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
          Auspiciantes Oficiales
        </span>
        <span className="text-[9px] text-[#f57c00] flex items-center font-bold">
          <Sparkles className="w-3 h-3 mr-1" /> Patrocinadores
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sponsors.map((sponsor) => {
          const Icon = sponsor.icon;
          return (
            <div
              key={sponsor.id}
              className="relative overflow-hidden rounded-2xl border border-[#1a1a1a] bg-gradient-to-br from-[#0c0c0c] to-[#121212] p-4 flex flex-col justify-between"
            >
              {/* Decorative Corner Glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${sponsor.gradient} opacity-10 blur-xl rounded-full`} />

              <div className="flex items-start justify-between">
                <div className="space-y-1 pr-4">
                  <h4 className="font-extrabold text-sm text-white tracking-wide">
                    {sponsor.name}
                  </h4>
                  <p className="text-xs text-gray-400 leading-tight">
                    {sponsor.tagline}
                  </p>
                </div>
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-[#161616] border border-[#222] text-amber-500">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Offer Badge */}
              <div className="mt-3 flex items-center justify-between bg-[#161616] border border-[#222] border-dashed rounded-xl px-3 py-2">
                <span className="text-[10px] font-bold text-gray-400">
                  PROMO EXCLUSIVA:
                </span>
                <span className="text-[10px] font-extrabold text-basketball animate-pulse">
                  {sponsor.offer}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
