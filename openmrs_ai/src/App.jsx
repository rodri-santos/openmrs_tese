// src/App.jsx
import { Box } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

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

              {/* Rota principal com o teu layout e a Sidebar do OpenMRS */}
              <Route path="/*" element={<Layout />} />
              {/* Rota totalmente isolada para o CAG (ecrã inteiro) */}
              <Route path="/cag" element={<CAGPage />} />

            </Routes>
          </Box>
        </CAGProvider>
      </OpenMRSProvider>
    </BrowserRouter>
  )
}

export default App