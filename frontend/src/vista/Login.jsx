import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarSesion, loginAdmin, loginMesero } from '../servicios/authServicio'

const Login = () => {
  const navigate = useNavigate()
  const [modo, setModo] = useState('admin')
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [usuarioMesero, setUsuarioMesero] = useState('')
  const [contrasenaMesero, setContrasenaMesero] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const subtitulo = useMemo(
    () =>
      modo === 'admin'
        ? 'Accede con correo y contraseña para gestionar todo el sistema.'
        : 'Accede con usuario y contraseña para operar en sala.',
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
        if (!usuarioMesero || !contrasenaMesero) {
          setError('Debes completar usuario y contraseña del mesero.')
          return
        }

        respuesta = await loginMesero(usuarioMesero, contrasenaMesero)
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
              <label htmlFor="usuarioMesero">Usuario de mesero</label>
              <input
                id="usuarioMesero"
                type="text"
                placeholder="carlos.mesero"
                maxLength={30}
                value={usuarioMesero}
                onChange={(e) => setUsuarioMesero(e.target.value)}
                autoComplete="username"
              />

              <label htmlFor="contrasenaMesero">Contraseña</label>
              <input
                id="contrasenaMesero"
                type="password"
                placeholder="********"
                value={contrasenaMesero}
                onChange={(e) => setContrasenaMesero(e.target.value)}
                autoComplete="current-password"
              />
            </>
          )}

          {error && <p className="mensaje error">{error}</p>}

          <button type="submit" className="btn-principal" disabled={cargando}>
            {cargando ? 'Validando...' : 'Entrar a RONDA'}
          </button>
        </form>

        <footer className="auth-footer">
          <p>La creación de usuarios se realiza solo dentro del panel de administración.</p>
        </footer>
      </section>
    </main>
  )
}

export default Login
