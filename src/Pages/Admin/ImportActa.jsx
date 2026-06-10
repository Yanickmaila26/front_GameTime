import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminLayout from '../../Components/AdminLayout'
import client from '../../api/client'
import { toastSuccess, toastError, toastWarn } from '../../lib/swal'
import { 
  Swords, 
  FileText, 
  Sparkles, 
  Upload, 
  Trash2, 
  Save, 
  AlertTriangle, 
  Loader2, 
  Download, 
  Key, 
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react'

export default function ImportActa() {
  const navigate = useNavigate()
  
  // State variables
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [matchData, setMatchData] = useState(null)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [loadingMatchDetails, setLoadingMatchDetails] = useState(false)
  
  // Gemini API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
  
  // Image Upload
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef(null)
  
  // OCR & Grid Data State
  const [isScanning, setIsScanning] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [homePlayers, setHomePlayers] = useState([])
  const [awayPlayers, setAwayPlayers] = useState([])
  const [ocrLog, setOcrLog] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load all matches
  useEffect(() => {
    client.get('/admin/partidos')
      .then(res => {
        setMatches(res.data.matches || [])
      })
      .catch(err => {
        console.error("Error loading matches", err)
        toastError("Error al cargar la lista de partidos")
      })
      .finally(() => {
        setLoadingMatches(false)
      })
  }, [])

  // Load selected match rosters
  const handleMatchChange = (matchId) => {
    setSelectedMatchId(matchId)
    setMatchData(null)
    setShowGrid(false)
    
    if (!matchId) return;

    setLoadingMatchDetails(true)
    client.get(`/admin/partidos/${matchId}/live`)
      .then(res => {
        setMatchData(res.data.match)
      })
      .catch(err => {
        console.error("Error loading match details", err)
        toastError("Error al cargar los detalles del partido")
      })
      .finally(() => {
        setLoadingMatchDetails(false)
      })
  }

  // Save API Key
  const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key)
    setApiKey(key)
    setShowKeyInput(false)
    toastSuccess("API Key de Gemini guardada correctamente")
  }

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleImageSelection(files[0])
    }
  }

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImageSelection(files[0])
    }
  }

  const handleImageSelection = (file) => {
    if (!file.type.startsWith('image/')) {
      toastError("Por favor, selecciona un archivo de imagen válido (JPG, PNG, WEBP)")
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // File to base64 helper
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]
        resolve(base64String)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  // Compress image using canvas to reduce payload size for Gemini API
  const compressImage = (file, maxWidth = 1600, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w)
          w = maxWidth
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: 'image/jpeg'
        })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Gemini API OCR Request with auto-retry
  const runOcrScan = async () => {
    if (!apiKey) {
      toastWarn("Por favor, ingresa tu API Key de Gemini en la parte superior.")
      setShowKeyInput(true)
      return
    }
    if (!imageFile) {
      toastWarn("Por favor, selecciona una imagen de la planilla.")
      return
    }
    if (!matchData) {
      toastWarn("Por favor, selecciona un partido de la lista.")
      return
    }

    setIsScanning(true)
    setOcrLog(["Preparando imagen..."])
    
    const MAX_RETRIES = 3
    let lastError = null

    try {
      // Compress image first to reduce payload
      setOcrLog(["Comprimiendo imagen para optimizar envío..."])
      const compressed = await compressImage(imageFile)
      const base64Data = compressed.base64
      const mimeType = compressed.mimeType

      const promptText = `
        Analiza esta imagen que contiene el acta o planilla de anotaciones de un partido de baloncesto.
        Extrae los siguientes datos con la mayor precisión posible:
        1. Puntos totales acumulados por el equipo local (home_score).
        2. Puntos totales acumulados por el equipo visitante (away_score).
        3. Jugadores del equipo LOCAL (Home Team): número de camiseta (number), puntos totales anotados (points) y faltas acumuladas (fouls).
        4. Jugadores del equipo VISITANTE (Away Team): número de camiseta (number), puntos totales anotados (points) y faltas acumuladas (fouls).

        Instrucciones para la extracción:
        - Si no encuentras faltas para un jugador, pon 0.
        - Si no encuentras puntos para un jugador, pon 0.
        - Intenta emparejar los números de camiseta lo mejor posible.
        - Responde estrictamente en formato JSON utilizando el esquema proporcionado.
      `

      const requestBody = {
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              home_score: { type: "INTEGER" },
              away_score: { type: "INTEGER" },
              home_players: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    number: { type: "INTEGER" },
                    points: { type: "INTEGER" },
                    fouls: { type: "INTEGER" }
                  },
                  required: ["number", "points", "fouls"]
                }
              },
              away_players: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    number: { type: "INTEGER" },
                    points: { type: "INTEGER" },
                    fouls: { type: "INTEGER" }
                  },
                  required: ["number", "points", "fouls"]
                }
              }
            },
            required: ["home_score", "away_score", "home_players", "away_players"]
          }
        }
      }

      let response = null

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          setOcrLog([`Intento ${attempt}/${MAX_RETRIES} — Enviando a ${selectedModel}...`])

          response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
            requestBody,
            { timeout: 60000 }
          )

          // If we got here, it succeeded
          setOcrLog(prev => [...prev, "✅ Respuesta recibida exitosamente."])
          break

        } catch (retryErr) {
          lastError = retryErr
          const status = retryErr.response?.status

          if (status === 429 || status === 503 || status === 500 || !status) {
            // Retryable errors: rate limit, server overloaded, server error, network error
            const waitSec = attempt * 3
            const reason = status === 429 ? 'Límite de tasa alcanzado'
              : status === 503 ? 'Servidor temporalmente sobrecargado'
              : status === 500 ? 'Error interno del servidor'
              : 'Error de red / sin conexión'

            if (attempt < MAX_RETRIES) {
              setOcrLog([`⚠ ${reason} (HTTP ${status || 'N/A'}). Reintentando en ${waitSec}s... (${attempt}/${MAX_RETRIES})`])
              await new Promise(r => setTimeout(r, waitSec * 1000))
            } else {
              setOcrLog([`❌ ${reason} tras ${MAX_RETRIES} intentos.`])
            }
          } else {
            // Non-retryable error (400, 401, 404, etc.)
            throw retryErr
          }
        }
      }

      if (!response) {
        // All retries exhausted
        const status = lastError?.response?.status
        if (status === 503) {
          toastError("El servidor de Gemini está sobrecargado. Intenta de nuevo en unos segundos o cambia de modelo en Configurar Gemini Key.")
        } else if (status === 429) {
          toastError("Has alcanzado el límite de solicitudes por minuto. Espera 1 minuto y vuelve a intentar.")
        } else {
          toastError("No se pudo conectar con la IA después de varios intentos. Revisa tu conexión a internet.")
        }
        return
      }

      setOcrLog(prev => [...prev, "Procesando y emparejando con la plantilla oficial..."])

      const rawText = response.data.candidates[0].content.parts[0].text
      const ocrResult = JSON.parse(rawText)

      // Set scores
      setHomeScore(ocrResult.home_score || 0)
      setAwayScore(ocrResult.away_score || 0)

      // Map home players
      const rosterHome = matchData.home_team?.players || []
      const mappedHome = rosterHome.map(p => {
        const ocrP = ocrResult.home_players?.find(op => Number(op.number) === Number(p.number))
        return {
          player_id: p.id,
          name: p.name,
          number: p.number,
          team_id: matchData.home_team_id,
          points: ocrP ? ocrP.points : 0,
          fouls: ocrP ? ocrP.fouls : 0
        }
      })

      // Map away players
      const rosterAway = matchData.away_team?.players || []
      const mappedAway = rosterAway.map(p => {
        const ocrP = ocrResult.away_players?.find(op => Number(op.number) === Number(p.number))
        return {
          player_id: p.id,
          name: p.name,
          number: p.number,
          team_id: matchData.away_team_id,
          points: ocrP ? ocrP.points : 0,
          fouls: ocrP ? ocrP.fouls : 0
        }
      })

      setHomePlayers(mappedHome)
      setAwayPlayers(mappedAway)
      setShowGrid(true)
      
      // Warning if OCR returned numbers not matched
      const ocrHomeNumbers = (ocrResult.home_players || []).map(op => Number(op.number))
      const rosterHomeNumbers = rosterHome.map(rp => Number(rp.number))
      const unmatchedHome = ocrHomeNumbers.filter(n => !rosterHomeNumbers.includes(n))

      const ocrAwayNumbers = (ocrResult.away_players || []).map(op => Number(op.number))
      const rosterAwayNumbers = rosterAway.map(rp => Number(rp.number))
      const unmatchedAway = ocrAwayNumbers.filter(n => !rosterAwayNumbers.includes(n))

      if (unmatchedHome.length > 0 || unmatchedAway.length > 0) {
        const msg = `Se detectaron números de camiseta que no están en la plantilla oficial. 
          Local: ${unmatchedHome.length ? unmatchedHome.join(', ') : 'Ninguno'}. 
          Visitante: ${unmatchedAway.length ? unmatchedAway.join(', ') : 'Ninguno'}.
          Puedes revisar y editar la información manualmente.`
        toastWarn(msg)
      } else {
        toastSuccess("¡Escaneo exitoso! Los datos se han mapeado correctamente.")
      }

    } catch (err) {
      console.error("OCR Scan failed", err)
      const status = err.response?.status
      const msg = err.response?.data?.error?.message
      if (status === 404) {
        toastError(`El modelo "${selectedModel}" no está disponible. Cambia de modelo en "Configurar Gemini Key".`)
      } else if (status === 400) {
        toastError(`Solicitud inválida: ${msg || 'Revisa el formato de la imagen.'}`)
      } else if (status === 403) {
        toastError("API Key sin permisos. Verifica que tu clave tenga acceso a la API de Gemini.")
      } else {
        toastError(`Error al escanear: ${msg || 'Verifica tu API Key y la calidad de la foto.'}`)
      }
    } finally {
      setIsScanning(false)
      setOcrLog([])
    }
  }

  // Load manual empty layout
  const loadManualLayout = () => {
    if (!matchData) {
      toastWarn("Por favor, selecciona un partido de la lista.")
      return
    }

    setHomeScore(matchData.home_score || 0)
    setAwayScore(matchData.away_score || 0)

    const rosterHome = matchData.home_team?.players || []
    const mappedHome = rosterHome.map(p => ({
      player_id: p.id,
      name: p.name,
      number: p.number,
      team_id: matchData.home_team_id,
      points: 0,
      fouls: 0
    }))

    const rosterAway = matchData.away_team?.players || []
    const mappedAway = rosterAway.map(p => ({
      player_id: p.id,
      name: p.name,
      number: p.number,
      team_id: matchData.away_team_id,
      points: 0,
      fouls: 0
    }))

    setHomePlayers(mappedHome)
    setAwayPlayers(mappedAway)
    setShowGrid(true)
    toastSuccess("Planilla cargada. Ingresa los resultados manualmente en las celdas.")
  }

  // Handle value edits in Grid
  const updatePlayerField = (team, index, field, value) => {
    const val = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)
    if (team === 'home') {
      const updated = [...homePlayers]
      updated[index][field] = val
      setHomePlayers(updated)
    } else {
      const updated = [...awayPlayers]
      updated[index][field] = val
      setAwayPlayers(updated)
    }
  }

  // Submit results to backend
  const importResultsToBackend = async () => {
    // Basic verification
    const invalidHome = homePlayers.some(p => p.points === '' || p.fouls === '')
    const invalidAway = awayPlayers.some(p => p.points === '' || p.fouls === '')
    if (invalidHome || invalidAway) {
      toastWarn("Completa todas las celdas de puntos y faltas de los jugadores.")
      return
    }

    // Check score discrepancy and ask for confirmation
    const totalHomePts = homePlayers.reduce((s, p) => s + (Number(p.points) || 0), 0)
    const totalAwayPts = awayPlayers.reduce((s, p) => s + (Number(p.points) || 0), 0)
    const hasDiscrepancy = totalHomePts !== Number(homeScore) || totalAwayPts !== Number(awayScore)

    if (hasDiscrepancy) {
      const { default: Swal } = await import('sweetalert2')
      const result = await Swal.fire({
        title: '⚠ Discrepancia de puntuación',
        html: `
          <p style="font-size:13px;color:#ccc;line-height:1.6">
            La sumatoria de puntos individuales <b>no coincide</b> con el marcador final.<br><br>
            <b>Local:</b> Jugadores = ${totalHomePts} pts vs Marcador = ${homeScore} pts<br>
            <b>Visitante:</b> Jugadores = ${totalAwayPts} pts vs Marcador = ${awayScore} pts<br><br>
            ¿Deseas importar los resultados de todas formas?
          </p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, importar',
        cancelButtonText: 'Cancelar y corregir',
        background: '#0d0d0d',
        color: '#fff',
        confirmButtonColor: '#F57C00',
      })
      if (!result.isConfirmed) return
    }

    setIsSubmitting(true)
    
    // Combine all player stats
    const playersPayload = [...homePlayers, ...awayPlayers].map(p => ({
      player_id: p.player_id,
      team_id: p.team_id,
      points: Number(p.points),
      fouls: Number(p.fouls)
    }))

    const payload = {
      home_score: Number(homeScore),
      away_score: Number(awayScore),
      players: playersPayload
    }

    client.post(`/admin/partidos/${selectedMatchId}/importar-acta`, payload)
      .then(res => {
        toastSuccess("✅ Acta de resultados importada e ingresada correctamente.")
        navigate('/admin/partidos')
      })
      .catch(err => {
        console.error("Error importing results", err)
        const errors = err.response?.data?.errors
        if (errors) {
          // Show Laravel validation errors
          const msgs = Object.values(errors).flat().join('\n')
          toastError(`Error de validación:\n${msgs}`)
        } else if (err.response?.data?.message) {
          toastError(err.response.data.message)
        } else {
          toastError("Error al importar la planilla de resultados.")
        }
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  // Helpers to summarize sums
  const sumPoints = (players) => players.reduce((sum, p) => sum + (Number(p.points) || 0), 0)
  const sumFouls = (players) => players.reduce((sum, p) => sum + (Number(p.fouls) || 0), 0)

  return (
    <AdminLayout title="Importar Acta de Resultados (OCR)">
      
      {/* Dynamic Keyframes injected locally */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(to bottom, rgba(245, 124, 0, 0), rgba(245, 124, 0, 0.9), rgba(245, 124, 0, 0));
          box-shadow: 0 0 15px rgba(245, 124, 0, 0.9);
          animation: scan 4s ease-in-out infinite;
        }
      `}} />

      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Banner/Header Info */}
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-600/5 border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-10">
            <FileSpreadsheet className="w-64 h-64 text-orange-500" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-[#F57C00] font-black text-[11px] uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Módulo Inteligente AI OCR</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">Importar Acta de Partido</h2>
              <p className="text-xs text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
                Escanea una fotografía de la planilla física del partido. La IA detectará los resultados, sumatorias y estadísticas de jugadores para asociarlos a los rosters registrados.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="/mock_score_sheet.png" 
                download="planilla_ejemplo.png"
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500/20 text-xs font-bold transition-all shadow-[0_4px_15px_rgba(245,124,0,0.05)]"
              >
                <Download className="w-4 h-4" />
                <span>Planilla de Prueba</span>
              </a>
              <button 
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#121212] border border-[#222] text-gray-300 hover:text-white hover:border-[#333] text-xs font-bold transition-all"
              >
                <Key className="w-4 h-4 text-[#F57C00]" />
                <span>Configurar Gemini Key</span>
              </button>
            </div>
          </div>
        </div>

        {/* API Key Modal/Input Form */}
        {showKeyInput && (
          <div className="bg-[#0d0d0d] border border-orange-500/30 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <Key className="w-5 h-5 text-[#F57C00]" />
              <span>Configuración de Google Gemini API Key</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Para analizar la foto usamos un modelo de visión artificial de Google Gemini (se recomienda **Gemini 3.5 Flash**). 
              Puedes obtener una clave API completamente gratis en <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline text-orange-400 hover:text-orange-300 font-bold">Google AI Studio</a>.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input 
                type="password"
                placeholder="Ingresa tu Gemini API Key..."
                defaultValue={apiKey}
                id="gemini_key_field"
                className="flex-1 bg-[#121212] border border-[#222] text-white text-xs px-4 py-3 rounded-xl outline-none focus:border-orange-500 transition-colors"
              />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-[#121212] border border-[#222] text-white text-xs px-4 py-3 rounded-xl outline-none focus:border-orange-500 transition-colors"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
              </select>
              <button
                onClick={() => {
                  const val = document.getElementById('gemini_key_field')?.value || ''
                  saveApiKey(val)
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
              >
                Guardar Clave
              </button>
            </div>
          </div>
        )}

        {/* Configuration panel: Select Match, Drop Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Match & Settings Box */}
          <div className="lg:col-span-5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <Swords className="w-4 h-4 text-orange-500" />
                  <span>1. Seleccionar Partido</span>
                </h3>
                {loadingMatches ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  </div>
                ) : (
                  <select 
                    value={selectedMatchId}
                    onChange={(e) => handleMatchChange(e.target.value)}
                    className="w-full bg-[#121212] border border-[#222] text-white text-xs px-4 py-3.5 rounded-2xl outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">Selecciona el partido a importar...</option>
                    {matches.map(m => {
                      const dateStr = m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha';
                      const statusSuffix = m.status === 'finished' ? ' (Finalizado)' : (m.status === 'live' ? ' (En Vivo)' : ' (Programado)');
                      return (
                        <option key={m.id} value={m.id}>
                          {m.home_team?.short_name || m.home_team?.name} vs {m.away_team?.short_name || m.away_team?.name} - {dateStr}{statusSuffix}
                        </option>
                      )
                    })}
                  </select>
                )}
              </div>

              {/* Match overview Card */}
              {loadingMatchDetails && (
                <div className="py-8 flex flex-col items-center justify-center bg-[#121212] rounded-2xl border border-[#1a1a1a]">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin mb-2" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cargando plantillas...</span>
                </div>
              )}

              {matchData && !loadingMatchDetails && (
                <div className="bg-[#121212] border border-[#1a1a1a] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#222]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Campeonato</span>
                    <span className="text-[11px] font-bold text-white truncate max-w-[180px]">{matchData.championship?.name}</span>
                  </div>
                  
                  {/* Team badges */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: matchData.home_team?.logo_color || '#F57C00' }}></div>
                      <span className="text-xs font-bold text-white">{matchData.home_team?.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-black px-1.5 py-0.5 rounded bg-gray-500/10">LOCAL</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: matchData.away_team?.logo_color || '#999' }}></div>
                      <span className="text-xs font-bold text-white">{matchData.away_team?.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-black px-1.5 py-0.5 rounded bg-gray-500/10">VISITANTE</span>
                  </div>

                  {/* Warning if already finished */}
                  {matchData.status === 'finished' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] rounded-xl p-3 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-semibold">
                        Este partido ya está finalizado con un resultado de {matchData.home_score} - {matchData.away_score}. Al importar esta acta se sobrescribirán todas las estadísticas y se recalculará la tabla general.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions for OCR scanning */}
            <div className="mt-8 space-y-3">
              <button
                onClick={runOcrScan}
                disabled={isScanning || !imageFile || !selectedMatchId}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 shadow-[0_4px_20px_rgba(245,124,0,0.15)]"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Escanear Planilla con IA</span>
                  </>
                )}
              </button>

              <button
                onClick={loadManualLayout}
                disabled={isScanning || !selectedMatchId}
                className="w-full py-3 bg-[#121212] border border-[#222] text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-[#1a1a1a] transition-all flex items-center justify-center space-x-2 disabled:opacity-30"
              >
                <FileText className="w-4 h-4" />
                <span>Cargar Planilla Vacía (Manual)</span>
              </button>
            </div>
          </div>

          {/* Image Upload Dropzone */}
          <div className="lg:col-span-7 bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-6">
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-orange-500" />
              <span>2. Cargar Foto del Acta</span>
            </h3>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#222] bg-[#121212] flex items-center justify-center max-h-[360px]">
                <img 
                  src={imagePreview} 
                  alt="Vista previa del acta" 
                  className="max-h-[360px] w-auto object-contain p-2"
                />
                
                {/* Glowing Scanning beam line effect */}
                {isScanning && (
                  <div className="absolute inset-0 bg-black/40">
                    <div className="scan-line"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                      <div className="bg-black/80 px-4 py-2.5 rounded-2xl border border-orange-500/30 max-w-sm">
                        <Loader2 className="w-5 h-5 text-orange-500 animate-spin mx-auto mb-2" />
                        <p className="text-xs font-bold tracking-wide">
                          {selectedModel} Leyendo Acta...
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                          {ocrLog[ocrLog.length - 1] || 'Procesando...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!isScanning && (
                  <button 
                    onClick={removeImage}
                    className="absolute top-4 right-4 p-2 bg-black/80 hover:bg-red-500 border border-[#222] hover:border-red-600 rounded-xl text-gray-400 hover:text-white transition-all shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#222] hover:border-orange-500/40 rounded-2xl bg-[#121212] hover:bg-[#151515] p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 text-[#F57C00]">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white">Arrastra y suelta la fotografía de la planilla aquí</p>
                <p className="text-[10px] text-gray-500 mt-1.5">Formatos soportados: JPG, PNG, WEBP. Tamaño máximo: 10MB</p>
                <button 
                  type="button" 
                  className="mt-6 px-4 py-2 bg-[#1b1b1b] border border-[#2c2c2c] text-white font-bold text-xs rounded-xl hover:bg-[#222] transition-colors"
                >
                  Seleccionar archivo
                </button>
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*"
              className="hidden" 
            />
          </div>

        </div>

        {/* Verification and Grid Editor */}
        {showGrid && matchData && (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#1a1a1a] pb-4 gap-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>3. Verificar y Corregir Resultados</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Los resultados detectados por la IA se muestran abajo. Asegúrate de verificar las sumas de cada equipo.
                </p>
              </div>

              {/* Total Scores Inputs */}
              <div className="flex items-center space-x-4 bg-[#121212] p-3 rounded-2xl border border-[#222]">
                <div className="text-center">
                  <span className="text-[9px] font-black text-gray-500 block uppercase mb-1">Total Local</span>
                  <input 
                    type="number"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 bg-[#1a1a1a] border border-[#333] text-center text-sm font-black text-white px-2 py-1.5 rounded-lg outline-none focus:border-orange-500"
                  />
                </div>
                
                <span className="text-xs font-black text-gray-600">-</span>

                <div className="text-center">
                  <span className="text-[9px] font-black text-gray-500 block uppercase mb-1">Total Vis.</span>
                  <input 
                    type="number"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 bg-[#1a1a1a] border border-[#333] text-center text-sm font-black text-white px-2 py-1.5 rounded-lg outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Split Grids: Local Team vs Visitor Team */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Home Team Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#121212] px-4 py-3 rounded-xl border border-[#222]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: matchData.home_team?.logo_color || '#F57C00' }}></div>
                    <span className="text-xs font-black text-white truncate max-w-[200px]">🏠 {matchData.home_team?.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">Sumatoria: {sumPoints(homePlayers)} pts</span>
                </div>

                <div className="overflow-x-auto border border-[#1a1a1a] rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#121212] border-b border-[#1a1a1a] text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4 w-16 text-center">Nº</th>
                        <th className="py-3 px-4">Jugador</th>
                        <th className="py-3 px-4 w-24 text-center">Puntos</th>
                        <th className="py-3 px-4 w-24 text-center">Faltas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {homePlayers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-xs text-gray-600">No hay jugadores registrados en este equipo</td>
                        </tr>
                      ) : (
                        homePlayers.map((player, idx) => (
                          <tr key={player.player_id} className="hover:bg-[#121212] transition-colors">
                            <td className="py-2.5 px-4 text-center font-mono text-xs font-black text-orange-500">
                              {player.number}
                            </td>
                            <td className="py-2.5 px-4 text-xs font-semibold text-white">
                              {player.name}
                            </td>
                            <td className="py-2.5 px-4">
                              <input 
                                type="number"
                                value={player.points}
                                onChange={(e) => updatePlayerField('home', idx, 'points', e.target.value)}
                                className="w-full bg-[#181818] border border-[#2a2a2a] text-center text-xs text-white px-2 py-1.5 rounded-lg outline-none focus:border-orange-500"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="number"
                                  value={player.fouls}
                                  max={5}
                                  onChange={(e) => updatePlayerField('home', idx, 'fouls', e.target.value)}
                                  className={`w-full bg-[#181818] border text-center text-xs text-white px-2 py-1.5 rounded-lg outline-none focus:border-orange-500 ${Number(player.fouls) >= 5 ? 'border-red-500/50 text-red-400' : 'border-[#2a2a2a]'}`}
                                />
                                {Number(player.fouls) >= 5 && (
                                  <span className="text-[9px] font-black text-red-500 uppercase shrink-0">EJECT</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Away Team Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#121212] px-4 py-3 rounded-xl border border-[#222]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: matchData.away_team?.logo_color || '#999' }}></div>
                    <span className="text-xs font-black text-white truncate max-w-[200px]">✈ {matchData.away_team?.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">Sumatoria: {sumPoints(awayPlayers)} pts</span>
                </div>

                <div className="overflow-x-auto border border-[#1a1a1a] rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#121212] border-b border-[#1a1a1a] text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4 w-16 text-center">Nº</th>
                        <th className="py-3 px-4">Jugador</th>
                        <th className="py-3 px-4 w-24 text-center">Puntos</th>
                        <th className="py-3 px-4 w-24 text-center">Faltas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {awayPlayers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-xs text-gray-600">No hay jugadores registrados en este equipo</td>
                        </tr>
                      ) : (
                        awayPlayers.map((player, idx) => (
                          <tr key={player.player_id} className="hover:bg-[#121212] transition-colors">
                            <td className="py-2.5 px-4 text-center font-mono text-xs font-black text-orange-500">
                              {player.number}
                            </td>
                            <td className="py-2.5 px-4 text-xs font-semibold text-white">
                              {player.name}
                            </td>
                            <td className="py-2.5 px-4">
                              <input 
                                type="number"
                                value={player.points}
                                onChange={(e) => updatePlayerField('away', idx, 'points', e.target.value)}
                                className="w-full bg-[#181818] border border-[#2a2a2a] text-center text-xs text-white px-2 py-1.5 rounded-lg outline-none focus:border-orange-500"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="number"
                                  value={player.fouls}
                                  max={5}
                                  onChange={(e) => updatePlayerField('away', idx, 'fouls', e.target.value)}
                                  className={`w-full bg-[#181818] border text-center text-xs text-white px-2 py-1.5 rounded-lg outline-none focus:border-orange-500 ${Number(player.fouls) >= 5 ? 'border-red-500/50 text-red-400' : 'border-[#2a2a2a]'}`}
                                />
                                {Number(player.fouls) >= 5 && (
                                  <span className="text-[9px] font-black text-red-500 uppercase shrink-0">EJECT</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Verification discrepancy alert */}
            {(sumPoints(homePlayers) !== Number(homeScore) || sumPoints(awayPlayers) !== Number(awayScore)) && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded-2xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-0.5">Discrepancia en la puntuación detectada</h4>
                  <p className="leading-relaxed">
                    La suma de los puntos de los jugadores individuales no coincide exactamente con el marcador final del partido.
                    <br />
                    - Local: Sumatoria de jugadores = {sumPoints(homePlayers)} pts | Marcador final = {homeScore} pts.
                    <br />
                    - Visitante: Sumatoria de jugadores = {sumPoints(awayPlayers)} pts | Marcador final = {awayScore} pts.
                    <br />
                    Puedes corregir los valores en la tabla o el marcador superior antes de continuar.
                  </p>
                </div>
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#1a1a1a]">
              <button
                onClick={() => setShowGrid(false)}
                className="px-6 py-3 bg-[#121212] border border-[#222] text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-colors"
              >
                Volver a Escanear
              </button>
              
              <button
                onClick={importResultsToBackend}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-90 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0_4px_20px_rgba(245,124,0,0.15)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Resultados...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Importar Resultados Finales</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  )
}
