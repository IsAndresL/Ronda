import Usuario from '../modelo/Usuario.js'

const esEmailValido = (valor) => /^\S+@\S+\.\S+$/.test(valor)
const esUsuarioValido = (valor) => /^[a-zA-Z0-9._-]{3,30}$/.test(valor)

const ControladorUsuario = {
  async registrar(req, res) {
    try {
      if (req.usuario?.rol !== 'admin') {
        return res.status(403).json({ mensaje: 'Solo un administrador puede crear usuarios.' })
      }

      const {
        rolObjetivo,
        nombre_usuario: nombreUsuario,
        correo_electronico: email,
        usuario,
        contrasena,
        confirmar_contrasena
      } = req.body

      if (!rolObjetivo || !['admin', 'mesero'].includes(rolObjetivo)) {
        return res.status(400).json({ mensaje: 'Debes indicar rolObjetivo como admin o mesero.' })
      }

      if (!nombreUsuario || !contrasena || !confirmar_contrasena) {
        return res.status(400).json({ mensaje: 'Debes completar los campos obligatorios.' })
      }

      if (contrasena.length < 6) {
        return res
          .status(400)
          .json({ mensaje: 'La contraseña debe tener mínimo 6 caracteres.' })
      }

      if (contrasena !== confirmar_contrasena) {
        return res.status(400).json({ mensaje: 'Las contraseñas no coinciden.' })
      }

      if (rolObjetivo === 'admin') {
        if (!email || !esEmailValido(email)) {
          return res.status(400).json({ mensaje: 'Debes enviar un correo válido para el admin.' })
        }

        const data = await Usuario.registrarAdmin(nombreUsuario, email, contrasena)

        return res.status(201).json({
          mensaje: 'Administrador creado correctamente.',
          usuario: {
            id: data.user?.id,
            rol: 'admin',
            email: data.user?.email,
            nombre_usuario: nombreUsuario,
            activo: true
          }
        })
      }

      if (!usuario || !esUsuarioValido(usuario)) {
        return res.status(400).json({
          mensaje: 'Para mesero, el usuario debe tener entre 3 y 30 caracteres alfanuméricos.'
        })
      }

      const mesero = await Usuario.registrarMesero(nombreUsuario, usuario, contrasena)

      return res.status(201).json({
        mensaje: 'Mesero creado correctamente.',
        usuario: {
          id: mesero.id,
          rol: 'mesero',
          usuario: mesero.usuario,
          nombre_usuario: mesero.nombre_usuario,
          activo: mesero.activo
        }
      })
    } catch (error) {
      return res.status(500).json({ mensaje: `Error al registrar usuario: ${error.message}` })
    }
  },

  async login(req, res) {
    try {
      const { correo_electronico: email, usuario, contrasena } = req.body

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

      // Login mesero: usuario + contraseña.
      if (usuario && contrasena) {
        if (!esUsuarioValido(usuario)) {
          return res.status(400).json({
            mensaje: 'Usuario de mesero inválido. Usa entre 3 y 30 caracteres alfanuméricos.'
          })
        }

        const resultado = await Usuario.loginMesero(usuario, contrasena)

        if (!resultado) {
          return res.status(401).json({ mensaje: 'Usuario o contraseña inválidos para mesero.' })
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
        mensaje: 'Debes enviar correo + contraseña (admin) o usuario + contraseña (mesero).'
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

      const { nuevaContrasena, confirmarContrasena } = req.body

      if (!nuevaContrasena || !confirmarContrasena) {
        return res
          .status(400)
          .json({ mensaje: 'Debes enviar nuevaContrasena y confirmarContrasena.' })
      }

      if (nuevaContrasena.length < 6) {
        return res
          .status(400)
          .json({ mensaje: 'La nueva contraseña del mesero debe tener mínimo 6 caracteres.' })
      }

      if (nuevaContrasena !== confirmarContrasena) {
        return res.status(400).json({ mensaje: 'Las contraseñas no coinciden.' })
      }

      await Usuario.actualizarContrasenaMesero(req.usuario.meseroId, nuevaContrasena)

      return res.status(200).json({ mensaje: 'Contraseña de mesero actualizada correctamente.' })
    } catch (error) {
      return res.status(500).json({ mensaje: `Error al actualizar credenciales: ${error.message}` })
    }
  },

  async listarUsuarios(req, res) {
    try {
      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ mensaje: 'Solo un administrador puede ver la lista de usuarios.' })
      }

      const data = await Usuario.listarUsuarios()

      return res.status(200).json({
        mensaje: 'Listado de usuarios obtenido correctamente.',
        ...data
      })
    } catch (error) {
      return res.status(500).json({ mensaje: `Error al listar usuarios: ${error.message}` })
    }
  },

  async suspender(req, res) {
    try {
      const { id } = req.params
      const { rolObjetivo, suspender } = req.body

      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ mensaje: 'Solo un administrador puede suspender usuarios.' })
      }

      if (!['admin', 'mesero'].includes(rolObjetivo)) {
        return res.status(400).json({ mensaje: 'Debes indicar rolObjetivo como admin o mesero.' })
      }

      if (typeof suspender !== 'boolean') {
        return res.status(400).json({ mensaje: 'Debes enviar suspender como true o false.' })
      }

      if (rolObjetivo === 'admin') {
        await Usuario.suspenderAdmin(id, suspender)
      } else {
        await Usuario.suspenderMesero(id, suspender)
      }

      return res.status(200).json({
        mensaje: suspender
          ? `Usuario ${rolObjetivo} suspendido correctamente.`
          : `Usuario ${rolObjetivo} reactivado correctamente.`,
        id
      })
    } catch (error) {
      return res.status(500).json({ mensaje: `Error al suspender usuario: ${error.message}` })
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

      if (rolObjetivo === 'admin' && id === req.usuario.id) {
        return res.status(400).json({
          mensaje: 'No puedes eliminar tu propia cuenta de administrador.'
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
