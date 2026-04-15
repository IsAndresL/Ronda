import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  cerrarSesion,
  eliminarUsuario,
  listarUsuarios,
  obtenerPerfil,
  obtenerRol,
  obtenerToken,
  obtenerUsuarioGuardado,
  registrarUsuario,
  suspenderUsuario
} from '../servicios/authServicio'

const Bienvenida = () => {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [rol, setRol] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [usuarios, setUsuarios] = useState({ admins: [], meseros: [] })
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)
  const [mensajeGestion, setMensajeGestion] = useState('')
  const [formRegistro, setFormRegistro] = useState({
    rolObjetivo: 'mesero',
    nombre_usuario: '',
    correo_electronico: '',
    usuario: '',
    contrasena: '',
    confirmar_contrasena: ''
  })

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

        const rolSesion = data.rol || obtenerRol() || ''
        setRol(rolSesion)

        if (rolSesion === 'admin') {
          await cargarUsuarios(token)
        }
      } catch (err) {
        const mensaje = err.response?.data?.mensaje || 'No fue posible cargar tu perfil.'
        setError(mensaje)
      } finally {
        setCargando(false)
      }
    }

    cargarPerfil()
  }, [navigate])

  const cargarUsuarios = async (tokenParam) => {
    const token = tokenParam || obtenerToken()
    if (!token) return

    try {
      setCargandoUsuarios(true)
      const data = await listarUsuarios(token)
      setUsuarios({
        admins: data.admins ?? [],
        meseros: data.meseros ?? []
      })
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'No fue posible cargar la lista de usuarios.'
      setMensajeGestion(mensaje)
    } finally {
      setCargandoUsuarios(false)
    }
  }

  const salir = () => {
    cerrarSesion()
    navigate('/login')
  }

  const crearUsuario = async (evento) => {
    evento.preventDefault()
    setMensajeGestion('')

    if (!formRegistro.nombre_usuario || !formRegistro.contrasena || !formRegistro.confirmar_contrasena) {
      setMensajeGestion('Completa los datos obligatorios para crear el usuario.')
      return
    }

    if (formRegistro.contrasena !== formRegistro.confirmar_contrasena) {
      setMensajeGestion('Las contraseñas no coinciden.')
      return
    }

    if (formRegistro.rolObjetivo === 'admin' && !formRegistro.correo_electronico) {
      setMensajeGestion('Para admin debes ingresar correo electrónico.')
      return
    }

    if (formRegistro.rolObjetivo === 'mesero' && !formRegistro.usuario) {
      setMensajeGestion('Para mesero debes ingresar usuario.')
      return
    }

    try {
      const token = obtenerToken()
      const payload = {
        rolObjetivo: formRegistro.rolObjetivo,
        nombre_usuario: formRegistro.nombre_usuario,
        contrasena: formRegistro.contrasena,
        confirmar_contrasena: formRegistro.confirmar_contrasena
      }

      if (formRegistro.rolObjetivo === 'admin') {
        payload.correo_electronico = formRegistro.correo_electronico
      } else {
        payload.usuario = formRegistro.usuario
      }

      const data = await registrarUsuario(payload, token)
      setMensajeGestion(data.mensaje || 'Usuario creado correctamente.')
      setFormRegistro({
        rolObjetivo: formRegistro.rolObjetivo,
        nombre_usuario: '',
        correo_electronico: '',
        usuario: '',
        contrasena: '',
        confirmar_contrasena: ''
      })
      await cargarUsuarios(token)
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'No fue posible eliminar el usuario.'
      setMensajeGestion(mensaje)
    }
  }

  const cambiarSuspension = async (item) => {
    try {
      const token = obtenerToken()
      const data = await suspenderUsuario(item.id, token, item.rol, item.activo)
      setMensajeGestion(data.mensaje || 'Estado de credencial actualizado.')
      await cargarUsuarios(token)
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'No fue posible actualizar la credencial.'
      setMensajeGestion(mensaje)
    }
  }

  const eliminar = async (item) => {
    try {
      const token = obtenerToken()
      const data = await eliminarUsuario(item.id, token, item.rol)
      setMensajeGestion(data.mensaje || 'Usuario eliminado correctamente.')
      await cargarUsuarios(token)
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'No fue posible eliminar el usuario.'
      setMensajeGestion(mensaje)
    }
  }

  const usuarioCache = obtenerUsuarioGuardado()
  const nombre =
    perfil?.nombre_usuario || usuarioCache?.nombre_usuario || perfil?.email || usuarioCache?.email || 'Equipo'
  const idAdminActual = perfil?.id ?? null

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
            <h2>Gestión de usuarios</h2>
            <p>
              Desde aquí el administrador crea usuarios por rol y gestiona credenciales con acciones
              de suspensión/reactivación y eliminación.
            </p>

            <form className="inline-form" onSubmit={crearUsuario}>
              <select
                value={formRegistro.rolObjetivo}
                onChange={(e) => setFormRegistro((prev) => ({ ...prev, rolObjetivo: e.target.value }))}
              >
                <option value="mesero">Crear mesero</option>
                <option value="admin">Crear admin</option>
              </select>

              <input
                type="text"
                placeholder="Nombre visible"
                value={formRegistro.nombre_usuario}
                onChange={(e) => setFormRegistro((prev) => ({ ...prev, nombre_usuario: e.target.value }))}
              />

              {formRegistro.rolObjetivo === 'admin' ? (
                <input
                  type="email"
                  placeholder="Correo del admin"
                  value={formRegistro.correo_electronico}
                  onChange={(e) =>
                    setFormRegistro((prev) => ({ ...prev, correo_electronico: e.target.value }))
                  }
                />
              ) : (
                <input
                  type="text"
                  placeholder="Usuario del mesero"
                  value={formRegistro.usuario}
                  onChange={(e) => setFormRegistro((prev) => ({ ...prev, usuario: e.target.value }))}
                />
              )}

              <input
                type="password"
                placeholder="Contraseña"
                value={formRegistro.contrasena}
                onChange={(e) => setFormRegistro((prev) => ({ ...prev, contrasena: e.target.value }))}
              />

              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={formRegistro.confirmar_contrasena}
                onChange={(e) =>
                  setFormRegistro((prev) => ({ ...prev, confirmar_contrasena: e.target.value }))
                }
              />

              <button type="submit" className="btn-principal">
                Crear usuario
              </button>
            </form>

            {mensajeGestion && <p className="mensaje">{mensajeGestion}</p>}

            <div className="usuarios-grid">
              <h3>Admins</h3>
              {cargandoUsuarios && <p>Cargando usuarios...</p>}
              {!cargandoUsuarios && usuarios.admins.length === 0 && <p>No hay admins listados.</p>}
              {!cargandoUsuarios &&
                usuarios.admins.map((item) => {
                  const esAdminActual = idAdminActual && item.id === idAdminActual

                  return (
                    <div className="usuario-item" key={item.id}>
                    <div>
                      <strong>{item.nombre_usuario}</strong>
                      <p>{item.usuario}</p>
                      <p>Estado: {item.activo ? 'Activo' : 'Suspendido'}</p>
                    </div>
                    <div className="acciones-usuario">
                      {esAdminActual ? (
                        <p className="mensaje">Cuenta actual</p>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn-secundario"
                            onClick={() => cambiarSuspension(item)}
                          >
                            {item.activo ? 'Suspender credencial' : 'Reactivar credencial'}
                          </button>
                          <button type="button" className="btn-alerta" onClick={() => eliminar(item)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                    </div>
                  )
                })}

              <h3>Meseros</h3>
              {!cargandoUsuarios && usuarios.meseros.length === 0 && <p>No hay meseros listados.</p>}
              {!cargandoUsuarios &&
                usuarios.meseros.map((item) => (
                  <div className="usuario-item" key={item.id}>
                    <div>
                      <strong>{item.nombre_usuario}</strong>
                      <p>@{item.usuario}</p>
                      <p>Estado: {item.activo ? 'Activo' : 'Suspendido'}</p>
                    </div>
                    <div className="acciones-usuario">
                      <button
                        type="button"
                        className="btn-secundario"
                        onClick={() => cambiarSuspension(item)}
                      >
                        {item.activo ? 'Suspender credencial' : 'Reactivar credencial'}
                      </button>
                      <button type="button" className="btn-alerta" onClick={() => eliminar(item)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
            </div>

          </article>
        )}
      </section>
    </main>
  )
}

export default Bienvenida
