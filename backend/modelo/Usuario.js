import bcrypt from 'bcryptjs'
import { crearClienteConToken, supabase, supabaseAdmin } from '../config/supabase.js'

const SALT_ROUNDS = 10
const BLOQUEO_LARGO = '876000h'

const requiereAdminClient = () => {
  if (!supabaseAdmin) {
    throw new Error('No hay SUPABASE_SERVICE_ROLE_KEY configurada para operaciones administrativas.')
  }
}

const Usuario = {
  async registrarAdmin(nombreUsuario, email, contrasena) {
    requiereAdminClient()

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: contrasena,
      email_confirm: true,
      user_metadata: {
        nombre_usuario: nombreUsuario,
        rol: 'admin',
        activo: true
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    // Si existe tabla profiles, se intenta guardar el nombre sin romper el flujo.
    if (data?.user?.id && nombreUsuario) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          nombre_usuario: nombreUsuario,
          email
        },
        {
          onConflict: 'id'
        }
      )
    }

    return data
  },

  async registrarMesero(nombreUsuario, usuario, contrasena) {
    const hashContrasena = await bcrypt.hash(contrasena, SALT_ROUNDS)

    const { data, error } = await supabase
      .from('meseros')
      .insert({
        nombre_usuario: nombreUsuario,
        usuario: usuario.toLowerCase(),
        contrasena: hashContrasena,
        activo: true
      })
      .select('id, nombre_usuario, usuario, activo, created_at')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async loginAdmin(email, contrasena) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: contrasena
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async loginMesero(usuario, contrasena) {
    const { data: mesero, error } = await supabase
      .from('meseros')
      .select('id, nombre_usuario, usuario, contrasena, activo')
      .eq('usuario', usuario.toLowerCase())
      .eq('activo', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }

      throw new Error(error.message)
    }

    const coincide = await bcrypt.compare(contrasena, mesero.contrasena)

    if (coincide) {
      const { data: sesionData, error: sesionError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            rol: 'mesero',
            mesero_id: mesero.id,
            nombre_usuario: mesero.nombre_usuario
          }
        }
      })

      if (sesionError) {
        throw new Error(
          `${sesionError.message}. Verifica que el login anónimo esté habilitado en Supabase.`
        )
      }

      return {
        mesero: {
          id: mesero.id,
          nombre_usuario: mesero.nombre_usuario,
          usuario: mesero.usuario,
          activo: mesero.activo
        },
        token: sesionData?.session?.access_token ?? null
      }
    }

    return null
  },

  async obtenerAdminPorToken(token) {
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      throw new Error(error.message)
    }

    return data.user
  },

  async obtenerMeseroPorId(id) {
    const { data, error } = await supabase
      .from('meseros')
      .select('id, nombre_usuario, usuario, activo, created_at')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async actualizarContrasena(token, nuevaContrasena) {
    const clienteConToken = crearClienteConToken(token)
    const { data, error } = await clienteConToken.auth.updateUser({
      password: nuevaContrasena
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async actualizarContrasenaMesero(id, nuevaContrasena) {
    const hashContrasena = await bcrypt.hash(nuevaContrasena, SALT_ROUNDS)

    const { data, error } = await supabase
      .from('meseros')
      .update({ contrasena: hashContrasena })
      .eq('id', id)
      .select('id, nombre_usuario, usuario, activo')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async eliminarAdmin(id) {
    requiereAdminClient()

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async listarUsuarios() {
    requiereAdminClient()

    const [{ data: dataAdmins, error: errorAdmins }, { data: meseros, error: errorMeseros }] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers(),
        supabase
          .from('meseros')
          .select('id, nombre_usuario, usuario, activo, created_at')
          .order('created_at', { ascending: false })
      ])

    if (errorAdmins) {
      throw new Error(errorAdmins.message)
    }

    if (errorMeseros) {
      throw new Error(errorMeseros.message)
    }

    const admins = (dataAdmins?.users ?? [])
      .filter((admin) => Boolean(admin.email))
      .map((admin) => {
        const bannedUntil = admin.banned_until ? new Date(admin.banned_until) : null
        const activo = !bannedUntil || bannedUntil.getTime() < Date.now()

        return {
          id: admin.id,
          rol: 'admin',
          nombre_usuario: admin.user_metadata?.nombre_usuario ?? 'Administrador',
          usuario: admin.email,
          activo,
          created_at: admin.created_at
        }
      })

    const listaMeseros = (meseros ?? []).map((mesero) => ({
      id: mesero.id,
      rol: 'mesero',
      nombre_usuario: mesero.nombre_usuario,
      usuario: mesero.usuario,
      activo: mesero.activo,
      created_at: mesero.created_at
    }))

    return {
      admins,
      meseros: listaMeseros
    }
  },

  async suspenderAdmin(id, suspender) {
    requiereAdminClient()

    const { data: infoAdmin, error: errorInfo } = await supabaseAdmin.auth.admin.getUserById(id)

    if (errorInfo) {
      throw new Error(errorInfo.message)
    }

    const metadataActual = infoAdmin?.user?.user_metadata ?? {}

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: suspender ? BLOQUEO_LARGO : 'none',
      user_metadata: {
        ...metadataActual,
        activo: !suspender
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async suspenderMesero(id, suspender) {
    const { data, error } = await supabase
      .from('meseros')
      .update({ activo: !suspender })
      .eq('id', id)
      .select('id, nombre_usuario, usuario, activo')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async eliminarMesero(id) {
    const { data, error } = await supabase.from('meseros').delete().eq('id', id).select('id').single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }
}

export default Usuario
