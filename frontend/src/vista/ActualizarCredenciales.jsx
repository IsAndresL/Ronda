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
      setError(rol === 'admin' ? 'Las contraseñas no coinciden.' : 'Los PIN no coinciden.')
      return
    }

    if (rol === 'mesero' && !/^\d{4}$/.test(principal)) {
      setError('El nuevo PIN debe tener 4 dígitos.')
      return
    }

    if (rol === 'admin' && principal.length < 6) {
      setError('La nueva contraseña debe tener mínimo 6 caracteres.')
      return
    }

    try {
      setCargando(true)
      const payload =
        rol === 'admin'
          ? { nuevaContrasena: principal, confirmarContrasena: confirmacion }
          : { nuevoPin: principal, confirmarPin: confirmacion }

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
              : 'Define un nuevo PIN de 4 dígitos para operar como mesero.'}
          </p>
        </header>

        <form className="auth-form" onSubmit={actualizar}>
          <label htmlFor="principal">{rol === 'admin' ? 'Nueva contraseña' : 'Nuevo PIN'}</label>
          <input
            id="principal"
            type="password"
            placeholder={rol === 'admin' ? 'Mínimo 6 caracteres' : '1234'}
            maxLength={rol === 'admin' ? 64 : 4}
            value={principal}
            onChange={(e) =>
              setPrincipal(rol === 'mesero' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value)
            }
          />

          <label htmlFor="confirmacion">
            {rol === 'admin' ? 'Confirmar nueva contraseña' : 'Confirmar nuevo PIN'}
          </label>
          <input
            id="confirmacion"
            type="password"
            placeholder={rol === 'admin' ? 'Repite la contraseña' : 'Repite el PIN'}
            maxLength={rol === 'admin' ? 64 : 4}
            value={confirmacion}
            onChange={(e) =>
              setConfirmacion(
                rol === 'mesero' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value
              )
            }
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
