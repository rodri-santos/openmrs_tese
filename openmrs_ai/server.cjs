const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');

const cagController = require('./api/cag.cjs');
const qaCagController = require("./api/qaCag.cjs");

const app = express();
const port = 3001;

const upload = multer({
  storage: multer.memoryStorage()
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'OpenMRS AI Proxy Server is running.'
  });
});

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

// =====================================================
// QA ROUTES
// =====================================================

app.post(
  "/api/qa/upload",
  upload.single("file"),
  qaCagController.uploadPDF
);

app.post(
  "/api/qa/ask",
  qaCagController.askQuestion
);

app.post(
  "/api/qa/end-session",
  qaCagController.endSession
);

// =====================================================
// CAG ROUTES
// =====================================================

app.post(
  "/api/cag/upload-rse",
  upload.single("file"),
  cagController.uploadRSE
);

app.post(
  "/api/cag/upload-modulab",
  upload.single("file"),
  cagController.uploadModulab
);

app.post(
  "/api/cag/rewrite",
  cagController.rewriteRSE
);

app.post(
  "/api/cag/end-session",
  cagController.endSession
);

app.get(
  "/api/cag/session-info",
  cagController.getSessionInfo
);

// =====================================================
// OPENMRS PROXY
// =====================================================

app.use('/api', async (req, res) => {

  const baseUrl =
    req.query.baseUrl ||
    'http://localhost/openmrs';

  const path =
    req.query.path || '';

  const url =
    `${baseUrl}${path}`;

  const authHeader =
    req.headers.authorization;

  const shouldStream =
    req.query.stream === 'true';

  console.log('Proxy request:', {
    method: req.method,
    url,
    shouldStream,
    bodySize: req.body
      ? JSON.stringify(req.body).length
      : 0
  });

  try {

    if (shouldStream) {

      const axiosResponse =
        await axios({

          method: req.method,

          url,

          data:
            req.method !== 'GET'
              ? req.body
              : undefined,

          headers: {
            ...req.headers,
            host: new URL(baseUrl).host,
          },

          auth: authHeader
            ? {
              username: Buffer
                .from(
                  authHeader.split(' ')[1],
                  'base64'
                )
                .toString()
                .split(':')[0],

              password: Buffer
                .from(
                  authHeader.split(' ')[1],
                  'base64'
                )
                .toString()
                .split(':')[1]
            }
            : undefined,

          responseType: 'stream',

          validateStatus: () => true,
        });

      res.status(axiosResponse.status);

      Object.entries(
        axiosResponse.headers
      ).forEach(([key, value]) => {

        if (
          key.toLowerCase() !==
          'content-length'
        ) {
          res.set(key, value);
        }
      });

      axiosResponse.data.pipe(res);

    } else {

      const response =
        await axios({

          method: req.method,

          url,

          data:
            req.method !== 'GET'
              ? req.body
              : undefined,

          headers: {
            ...req.headers,
            host: new URL(baseUrl).host,
          },

          auth: authHeader
            ? {
              username: Buffer
                .from(
                  authHeader.split(' ')[1],
                  'base64'
                )
                .toString()
                .split(':')[0],

              password: Buffer
                .from(
                  authHeader.split(' ')[1],
                  'base64'
                )
                .toString()
                .split(':')[1]
            }
            : undefined,

          validateStatus: () => true,
        });

      res.status(response.status);

      res.set(response.headers);

      res.send(response.data);
    }

  } catch (error) {

    console.error(
      'Proxy error:',
      error.message
    );

    res.status(500).json({
      error: 'Proxy Error',
      message: error.message
    });
  }
});

app.listen(port, () => {

  console.log(
    `Local proxy server running at http://localhost:${port}`
  );
});