const allowedOrigins = String(
  process.env.FRONTEND_URL || ''
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(
      `Origem CORS recusada: ${origin}`
    );

    return callback(
      new Error('Origem não autorizada.')
    );
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],

  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.options(
  /.+/,
  cors(corsOptions)
);

app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());