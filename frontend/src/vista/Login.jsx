import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { guardarSesion, loginAdmin, loginMesero } from '../servicios/authServicio'

const Login = () => {
  const navigate = useNavigate()
  const [modo, setModo] = useState('admin')
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [pin, setPin] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const subtitulo = useMemo(
    () =>
      modo === 'admin'
        ? 'Accede con correo y contraseña para gestionar todo el sistema.'
        : 'Accede con tu PIN de 4 dígitos para operar en sala.',
    [modo]
  )

  const iniciarSesion = async (evento) => {
    evento.preventDefault()
    setError('')

    try {
      setCargando(true)

      let respuesta
      if (modo === 'admin') {
        if (!email || !contrasena) {
          setError('Debes completar correo y contraseña.')
          return
        }

        respuesta = await loginAdmin(email, contrasena)
      } else {
        if (!/^\d{4}$/.test(pin)) {
          setError('El PIN debe contener exactamente 4 dígitos.')
          return
        }

        respuesta = await loginMesero(pin)
      }

      guardarSesion({
        token: respuesta.token,
        rol: respuesta.rol,
        usuario: respuesta.usuario
      })

      navigate('/bienvenida')
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'No fue posible iniciar sesión. Intenta nuevamente.'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="auth-card reveal-up">
        <header className="brand-header">
          <p className="badge">RONDA</p>
          <h1>Bienvenido</h1>
          <p>{subtitulo}</p>
        </header>

        <div className="tab-group" role="tablist" aria-label="Tipo de acceso">
          <button
            type="button"
            className={`tab-btn ${modo === 'admin' ? 'active' : ''}`}
            onClick={() => setModo('admin')}
          >
            Admin
          </button>
          <button
            type="button"
            className={`tab-btn ${modo === 'mesero' ? 'active' : ''}`}
            onClick={() => setModo('mesero')}
          >
            Mesero
          </button>
        </div>

        <form onSubmit={iniciarSesion} className="auth-form">
          {modo === 'admin' ? (
            <>
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                placeholder="admin@ronda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <label htmlFor="contrasena">Contraseña</label>
              <input
                id="contrasena"
                type="password"
                placeholder="********"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
              />
            </>
          ) : (
            <>
              <label htmlFor="pin">PIN de 4 dígitos</label>
              <input
                id="pin"
                type="password"
                placeholder="1234"
                maxLength={4}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </>
          )}

          {error && <p className="mensaje error">{error}</p>}

          <button type="submit" className="btn-principal" disabled={cargando}>
            {cargando ? 'Validando...' : 'Entrar a RONDA'}
          </button>
        </form>

        <footer className="auth-footer">
          <p>
            ¿Nuevo administrador? <Link to="/registro">Crear cuenta</Link>
          </p>
        </footer>
      </section>
    </main>
  )
}

export default Login
