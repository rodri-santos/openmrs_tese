const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');

const cagController = require('./api/cag.cjs');

const app = express();
const port = 3001;

// =====================================================
// Middleware
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// Root route
// =====================================================

app.get('/', (req, res) => {
  res.json({
    message: 'OpenMRS AI Proxy Server is running.'
  });
});

// =====================================================
// CAG ROUTES
// IMPORTANTE:
// Estas rotas têm de ficar ANTES do proxy '/api'
// =====================================================

// PDFs apenas em RAM
const upload = multer({
  storage: multer.memoryStorage(),

  // opcional mas recomendado
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

// Upload PDF
app.post(
  '/api/cag/upload',
  upload.single('file'),
  cagController.uploadPDF
);

// Perguntas CAG
app.post(
  '/api/cag/query',
  cagController.handleCAGQuery
);

// Limpar sessão
app.post(
  '/api/cag/end-session',
  cagController.endSession
);

// Debug/info sessão
app.get(
  '/api/cag/session-info',
  cagController.getSessionInfo
);

// Warmup modelo
app.post(
  '/api/cag/warmup',
  cagController.warmupModel
);

// =====================================================
// OPENMRS PROXY
// =====================================================

app.use('/api', async (req, res) => {

  const baseUrl = req.query.baseUrl || 'http://localhost/openmrs';

  const path = req.query.path || '';

  const url = `${baseUrl}${path}`;

  const authHeader = req.headers.authorization;

  const shouldStream = req.query.stream === 'true';

  console.log('Proxy request:', {
    method: req.method,
    url,
    shouldStream,
    bodySize: req.body
      ? JSON.stringify(req.body).length
      : 0
  });

  try {

    // =====================================================
    // STREAMING MODE
    // =====================================================

    if (shouldStream) {

      console.log('Using streaming mode for:', url);

      const axiosResponse = await axios({
        method: req.method,
        url,
        data: req.method !== 'GET'
          ? req.body
          : undefined,

        headers: {
          ...req.headers,
          host: new URL(baseUrl).host,
        },

        auth: authHeader
          ? {
            username: Buffer
              .from(authHeader.split(' ')[1], 'base64')
              .toString()
              .split(':')[0],

            password: Buffer
              .from(authHeader.split(' ')[1], 'base64')
              .toString()
              .split(':')[1]
          }
          : undefined,

        responseType: 'stream',

        validateStatus: () => true,
      });

      console.log('Stream response status:', axiosResponse.status);

      res.status(axiosResponse.status);

      Object.entries(axiosResponse.headers).forEach(([key, value]) => {

        if (key.toLowerCase() !== 'content-length') {
          res.set(key, value);
        }

      });

      axiosResponse.data.pipe(res);

      axiosResponse.data.on('error', (error) => {

        console.error('Stream error:', error.message);

        if (!res.headersSent) {

          res.status(500).json({
            error: 'Stream Error',
            message: error.message
          });

        } else {
          res.end();
        }
      });

    }

    // =====================================================
    // NORMAL MODE
    // =====================================================

    else {

      console.log('Using non-streaming mode for:', url);

      const response = await axios({
        method: req.method,
        url,

        data: req.method !== 'GET'
          ? req.body
          : undefined,

        headers: {
          ...req.headers,
          host: new URL(baseUrl).host,
        },

        auth: authHeader
          ? {
            username: Buffer
              .from(authHeader.split(' ')[1], 'base64')
              .toString()
              .split(':')[0],

            password: Buffer
              .from(authHeader.split(' ')[1], 'base64')
              .toString()
              .split(':')[1]
          }
          : undefined,

        validateStatus: () => true,
      });

      console.log('Response status:', response.status);

      res.status(response.status);

      res.set(response.headers);

      res.send(response.data);
    }

  } catch (error) {

    console.error('Proxy error:', error.message);

    res.status(500).json({
      error: 'Proxy Error',
      message: error.message,
      details: error.response?.data || {}
    });
  }
});

// =====================================================
// START SERVER
// =====================================================

app.listen(port, () => {
  console.log(`Local proxy server running at http://localhost:${port}`);
});