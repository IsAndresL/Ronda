import { Router } from 'express'
import ControladorUsuario from '../controlador/ControladorUsuario.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = Router()

router.post('/login', ControladorUsuario.login)
router.post('/registro', authMiddleware, ControladorUsuario.registrar)
router.get('/perfil', authMiddleware, ControladorUsuario.perfil)
router.get('/usuarios', authMiddleware, ControladorUsuario.listarUsuarios)
router.put('/actualizar', authMiddleware, ControladorUsuario.actualizar)
router.put('/suspender/:id', authMiddleware, ControladorUsuario.suspender)
router.delete('/:id', authMiddleware, ControladorUsuario.eliminar)

export default router
