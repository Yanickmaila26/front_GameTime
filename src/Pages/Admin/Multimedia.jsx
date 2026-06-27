import React, { useState, useEffect, useMemo } from 'react';

async function compressImage(file, maxWidth = 1200, quality = 0.72) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
import AdminLayout from '../../Components/AdminLayout';
import { Image, Upload, Trash2, Shield, Globe, Plus, AlertCircle } from 'lucide-react';
import { toastSuccess, toastError, confirmDelete } from '../../lib/swal';
import client, { getAssetUrl } from '../../api/client';

export default function Multimedia() {
  const [teams, setTeams] = useState([]);
  const [multimedia, setMultimedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'teams'
  const [selectedTeamId, setSelectedTeamId] = useState('');

  // General upload form state
  const [generalForm, setGeneralForm] = useState({
    files: [],
    team_id: '',
    title: ''
  });
  const [generalErrors, setGeneralErrors] = useState({});
  const [generalProcessing, setGeneralProcessing] = useState(false);

  // Team upload form state
  const [teamForm, setTeamForm] = useState({
    files: [],
    team_id: '',
    title: ''
  });
  const [teamErrors, setTeamErrors] = useState({});
  const [teamProcessing, setTeamProcessing] = useState(false);

  const fetchData = () => {
    client.get('/admin/multimedia')
      .then(res => {
        const teamsData = res.data.teams || [];
        const multiData = res.data.multimedia || [];
        setTeams(teamsData);
        setMultimedia(multiData);
        if (teamsData.length > 0 && !selectedTeamId) {
          setSelectedTeamId(teamsData[0].id);
        }
      })
      .catch(err => {
        toastError('Error al cargar la galería multimedia');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Split media into general and team-based
  const generalMedia = useMemo(() => {
    return multimedia.filter(m => !m.team_id);
  }, [multimedia]);

  const teamMedia = useMemo(() => {
    if (!selectedTeamId) return [];
    return multimedia.filter(m => m.team_id === Number(selectedTeamId));
  }, [multimedia, selectedTeamId]);

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setGeneralProcessing(true);
    setGeneralErrors({});

    const compressed = await Promise.all((generalForm.files || []).map(f => compressImage(f)));
    const formData = new FormData();
    formData.append('title', generalForm.title);
    formData.append('team_id', '');
    compressed.forEach((file, index) => formData.append(`files[${index}]`, file));

    client.post('/admin/multimedia', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(() => {
        toastSuccess('Fotos subidas con éxito a la galería general');
        setGeneralForm({ files: [], team_id: '', title: '' });
        document.getElementById('general-file-input').value = '';
        fetchData();
      })
      .catch(err => {
        if (err.response?.data?.errors) {
          setGeneralErrors(err.response.data.errors);
        } else {
          toastError('Error al subir las fotos');
        }
      })
      .finally(() => setGeneralProcessing(false));
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setTeamProcessing(true);
    setTeamErrors({});

    const compressed = await Promise.all((teamForm.files || []).map(f => compressImage(f)));
    const formData = new FormData();
    formData.append('title', teamForm.title);
    formData.append('team_id', selectedTeamId);
    compressed.forEach((file, index) => formData.append(`files[${index}]`, file));

    client.post('/admin/multimedia', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(() => {
        toastSuccess('Fotos del club subidas con éxito');
        setTeamForm({ files: [], team_id: selectedTeamId, title: '' });
        document.getElementById('team-file-input').value = '';
        fetchData();
      })
      .catch(err => {
        if (err.response?.data?.errors) {
          setTeamErrors(err.response.data.errors);
        } else {
          toastError('Error al subir las fotos');
        }
      })
      .finally(() => setTeamProcessing(false));
  };

  const handleDelete = (id) => {
    confirmDelete(
      '¿Eliminar imagen?',
      '¿Estás seguro de que deseas eliminar esta imagen de la galería?'
    ).then((result) => {
      if (result.isConfirmed) {
        client.delete(`/admin/multimedia/${id}`)
          .then(() => {
            toastSuccess('Imagen eliminada con éxito de la galería');
            fetchData();
          })
          .catch(() => {
            toastError('Error al eliminar la imagen');
          });
      }
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Galería y Multimedia">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400 font-bold text-sm">Cargando multimedia...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Galería y Multimedia">
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d0d0d] p-6 rounded-3xl border border-[#1a1a1a]">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Gestión de Galería y Multimedia</h2>
            <p className="text-xs text-gray-400 mt-1">
              Sube fotos para las galerías públicas. Puedes añadir imágenes al hilo general del torneo o asignarlas a clubes específicos.
            </p>
          </div>
          
          {/* Tab Switcher */}
          <div className="bg-[#050505] p-1 rounded-xl border border-[#161616] flex space-x-1 self-start md:self-center">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'general'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Galería General</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('teams');
                if (teams.length > 0 && !selectedTeamId) {
                  setSelectedTeamId(teams[0].id);
                }
              }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'teams'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Galerías por Equipo</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Galería General */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Upload Box */}
            <div className="lg:col-span-4 bg-[#0d0d0d] p-5 rounded-3xl border border-[#1a1a1a] h-fit">
              <div className="flex items-center space-x-2 border-b border-[#1a1a1a] pb-3 mb-4">
                <Globe className="w-4 h-4 text-orange-500" />
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Subir Foto General</h3>
              </div>

              <form onSubmit={handleGeneralSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Título / Descripción (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Inauguración del Campeonato"
                    value={generalForm.title}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#050505] border border-[#1c1c1c] rounded-xl text-xs font-bold text-white px-3 py-2.5 focus:outline-none focus:border-basketball focus:ring-1 focus:ring-basketball/50"
                  />
                  {generalErrors.title && (
                    <span className="text-[10px] text-red-500 font-bold block mt-1">{generalErrors.title}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Imágenes</label>
                  <div className="relative group border border-dashed border-[#222] hover:border-basketball/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#050505]">
                    <input
                      id="general-file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setGeneralForm(prev => ({ ...prev, files: Array.from(e.target.files) }))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-7 h-7 text-gray-500 group-hover:text-basketball mx-auto mb-2 transition-colors" />
                    <span className="block text-[11px] font-bold text-gray-300">
                      {generalForm.files && generalForm.files.length > 0
                        ? `${generalForm.files.length} archivos seleccionados`
                        : 'Selecciona o arrastra imágenes'}
                    </span>
                    {generalForm.files && generalForm.files.length > 0 && (
                      <span className="block text-[9px] text-gray-400 mt-1 max-w-xs mx-auto truncate">
                        {generalForm.files.map(f => f.name).join(', ')}
                      </span>
                    )}
                    <span className="block text-[8px] text-gray-500 mt-1.5">Formatos: JPG, PNG, WEBP, GIF. Max: 5MB por archivo</span>
                  </div>
                  {Object.keys(generalErrors).filter(k => k.startsWith('files') || k === 'files').map((errKey) => (
                    <span key={errKey} className="text-[10px] text-red-500 font-bold block mt-1">
                      {generalErrors[errKey]}
                    </span>
                  ))}
                </div>

                 <button
                  type="submit"
                  disabled={generalProcessing || !generalForm.files || generalForm.files.length === 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-800 disabled:to-gray-800 text-black disabled:text-gray-500 font-black text-xs py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(245,124,0,0.1)] flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{generalProcessing ? 'Subiendo...' : 'SUBIR FOTOS'}</span>
                </button>
              </form>
            </div>

            {/* General Grid */}
            <div className="lg:col-span-8 bg-[#0d0d0d] p-5 rounded-3xl border border-[#1a1a1a]">
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3 mb-4">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  Fotos del Torneo
                </span>
                <span className="text-[10px] text-orange-500 font-extrabold uppercase">
                  {generalMedia.length} Imágenes
                </span>
              </div>

              {generalMedia.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-500 font-bold border border-[#161616] bg-[#050505] rounded-2xl flex flex-col items-center justify-center p-6">
                  <Image className="w-8 h-8 text-gray-600 mb-2" />
                  <p>Aún no hay fotos en la galería general del torneo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {generalMedia.map((mediaItem) => (
                    <div key={mediaItem.id} className="relative group rounded-xl overflow-hidden border border-[#161616] bg-[#050505] aspect-video">
                      <img src={getAssetUrl(mediaItem.file_path)} alt={mediaItem.title || 'Torneo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                        <button
                          onClick={() => handleDelete(mediaItem.id)}
                          className="self-end p-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div>
                          <p className="text-[11px] font-black text-white truncate">{mediaItem.title || 'Sin Título'}</p>
                          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                            {new Date(mediaItem.created_at).toLocaleDateString('es-EC')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Galerías por Equipo */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Upload Form + Team Selector */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Team Selector card */}
              <div className="bg-[#0d0d0d] p-5 rounded-3xl border border-[#1a1a1a]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selecciona el Club</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1c1c1c] rounded-xl text-xs font-bold text-white px-3 py-2.5 focus:outline-none focus:border-basketball focus:ring-1 focus:ring-basketball/50"
                >
                  <option value="" disabled>Seleccionar equipo...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Upload Box */}
              {selectedTeamId && (
                <div className="bg-[#0d0d0d] p-5 rounded-3xl border border-[#1a1a1a]">
                  <div className="flex items-center space-x-2 border-b border-[#1a1a1a] pb-3 mb-4">
                    <Shield className="w-4 h-4 text-orange-500" />
                    <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Subir Foto del Club</h3>
                  </div>

                  <form onSubmit={handleTeamSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Título / Descripción (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. Plantilla 2026 o Victoria vs Spartans"
                        value={teamForm.title}
                        onChange={(e) => setTeamForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-[#050505] border border-[#1c1c1c] rounded-xl text-xs font-bold text-white px-3 py-2.5 focus:outline-none focus:border-basketball focus:ring-1 focus:ring-basketball/50"
                      />
                      {teamErrors.title && (
                        <span className="text-[10px] text-red-500 font-bold block mt-1">{teamErrors.title}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Imágenes</label>
                      <div className="relative group border border-dashed border-[#222] hover:border-basketball/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#050505]">
                        <input
                          id="team-file-input"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => setTeamForm(prev => ({ ...prev, files: Array.from(e.target.files) }))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-7 h-7 text-gray-500 group-hover:text-basketball mx-auto mb-2 transition-colors" />
                        <span className="block text-[11px] font-bold text-gray-300">
                          {teamForm.files && teamForm.files.length > 0
                            ? `${teamForm.files.length} archivos seleccionados`
                            : 'Selecciona o arrastra imágenes'}
                        </span>
                        {teamForm.files && teamForm.files.length > 0 && (
                          <span className="block text-[9px] text-gray-400 mt-1 max-w-xs mx-auto truncate">
                            {teamForm.files.map(f => f.name).join(', ')}
                          </span>
                        )}
                        <span className="block text-[8px] text-gray-500 mt-1.5">Formatos: JPG, PNG, WEBP, GIF. Max: 5MB por archivo</span>
                      </div>
                      {Object.keys(teamErrors).filter(k => k.startsWith('files') || k === 'files').map((errKey) => (
                        <span key={errKey} className="text-[10px] text-red-500 font-bold block mt-1">
                          {teamErrors[errKey]}
                        </span>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={teamProcessing || !teamForm.files || teamForm.files.length === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-800 disabled:to-gray-800 text-black disabled:text-gray-500 font-black text-xs py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(245,124,0,0.1)] flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>{teamProcessing ? 'Subiendo...' : 'SUBIR FOTOS'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right side: Team Grid */}
            <div className="lg:col-span-8 bg-[#0d0d0d] p-5 rounded-3xl border border-[#1a1a1a]">
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3 mb-4">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  {selectedTeamId ? `Fotos de: ${teams.find(t => t.id === Number(selectedTeamId))?.name || ''}` : 'Galería del Equipo'}
                </span>
                <span className="text-[10px] text-orange-500 font-extrabold uppercase">
                  {teamMedia.length} Imágenes
                </span>
              </div>

              {!selectedTeamId ? (
                <div className="text-center py-16 text-xs text-gray-500 font-bold border border-dashed border-[#1a1a1a] rounded-2xl p-6 bg-[#050505]">
                  <AlertCircle className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                  <p>Por favor, selecciona un club en el menú lateral para gestionar sus fotos.</p>
                </div>
              ) : teamMedia.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-500 font-bold border border-[#161616] bg-[#050505] rounded-2xl flex flex-col items-center justify-center p-6">
                  <Image className="w-8 h-8 text-gray-600 mb-2" />
                  <p>Aún no hay fotos registradas para este equipo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {teamMedia.map((mediaItem) => (
                    <div key={mediaItem.id} className="relative group rounded-xl overflow-hidden border border-[#161616] bg-[#050505] aspect-video">
                      <img src={getAssetUrl(mediaItem.file_path)} alt={mediaItem.title || 'Equipo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                        <button
                          onClick={() => handleDelete(mediaItem.id)}
                          className="self-end p-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div>
                          <p className="text-[11px] font-black text-white truncate">{mediaItem.title || 'Sin Título'}</p>
                          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                            {new Date(mediaItem.created_at).toLocaleDateString('es-EC')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
