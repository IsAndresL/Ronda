import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrarAdmin } from '../servicios/authServicio'

const Registro = () => {
  const navigate = useNavigate()
  const [formulario, setFormulario] = useState({
    nombre_usuario: '',
    correo_electronico: '',
    contrasena: '',
    confirmar_contrasena: ''
  })
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const onChange = (evento) => {
    const { name, value } = evento.target
    setFormulario((prev) => ({ ...prev, [name]: value }))
  }

  const registrar = async (evento) => {
    evento.preventDefault()
    setError('')
    setMensaje('')

    const { nombre_usuario, correo_electronico, contrasena, confirmar_contrasena } = formulario

    if (!nombre_usuario || !correo_electronico || !contrasena || !confirmar_contrasena) {
      setError('Todos los campos son obligatorios.')
      return
    }

    if (contrasena !== confirmar_contrasena) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      setCargando(true)
      const respuesta = await registrarAdmin(formulario)
      setMensaje(respuesta.mensaje || 'Registro exitoso.')
      setTimeout(() => navigate('/login'), 1400)
    } catch (err) {
      const mensajeBackend = err.response?.data?.mensaje || 'No se pudo completar el registro.'
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
          <h1>Registro de Administrador</h1>
          <p>Crea una cuenta para controlar usuarios y credenciales del sistema.</p>
        </header>

        <form onSubmit={registrar} className="auth-form">
          <label htmlFor="nombre_usuario">Nombre de usuario</label>
          <input
            id="nombre_usuario"
            name="nombre_usuario"
            type="text"
            placeholder="Laura Administradora"
            value={formulario.nombre_usuario}
            onChange={onChange}
          />

          <label htmlFor="correo_electronico">Correo electrónico</label>
          <input
            id="correo_electronico"
            name="correo_electronico"
            type="email"
            placeholder="admin@ronda.com"
            value={formulario.correo_electronico}
            onChange={onChange}
          />

          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formulario.contrasena}
            onChange={onChange}
          />

          <label htmlFor="confirmar_contrasena">Confirmar contraseña</label>
          <input
            id="confirmar_contrasena"
            name="confirmar_contrasena"
            type="password"
            placeholder="Repite la contraseña"
            value={formulario.confirmar_contrasena}
            onChange={onChange}
          />

          {error && <p className="mensaje error">{error}</p>}
          {mensaje && <p className="mensaje ok">{mensaje}</p>}

          <button type="submit" className="btn-principal" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Registrar administrador'}
          </button>
        </form>

        <footer className="auth-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Volver al login</Link>
          </p>
        </footer>
      </section>
    </main>
  )
}

export default Registro
