# 🔥 Burner Design Pro

A professional burner design and thermal calculation tool for industrial applications.

## 🌟 Features

### 1. Gas Combustion Calculator
Configure custom gas compositions and calculate combustion parameters including:
- Gas density and relative density
- Lower heating value (LHV)
- Minimum air requirements
- Burner capacity calculations
- Flue gas composition analysis

### 2. Unit Converter
Convert between 12 different unit categories:
- Pressure (Pa, kPa, MPa, bar, atm, psi, etc.)
- Temperature (Celsius, Fahrenheit, Kelvin)
- Flow Rate (m³/s, L/s, cfm, gpm, etc.)
- Energy (J, kJ, MJ, kWh, BTU, kcal)
- Power (W, kW, MW, BTU/h, kcal/h)
- Heat Content (kJ/Nm³, BTU/scf, kcal/kg, etc.)
- Length, Mass, Volume, Density, Velocity
- Burner Capacity

### 3. Emissions Estimation
Calculate and convert emission concentrations:
- Support for NOx, CO, CO2, SOx
- Convert between ppm, mg/m³, lb/MMBtu
- O2 reference corrections
- EPA and EU compliance checking
- Annual emissions estimation

### 4. Additional Modules
- Thermodynamic calculations
- Efficiency analysis
- Fuel database

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/burnerpro.git
cd burnerpro

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### Development

```bash
# Start frontend (from frontend directory)
npm run dev
# Frontend: http://localhost:3000

# Start backend (from backend directory)
uvicorn app.main:app --reload
# API: http://localhost:8000
```

### Production Build

```bash
cd frontend
npm run build
```

## 📁 Project Structure

```
burnerpro/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── CustomGasCalculator.tsx
│   │   │   ├── UnitConverterPage.tsx
│   │   │   ├── EmissionPage.tsx
│   │   │   └── ...
│   │   ├── services/    # API services
│   │   └── App.tsx       # Main app component
│   └── vercel.json      # Vercel config
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── security/    # Security middleware
│   │   └── main.py      # Application entry
│   ├── requirements.txt
│   └── railway.toml     # Railway config
├── docs/                # Documentation
├── SECURITY.md          # Security guide
├── DEPLOYMENT.md       # Deployment guide
└── QUICKSTART.md      # Quick deployment guide
```

## 🔧 Technology Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Recharts** - Charts

### Backend
- **FastAPI** - Web framework
- **Python** - Programming language
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

## 🌐 Deployment

### Option 1: Vercel + Railway (Recommended)

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

```bash
# Deploy frontend to Vercel
cd frontend
vercel --prod

# Deploy backend to Railway
# 1. Connect GitHub repo to Railway
# 2. Select backend folder
# 3. Configure environment variables
```

### Option 2: Docker

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Docker deployment.

```bash
# Build and run
docker-compose up -d
```

### Option 3: VPS

See [DEPLOYMENT.md](./DEPLOYMENT.md) for VPS deployment.

## 🔒 Security

The application includes comprehensive security features:

- **Input Validation** - All inputs validated and sanitized
- **Rate Limiting** - 100 requests per minute per IP
- **SQL Injection Prevention** - String sanitization
- **CORS Configuration** - Configurable allowed origins
- **Security Headers** - X-Frame-Options, HSTS, CSP, etc.
- **Error Handling** - Generic error messages, no stack traces

See [SECURITY.md](./SECURITY.md) for details.

## 📊 API Documentation

When running the backend locally, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Endpoints

**Health Check**
```
GET /api/health
```

**Fuels**
```
GET /api/fuels
GET /api/fuels/{fuel_id}
```

**Combustion Calculation**
```
POST /api/calculate/combustion
POST /api/calculate/custom-gas
```

**Unit Conversion**
```
GET /api/units/categories
POST /api/units/convert
POST /api/units/convert-all
```

**Emissions**
```
POST /api/emissions/convert
POST /api/emissions/compliance
POST /api/emissions/annual
GET /api/emissions/limits
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
pytest
```

## 📝 Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000  # Backend URL
```

### Backend (.env)
```bash
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT=100
RATE_WINDOW=60
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for industrial applications
- Focused on accuracy and usability

## 📞 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@burnerpro.com

## 🔗 Links

- **Live Demo**: https://your-app.vercel.app
- **API Docs**: https://your-backend.railway.app/docs
- **GitHub**: https://github.com/YOUR_USERNAME/burnerpro

---

**Made with ❤️ for industrial burner design**
