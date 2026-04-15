import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import usuarioRutas from './rutas/usuarioRutas.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
)
app.use(express.json())

app.get('/', (_req, res) => {
  res.status(200).json({
    mensaje: 'API de autenticación RONDA activa.'
  })
})

app.use('/api/auth', usuarioRutas)

app.use((req, res) => {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
})

app.listen(PORT, () => {
  console.log(`Servidor RONDA escuchando en http://localhost:${PORT}`)
})
