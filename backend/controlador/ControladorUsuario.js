import Usuario from '../modelo/Usuario.js'

const esEmailValido = (valor) => /^\S+@\S+\.\S+$/.test(valor)
const esPinValido = (valor) => /^\d{4}$/.test(valor)

const ControladorUsuario = {
  async registrar(req, res) {
    try {
      const { nombre_usuario: nombreUsuario, correo_electronico: email, contrasena, confirmar_contrasena } =
        req.body

      if (!nombreUsuario || !email || !contrasena || !confirmar_contrasena) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios para el registro.' })
      }

      if (!esEmailValido(email)) {
        return res.status(400).json({ mensaje: 'El correo electrónico no es válido.' })
      }

      if (contrasena.length < 6) {
        return res
          .status(400)
          .json({ mensaje: 'La contraseña debe tener mínimo 6 caracteres.' })
      }

      if (contrasena !== confirmar_contrasena) {
        return res.status(400).json({ mensaje: 'Las contraseñas no coinciden.' })
      }

      const data = await Usuario.registrar(nombreUsuario, email, contrasena)

      return res.status(201).json({
        mensaje: 'Administrador registrado correctamente. Revisa tu correo para confirmar la cuenta.',
        usuario: {
          id: data.user?.id,
          email: data.user?.email,
          nombre_usuario: nombreUsuario
        }
      })
    } catch (error) {
      return res.status(500).json({ mensaje: `Error al registrar usuario: ${error.message}` })
    }
  },

  async login(req, res) {
    try {
      const { correo_electronico: email, contrasena, pin } = req.body

      // Login admin: email + contraseña.
      if (email && contrasena) {
        const data = await Usuario.loginAdmin(email, contrasena)

        return res.status(200).json({
          mensaje: 'Login admin exitoso.',
          token: data.session?.access_token,
          rol: 'admin',
          usuario: {
            id: data.user?.id,
            email: data.user?.email,
            nombre_usuario: data.user?.user_metadata?.nombre_usuario ?? 'Administrador'
          }
        })
      }

      // Login mesero: PIN de 4 dígitos.
      if (pin) {
        if (!esPinValido(pin)) {
          return res.status(400).json({ mensaje: 'El PIN debe contener exactamente 4 dígitos.' })
        }

        const resultado = await Usuario.loginMesero(pin)

        if (!resultado) {
          return res.status(401).json({ mensaje: 'PIN inválido o mesero inactivo.' })
        }

        if (!resultado.token) {
          return res.status(500).json({
            mensaje: 'No se pudo generar token para el mesero. Revisa la configuración de Supabase Auth.'
          })
        }

        return res.status(200).json({
          mensaje: 'Login mesero exitoso.',
          token: resultado.token,
          rol: 'mesero',
          usuario: resultado.mesero
        })
      }

      return res.status(400).json({
        mensaje: 'Debes enviar correo + contraseña (admin) o PIN (mesero).'
      })
    } catch (error) {
      const status = error.message.toLowerCase().includes('invalid login credentials') ? 401 : 500
      return res.status(status).json({ mensaje: `Error al iniciar sesión: ${error.message}` })
    }
  },

  async perfil(req, res) {
    try {
      if (req.usuario.rol === 'mesero') {
        const mesero = await Usuario.obtenerMeseroPorId(req.usuario.meseroId)

        return res.status(200).json({
          rol: 'mesero',
          perfil: mesero
        })
      }

      const admin = await Usuario.obtenerAdminPorToken(req.token)

      return res.status(200).json({
        rol: 'admin',
        perfil: {
          id: admin.id,
          email: admin.email,
          nombre_usuario: admin.user_metadata?.nombre_usuario ?? 'Administrador'
        }
      })
    } catch (error) {
      return res.status(500).json({ mensaje: `Error al obtener perfil: ${error.message}` })
    }
  },

  async actualizar(req, res) {
    try {
      if (req.usuario.rol === 'admin') {
        const { nuevaContrasena, confirmarContrasena } = req.body

        if (!nuevaContrasena || !confirmarContrasena) {
          return res
            .status(400)
            .json({ mensaje: 'Debes enviar nuevaContrasena y confirmarContrasena.' })
        }

        if (nuevaContrasena.length < 6) {
          return res
            .status(400)
            .json({ mensaje: 'La nueva contraseña debe tener mínimo 6 caracteres.' })
        }

        if (nuevaContrasena !== confirmarContrasena) {
          return res.status(400).json({ mensaje: 'Las contraseñas no coinciden.' })
        }

        await Usuario.actualizarContrasena(req.token, nuevaContrasena)

        return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' })
      }

      const { nuevoPin, confirmarPin } = req.body

      if (!nuevoPin || !confirmarPin) {
        return res.status(400).json({ mensaje: 'Debes enviar nuevoPin y confirmarPin.' })
      }

      if (!esPinValido(nuevoPin)) {
        return res.status(400).json({ mensaje: 'El PIN debe contener exactamente 4 dígitos.' })
      }

      if (nuevoPin !== confirmarPin) {
        return res.status(400).json({ mensaje: 'Los PIN no coinciden.' })
      }

      await Usuario.actualizarPIN(req.usuario.meseroId, nuevoPin)

      return res.status(200).json({ mensaje: 'PIN actualizado correctamente.' })
    } catch (error) {
      return res.status(500).json({ mensaje: `Error al actualizar credenciales: ${error.message}` })
    }
  },

  async eliminar(req, res) {
    try {
      const { id } = req.params
      const { rolObjetivo } = req.body

      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ mensaje: 'Solo un administrador puede eliminar usuarios.' })
      }

      if (!rolObjetivo || !['admin', 'mesero'].includes(rolObjetivo)) {
        return res.status(400).json({
          mensaje: 'Debes indicar rolObjetivo con valor admin o mesero.'
        })
      }

      if (rolObjetivo === 'admin') {
        await Usuario.eliminarAdmin(id)
      } else {
        await Usuario.eliminarMesero(id)
      }

      return res.status(200).json({
        mensaje: `Usuario ${rolObjetivo} eliminado correctamente.`,
        id
      })
    } catch (error) {
      return res.status(500).json({ mensaje: `Error al eliminar usuario: ${error.message}` })
    }
  }
}

export default ControladorUsuario
