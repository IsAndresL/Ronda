import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
})

const TOKEN_KEY = 'ronda_token'
const ROL_KEY = 'ronda_rol'
const USUARIO_KEY = 'ronda_usuario'

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
})

export const loginAdmin = async (email, contrasena) => {
  const { data } = await api.post('/auth/login', {
    correo_electronico: email,
    contrasena
  })

  return data
}

export const loginMesero = async (usuario, contrasena) => {
  const { data } = await api.post('/auth/login', { usuario, contrasena })
  return data
}

export const registrarUsuario = async (datos, token) => {
  const { data } = await api.post('/auth/registro', datos, authHeaders(token))
  return data
}

export const obtenerPerfil = async (token) => {
  const { data } = await api.get('/auth/perfil', authHeaders(token))
  return data
}

export const actualizarCredenciales = async (datos, token) => {
  const { data } = await api.put('/auth/actualizar', datos, authHeaders(token))
  return data
}

export const listarUsuarios = async (token) => {
  const { data } = await api.get('/auth/usuarios', authHeaders(token))
  return data
}

export const suspenderUsuario = async (id, token, rolObjetivo, suspender) => {
  const { data } = await api.put(
    `/auth/suspender/${id}`,
    { rolObjetivo, suspender },
    authHeaders(token)
  )

  return data
}

export const eliminarUsuario = async (id, token, rolObjetivo) => {
  const { data } = await api.delete(`/auth/${id}`, {
    ...authHeaders(token),
    data: { rolObjetivo }
  })

  return data
}

export const guardarToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const obtenerToken = () => localStorage.getItem(TOKEN_KEY)

export const guardarSesion = ({ token, rol, usuario }) => {
  guardarToken(token)
  localStorage.setItem(ROL_KEY, rol)
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario ?? {}))
}

export const obtenerRol = () => localStorage.getItem(ROL_KEY)

export const obtenerUsuarioGuardado = () => {
  const valor = localStorage.getItem(USUARIO_KEY)
  if (!valor) return null

  try {
    return JSON.parse(valor)
  } catch (_error) {
    return null
  }
}

export const cerrarSesion = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROL_KEY)
  localStorage.removeItem(USUARIO_KEY)
}
