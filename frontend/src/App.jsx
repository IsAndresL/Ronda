import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { obtenerToken } from './servicios/authServicio'
import ActualizarCredenciales from './vista/ActualizarCredenciales'
import Bienvenida from './vista/Bienvenida'
import Login from './vista/Login'

const RutaProtegida = ({ children }) => {
  const token = obtenerToken()
  return token ? children : <Navigate to="/login" replace />
}

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/bienvenida"
          element={
            <RutaProtegida>
              <Bienvenida />
            </RutaProtegida>
          }
        />

        <Route
          path="/actualizar"
          element={
            <RutaProtegida>
              <ActualizarCredenciales />
            </RutaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
