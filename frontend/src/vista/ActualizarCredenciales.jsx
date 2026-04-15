import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { actualizarCredenciales, obtenerRol, obtenerToken } from '../servicios/authServicio'

const ActualizarCredenciales = () => {
  const navigate = useNavigate()
  const [rol, setRol] = useState('')
  const [principal, setPrincipal] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const token = obtenerToken()
    const rolActual = obtenerRol()

    if (!token || !rolActual) {
      navigate('/login', { replace: true })
      return
    }

    setRol(rolActual)
  }, [navigate])

  const actualizar = async (evento) => {
    evento.preventDefault()
    setError('')
    setMensaje('')

    const token = obtenerToken()
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (!principal || !confirmacion) {
      setError('Debes completar ambos campos.')
      return
    }

    if (principal !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (principal.length < 6) {
      setError('La nueva contraseña debe tener mínimo 6 caracteres.')
      return
    }

    try {
      setCargando(true)
      const payload =
        rol === 'admin'
          ? { nuevaContrasena: principal, confirmarContrasena: confirmacion }
          : { nuevaContrasena: principal, confirmarContrasena: confirmacion }

      const data = await actualizarCredenciales(payload, token)
      setMensaje(data.mensaje || 'Credencial actualizada correctamente.')
      setPrincipal('')
      setConfirmacion('')
    } catch (err) {
      const mensajeBackend = err.response?.data?.mensaje || 'No fue posible actualizar tus credenciales.'
      setError(mensajeBackend)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="auth-card reveal-up">
        <header className="brand-header">
          <p className="badge">RONDA</p>
          <h1>Actualizar Credenciales</h1>
          <p>
            {rol === 'admin'
              ? 'Define una nueva contraseña para tu cuenta de administrador.'
              : 'Define una nueva contraseña para tu cuenta de mesero.'}
          </p>
        </header>

        <form className="auth-form" onSubmit={actualizar}>
          <label htmlFor="principal">Nueva contraseña</label>
          <input
            id="principal"
            type="password"
            placeholder="Mínimo 6 caracteres"
            maxLength={64}
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />

          <label htmlFor="confirmacion">Confirmar nueva contraseña</label>
          <input
            id="confirmacion"
            type="password"
            placeholder="Repite la contraseña"
            maxLength={64}
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
          />

          {error && <p className="mensaje error">{error}</p>}
          {mensaje && <p className="mensaje ok">{mensaje}</p>}

          <button type="submit" className="btn-principal" disabled={cargando}>
            {cargando ? 'Actualizando...' : 'Guardar cambios'}
          </button>
        </form>

        <footer className="auth-footer">
          <p>
            <Link to="/bienvenida">Volver a bienvenida</Link>
          </p>
        </footer>
      </section>
    </main>
  )
}

export default ActualizarCredenciales
