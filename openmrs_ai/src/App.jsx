import { Box } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { OpenMRSProvider } from './contexts/OpenMRSContext'
import { CAGProvider } from './contexts/CAGContext'

import Layout from './components/Layout'
import CAGPage from './components/CAGPage'

function App() {
  return (
    <BrowserRouter>
      <OpenMRSProvider>
        <CAGProvider>
          <Box minH="100vh" bg="gray.50">
            <Routes>

              {/* sistema OpenMRS normal */}
              <Route path="/*" element={<Layout />} />

              {/* CDSS (o teu sistema novo) */}
              <Route path="/cag" element={<CAGPage />} />

              {/* redirect opcional */}
              <Route path="/" element={<Navigate to="/cag" replace />} />

            </Routes>
          </Box>
        </CAGProvider>
      </OpenMRSProvider>
    </BrowserRouter>
  )
}

export default App