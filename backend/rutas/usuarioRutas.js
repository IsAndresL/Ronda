import { Router } from 'express'
import ControladorUsuario from '../controlador/ControladorUsuario.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = Router()

router.post('/registro', ControladorUsuario.registrar)
router.post('/login', ControladorUsuario.login)
router.get('/perfil', authMiddleware, ControladorUsuario.perfil)
router.put('/actualizar', authMiddleware, ControladorUsuario.actualizar)
router.delete('/:id', authMiddleware, ControladorUsuario.eliminar)

export default router
