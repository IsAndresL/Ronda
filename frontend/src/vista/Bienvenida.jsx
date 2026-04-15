import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  cerrarSesion,
  eliminarUsuario,
  obtenerPerfil,
  obtenerRol,
  obtenerToken,
  obtenerUsuarioGuardado
} from '../servicios/authServicio'

const Bienvenida = () => {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [rol, setRol] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [eliminarForm, setEliminarForm] = useState({ id: '', rolObjetivo: 'mesero' })
  const [mensajeEliminar, setMensajeEliminar] = useState('')

  useEffect(() => {
    const token = obtenerToken()
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const cargarPerfil = async () => {
      try {
        const data = await obtenerPerfil(token)
        setPerfil(data.perfil)
        setRol(data.rol || obtenerRol() || '')
      } catch (err) {
        const mensaje = err.response?.data?.mensaje || 'No fue posible cargar tu perfil.'
        setError(mensaje)
      } finally {
        setCargando(false)
      }
    }

    cargarPerfil()
  }, [navigate])

  const salir = () => {
    cerrarSesion()
    navigate('/login')
  }

  const eliminar = async (evento) => {
    evento.preventDefault()
    setMensajeEliminar('')

    if (!eliminarForm.id) {
      setMensajeEliminar('Debes ingresar el ID del usuario a eliminar.')
      return
    }

    try {
      const token = obtenerToken()
      const data = await eliminarUsuario(eliminarForm.id, token, eliminarForm.rolObjetivo)
      setMensajeEliminar(data.mensaje || 'Usuario eliminado correctamente.')
      setEliminarForm((prev) => ({ ...prev, id: '' }))
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'No fue posible eliminar el usuario.'
      setMensajeEliminar(mensaje)
    }
  }

  const usuarioCache = obtenerUsuarioGuardado()
  const nombre =
    perfil?.nombre_usuario || usuarioCache?.nombre_usuario || perfil?.email || usuarioCache?.email || 'Equipo'

  if (cargando) {
    return (
      <main className="app-shell">
        <section className="panel-card reveal-up">
          <p>Cargando datos de sesión...</p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="app-shell">
        <section className="panel-card reveal-up">
          <p className="mensaje error">{error}</p>
          <button type="button" className="btn-principal" onClick={salir}>
            Volver al login
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="panel-card reveal-up">
        <p className="badge">RONDA</p>
        <h1>Bienvenido, {nombre}</h1>
        <p>
          Sesión activa como <strong>{rol === 'admin' ? 'Administrador' : 'Mesero'}</strong>.
        </p>

        <div className="panel-actions">
          <Link className="btn-principal" to="/actualizar">
            Actualizar mis credenciales
          </Link>
          <button type="button" className="btn-secundario" onClick={salir}>
            Cerrar sesión
          </button>
        </div>

        {rol === 'admin' && (
          <article className="danger-zone">
            <h2>Eliminar usuario</h2>
            <p>Operación DELETE protegida para remover admins o meseros por ID.</p>

            <form className="inline-form" onSubmit={eliminar}>
              <input
                type="text"
                placeholder="ID del usuario"
                value={eliminarForm.id}
                onChange={(e) => setEliminarForm((prev) => ({ ...prev, id: e.target.value }))}
              />

              <select
                value={eliminarForm.rolObjetivo}
                onChange={(e) =>
                  setEliminarForm((prev) => ({ ...prev, rolObjetivo: e.target.value }))
                }
              >
                <option value="mesero">Mesero</option>
                <option value="admin">Admin</option>
              </select>

              <button type="submit" className="btn-alerta">
                Eliminar
              </button>
            </form>

            {mensajeEliminar && <p className="mensaje">{mensajeEliminar}</p>}
          </article>
        )}
      </section>
    </main>
  )
}

export default Bienvenida
