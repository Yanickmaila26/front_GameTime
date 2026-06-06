import React, { useState, useEffect, useMemo } from 'react';
import { Users, Award, Shield, Calendar, CheckCircle2, TrendingUp, ChevronDown, Image } from 'lucide-react';

export default function MyTeamTab({ teams = [] }) {
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // Initialize selectedTeamId to the first team when teams load
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = useMemo(() => {
    if (!selectedTeamId || teams.length === 0) return teams[0] || null;
    return teams.find(t => t.id === selectedTeamId) || teams[0];
  }, [teams, selectedTeamId]);

  const teamPosition = useMemo(() => {
    if (!selectedTeamId || teams.length === 0) return 1;
    return teams.findIndex(t => t.id === selectedTeamId) + 1;
  }, [teams, selectedTeamId]);

  // Process selected team's players and calculate their PPG dynamically
  const rosterPlayers = useMemo(() => {
    if (!selectedTeam || !selectedTeam.players) return [];
    return selectedTeam.players.map(player => {
      const stats = player.match_stats || player.matchStats || [];
      const totalPoints = stats.reduce((sum, s) => sum + (s.points || 0), 0);
      const gamesPlayed = stats.length;
      const ppg = gamesPlayed > 0 ? (totalPoints / gamesPlayed).toFixed(1) : '0.0';
      return {
        id: player.id,
        name: player.name,
        number: player.number ?? '--',
        pos: player.position || 'Jugador',
        ppg,
        status: player.status || 'Activo'
      };
    });
  }, [selectedTeam]);

  // Top 3 players by PPG for MVP Vote Simulator
  const topMvpCandidates = useMemo(() => {
    return [...rosterPlayers]
      .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg))
      .slice(0, 3);
  }, [rosterPlayers]);

  // MVP Simulator Voting States
  const [hasVoted, setHasVoted] = useState(false);
  const [votedPlayerId, setVotedPlayerId] = useState(null);
  const [votes, setVotes] = useState({});

  // Reset votes and generate random baseline when switching teams
  useEffect(() => {
    setHasVoted(false);
    setVotedPlayerId(null);
    if (topMvpCandidates.length > 0) {
      const initialVotes = {};
      topMvpCandidates.forEach((player, idx) => {
        // Higher PPG players get a higher baseline vote weight for simulation
        const weight = Math.round(parseFloat(player.ppg) * 3.5 + (3 - idx) * 8 + Math.random() * 15);
        initialVotes[player.id] = Math.max(weight, 5);
      });
      setVotes(initialVotes);
    }
  }, [selectedTeamId, topMvpCandidates]);

  const handleVote = (playerId) => {
    setVotes(prev => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 1
    }));
    setVotedPlayerId(playerId);
    setHasVoted(true);
  };

  const totalVotes = useMemo(() => {
    return Object.values(votes).reduce((a, b) => a + b, 0);
  }, [votes]);

  // Local Lightbox states for Team Gallery
  const [localLightboxOpen, setLocalLightboxOpen] = useState(false);
  const [localLightboxImg, setLocalLightboxImg] = useState('');
  const [localLightboxTitle, setLocalLightboxTitle] = useState('');

  const handleOpenLocalLightbox = (imgUrl, titleText = '') => {
    setLocalLightboxImg(imgUrl);
    setLocalLightboxTitle(titleText);
    setLocalLightboxOpen(true);
  };

  // Get selected team's uploaded photos or fallbacks
  const teamPhotos = selectedTeam?.media || [];
  const defaultPhotos = [
    { id: 'd1', file_path: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=60', title: 'Entrenamiento del Equipo' },
    { id: 'd2', file_path: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=600&auto=format&fit=crop&q=60', title: 'Planificación de Jugadas' },
    { id: 'd3', file_path: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=600&auto=format&fit=crop&q=60', title: 'Charla Técnica de Juego' }
  ];
  const photosToDisplay = teamPhotos.length > 0 ? teamPhotos : defaultPhotos;

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-gray-400 font-bold bg-gray-950/20 border border-gray-900/60 backdrop-blur-md rounded-3xl">
        No hay clubes oficiales o estadísticas cargadas para este campeonato.
      </div>
    );
  }

  const logoColor = selectedTeam?.logoColor || 'from-orange-500 to-amber-600';
  const isHexLogoColor = selectedTeam?.logo_color?.startsWith('#');
  const shortName = selectedTeam?.short_name || selectedTeam?.name?.substring(0, 3)?.toUpperCase() || 'EQU';
  const record = `${selectedTeam?.pg ?? 0}G - ${selectedTeam?.pp ?? 0}P`;

  return (
    <div className="space-y-5">
      
      {/* Dynamic Team Selector & Team Profile Header */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-900/60 bg-gray-950/20 backdrop-blur-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500 to-amber-700 opacity-5 blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex items-center space-x-4">
          {/* Stylized Logo Badge */}
          {selectedTeam?.logo_url ? (
            <img 
              src={selectedTeam.logo_url} 
              alt={selectedTeam.name} 
              className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-gray-900/60"
            />
          ) : (
            <div 
              style={isHexLogoColor ? { backgroundColor: selectedTeam.logo_color } : {}}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-black ${
                !isHexLogoColor ? `bg-gradient-to-br ${logoColor}` : ''
              } shadow border border-gray-900/40 flex-shrink-0`}
            >
              {shortName}
            </div>
          )}
          
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-extrabold text-lg text-white tracking-tight">{selectedTeam?.name}</h3>
              <Shield className="w-4 h-4 text-orange-500 fill-orange-500" />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Torneo de Invierno Latacunga / Club Oficial
            </p>
            
            <div className="flex space-x-4 mt-2">
              <span className="text-[10px] text-gray-300 font-bold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500 mr-1" /> Posición: <strong className="text-white ml-0.5">#{teamPosition}</strong>
              </span>
              <span className="text-[10px] text-gray-300 font-bold">
                Récord: <strong className="text-white ml-0.5">{record}</strong>
              </span>
              <span className="text-[10px] text-gray-300 font-bold">
                Puntos: <strong className="text-basketball ml-0.5">{selectedTeam?.pts ?? 0} PTS</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Dropdown Selector */}
        <div className="relative self-start md:self-center">
          <label className="block text-[8px] uppercase tracking-widest font-black text-gray-400 mb-1 px-1">Explorar otro Club</label>
          <div className="relative">
            <select
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              className="appearance-none bg-gray-900/80 border border-gray-800 text-xs font-bold text-white pl-4 pr-10 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-basketball focus:ring-1 focus:ring-basketball/50 shadow-md backdrop-blur-md transition-all w-60 md:w-56"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#05060f] text-white">
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Roster & Gallery Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team Gallery Card */}
        <div className="bg-gray-950/20 border border-gray-900/60 rounded-2xl p-4 backdrop-blur-md hover:border-gray-800/60 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1.5 border-b border-gray-900/60 pb-2 mb-3">
              <Image className="w-4 h-4 text-orange-500" />
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                Galería del Club
              </h4>
              {teamPhotos.length === 0 && (
                <span className="text-[8px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  Referencia
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {photosToDisplay.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => handleOpenLocalLightbox(photo.file_path, photo.title)}
                  className="group relative rounded-xl overflow-hidden aspect-square border border-gray-900 bg-gray-950/40 cursor-pointer"
                >
                  <img
                    src={photo.file_path}
                    alt={photo.title || 'Foto de Equipo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-center p-1">
                    <span className="text-[8px] font-black text-white uppercase tracking-wider">Ampliar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[8px] text-gray-500 mt-2 text-right">
            Haz clic en una imagen para agrandar
          </div>
        </div>

        {/* MVP Vote Simulator */}
        <div className="bg-gray-950/20 border border-gray-900/60 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center space-x-1.5 border-b border-gray-900/60 pb-2 mb-3">
            <Award className="w-4 h-4 text-orange-500" />
            <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
              Vota MVP del Partido
            </h4>
          </div>

          {topMvpCandidates.length === 0 ? (
            <p className="text-[10px] text-gray-400 leading-tight py-4 text-center">
              No hay jugadores registrados en este club para votar.
            </p>
          ) : !hasVoted ? (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-300 leading-tight">
                Elige al mejor jugador de **{selectedTeam?.name}** para ser nombrado MVP de la última jornada del torneo.
              </p>
              {topMvpCandidates.map((player) => (
                <div key={player.id} className="glow-btn-orange rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 w-full">
                  <button
                    onClick={() => handleVote(player.id)}
                    className="w-full flex items-center justify-between bg-gray-800 p-2.5 px-4 rounded-full text-xs font-bold text-white transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] text-gray-400 font-mono">#{player.number}</span>
                      <span className="font-extrabold text-white">{player.name}</span>
                    </div>
                    <span className="text-[9px] text-[#F57C00] font-black uppercase bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                      Votar
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] text-green-400 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ¡Tu voto para {topMvpCandidates.find(p => p.id === votedPlayerId)?.name} ha sido registrado!
              </p>
              <div className="space-y-2.5">
                {topMvpCandidates.map((player) => {
                  const count = votes[player.id] || 0;
                  const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  const isUserSelection = votedPlayerId === player.id;
                  return (
                    <div key={player.id} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className={isUserSelection ? 'text-orange-500 font-black' : 'text-gray-300'}>
                          {player.name} {isUserSelection && '(Tu voto)'}
                        </span>
                        <span className="text-white">{percent}% ({count})</span>
                      </div>
                      <div className="h-2 w-full bg-gray-950/60 border border-gray-900/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isUserSelection
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 shadow-[0_0_8px_#f57c00]'
                              : 'bg-gray-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roster List */}
      <div className="bg-gray-950/20 border border-gray-900/60 rounded-3xl p-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-gray-900/60 pb-2.5 mb-3">
          <div className="flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-orange-500" />
            <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
              Plantilla de Jugadores
            </h4>
          </div>
          <span className="text-[10px] text-gray-400 font-bold">
            Roster: {rosterPlayers.length} Jugadores
          </span>
        </div>

        {rosterPlayers.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 font-bold">
            No hay jugadores registrados oficialmente en este club.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {rosterPlayers.map((player) => {
              const activeStatus = player.status.toLowerCase() === 'activo' || player.status.toLowerCase() === 'active';
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-950/30 p-2.5 rounded-xl border border-gray-900/60 hover:border-gray-800/60 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-full bg-gray-950/40 border border-gray-900/60 text-[11px] font-black text-orange-500 flex items-center justify-center">
                      #{player.number}
                    </span>
                    <div>
                      <h5 className="text-xs font-black text-white">{player.name}</h5>
                      <span className="text-[10px] text-gray-400 font-bold">{player.pos}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="block text-xs font-black text-white">{player.ppg} PPG</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Promedio</span>
                    </div>

                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg border ${
                      activeStatus
                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {activeStatus ? 'Activo' : 'Lesionado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Local Lightbox Modal for Team photos */}
      {localLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-pointer"
          onClick={() => setLocalLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setLocalLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-orange-500 font-extrabold text-xs flex items-center space-x-1"
            >
              <span>✕</span> <span>Cerrar</span>
            </button>
            <img 
              src={localLightboxImg} 
              alt="Visualización de Equipo" 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-gray-900 shadow-2xl" 
            />
            {localLightboxTitle && (
              <p className="text-white text-xs font-black mt-3 bg-gray-950/80 px-4 py-2 rounded-xl border border-gray-900/60 backdrop-blur-sm">
                {localLightboxTitle}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
