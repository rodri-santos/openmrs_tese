import { Box } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { OpenMRSProvider } from './contexts/OpenMRSContext'
import { CAGProvider } from './contexts/CAGContext'

import Layout from './components/Layout'
import CAGPage from './components/CAGPage'
import CentralPage from "./components/CentralPage";

function App() {
  return (
    <BrowserRouter>
      <OpenMRSProvider>
        <CAGProvider>
          <Box minH="100vh" bg="gray.50">

            <Routes>

              {/* sistema OpenMRS normal */}
              <Route path="/*" element={<Layout />} />

              {/* CDSS (CAG antigo) */}
              <Route path="/cag" element={<CAGPage />} />

              {/* 🧠 novo sistema central de registos */}
              <Route path="/central" element={<CentralPage />} />

              {/* redirect inicial */}
              <Route path="/" element={<Navigate to="/central" replace />} />

            </Routes>

          </Box>
        </CAGProvider>
      </OpenMRSProvider>
    </BrowserRouter>
  )
}

export default App