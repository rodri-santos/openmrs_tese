import { Box } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

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

              {/* OpenMRS */}
              <Route path="/*" element={<Layout />} />

              {/* CDSS */}
              <Route path="/cdss" element={<CAGPage />} />

              {/* Sistema central */}
              <Route path="/central" element={<CentralPage />} />

            </Routes>

          </Box>
        </CAGProvider>
      </OpenMRSProvider>
    </BrowserRouter>
  )
}

export default App