import { supabase } from '../config/supabase.js'

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'Token no proporcionado o formato inválido.' })
    }

    const token = authHeader.split(' ')[1]
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      return res.status(401).json({ mensaje: 'Token inválido o expirado.' })
    }

    const metadata = data.user.user_metadata ?? {}
    const esMesero = metadata.rol === 'mesero' && Boolean(metadata.mesero_id)

    req.token = token
    req.usuario = {
      id: data.user.id,
      email: data.user.email,
      rol: esMesero ? 'mesero' : 'admin',
      meseroId: esMesero ? metadata.mesero_id : null,
      nombre_usuario: metadata.nombre_usuario ?? null
    }

    return next()
  } catch (error) {
    return res.status(500).json({ mensaje: `Error en autenticación: ${error.message}` })
  }
}

export default authMiddleware
