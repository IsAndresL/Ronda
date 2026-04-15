import bcrypt from 'bcryptjs'
import { crearClienteConToken, supabase, supabaseAdmin } from '../config/supabase.js'

const SALT_ROUNDS = 10

const Usuario = {
  async registrar(nombreUsuario, email, contrasena) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: contrasena,
      options: {
        data: {
          nombre_usuario: nombreUsuario,
          rol: 'admin'
        }
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

  async loginMesero(pin) {
    const { data: meseros, error } = await supabase
      .from('meseros')
      .select('id, nombre_usuario, pin, activo')
      .eq('activo', true)

    if (error) {
      throw new Error(error.message)
    }

    for (const mesero of meseros ?? []) {
      const coincide = await bcrypt.compare(pin, mesero.pin)

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
            nombre_usuario: mesero.nombre_usuario
          },
          token: sesionData?.session?.access_token ?? null
        }
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
      .select('id, nombre_usuario, activo, created_at')
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

  async actualizarPIN(id, nuevoPin) {
    const hashPin = await bcrypt.hash(nuevoPin, SALT_ROUNDS)

    const { data, error } = await supabase
      .from('meseros')
      .update({ pin: hashPin })
      .eq('id', id)
      .select('id, nombre_usuario, activo')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async eliminarAdmin(id) {
    if (!supabaseAdmin) {
      throw new Error(
        'No hay SUPABASE_SERVICE_ROLE_KEY configurada. No se puede eliminar usuario admin.'
      )
    }

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id)

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
