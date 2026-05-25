import { useState, useEffect } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import { UserCheck, Plus, Trash2, Edit2, X, Sparkles, Phone, Mail, Award } from 'lucide-react'
import { confirmDelete, toastWarn, toastSuccess, toastError } from '../../lib/swal'
import client from '../../api/client'

function RefereeModal({ referee, onClose, onSuccess }) {
  const [data, setDataState] = useState({
    name: referee?.name ?? '',
    certification: referee?.certification ?? 'FIBA',
    phone: referee?.phone ?? '',
    email: referee?.email ?? '',
    status: referee?.status ?? 'activo',
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  const setData = (keyOrFunc, value) => {
    if (typeof keyOrFunc === 'function') {
      setDataState(keyOrFunc);
    } else if (typeof keyOrFunc === 'object' && keyOrFunc !== null) {
      setDataState(prev => ({ ...prev, ...keyOrFunc }));
    } else {
      setDataState(prev => ({ ...prev, [keyOrFunc]: value }));
    }
  };

  const submit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})
    const request = referee
      ? client.put(`/admin/arbitros/${referee.id}`, data)
      : client.post('/admin/arbitros', data)

    request
      .then(() => {
        toastSuccess(referee ? 'Árbitro actualizado con éxito' : 'Árbitro creado con éxito')
        onSuccess()
      })
      .catch(err => {
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors)
        } else {
          toastError('Error al guardar el árbitro')
        }
      })
      .finally(() => setProcessing(false))
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#222] rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white">{referee ? 'Editar Árbitro' : 'Nuevo Árbitro'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">🦺 Nombre completo del árbitro</label>
            <input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Ej: Juan Pérez López" required
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">🏅 Certificación / Licencia <span className="normal-case text-gray-600 font-normal">(ej: FIBA, FBF)</span></label>
            <input value={data.certification} onChange={e => setData('certification', e.target.value)} placeholder="Ej: FIBA Internacional"
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">📞 Teléfono</label>
              <input value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="Ej: 0987654321"
                className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">✉ Correo electrónico</label>
              <input value={data.email} onChange={e => setData('email', e.target.value)} placeholder="Ej: arbitro@mail.com" type="email"
                className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
            </div>
          </div>
          {referee && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">📋 Estado del árbitro</label>
              <select value={data.status} onChange={e => setData('status', e.target.value)}
                className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500">
                <option value="activo">✅ Activo — disponible para partidos</option>
                <option value="inactivo">⛔ Inactivo — no disponible</option>
              </select>
            </div>
          )}
          <div className="glow-btn-orange rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 w-full mt-2">
            <button type="submit" disabled={processing}
              className="w-full py-3.5 bg-gray-800 text-white font-extrabold text-sm rounded-full transition-all disabled:opacity-50">
              {processing ? 'Guardando...' : referee ? 'Actualizar' : 'Crear Árbitro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Referees() {
  const [referees, setReferees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const fetchReferees = () => {
    client.get('/admin/arbitros')
      .then(res => {
        setReferees(res.data.referees || [])
      })
      .catch(err => {
        toastError('Error al cargar la lista de árbitros')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReferees()
  }, [])

  const deleteReferee = async (id) => {
    const result = await confirmDelete('¿Eliminar árbitro?', 'Esta acción no se puede deshacer.')
    if (result.isConfirmed) {
      client.delete(`/admin/arbitros/${id}`)
        .then(() => {
          toastSuccess('Árbitro eliminado con éxito')
          fetchReferees()
        })
        .catch(() => {
          toastError('Error al eliminar el árbitro')
        })
    }
  }

  const handleModalSuccess = () => {
    setModal(null)
    fetchReferees()
  }

  if (loading) {
    return (
      <AdminLayout title="Árbitros">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400 font-bold text-sm">Cargando árbitros...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Árbitros">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-500 px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 mr-1" /> Colegio Arbitral
            </span>
            <h1 className="text-xl font-black text-white mt-1">Árbitros</h1>
          </div>
          <div className="glow-btn-orange rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100">
            <button onClick={() => setModal({})}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gray-800 text-white text-xs font-extrabold rounded-full transition-all">
              <Plus className="w-4 h-4 text-[#F57C00]" />
              <span>Nuevo Árbitro</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {referees.length === 0 ? (
            <div className="col-span-full bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 text-center text-gray-500 text-xs font-bold">
              No hay árbitros registrados.
            </div>
          ) : (
            referees.map(ref => (
              <div key={ref.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 hover:border-[#333] transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => setModal({ referee: ref })}
                      className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-[#222]">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteReferee(ref.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-950/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{ref.name}</h3>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                    <Award className="w-3 h-3" />
                    <span>{ref.certification}</span>
                  </div>
                  {ref.phone && (
                    <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                      <Phone className="w-3 h-3" />
                      <span>{ref.phone}</span>
                    </div>
                  )}
                  {ref.email && (
                    <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                      <Mail className="w-3 h-3" />
                      <span>{ref.email}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ref.status === 'activo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {ref.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modal !== null && (
        <RefereeModal referee={modal.referee} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />
      )}
    </AdminLayout>
  )
}
