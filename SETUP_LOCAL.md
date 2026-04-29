# Local Development Setup - surveycore-web

Guía para configurar el ambiente de desarrollo local (rama `dev`).

---

## 🔧 Requisitos Previos

- **Node.js 20+** (descargar desde [nodejs.org](https://nodejs.org))
- **npm 10+** (incluido con Node.js)
- **Backend corriendo** en `http://localhost:8000`

---

## 📋 Paso a Paso

### 1. Clonar el repositorio
```bash
git clone https://github.com/everprieto/surveycore-web.git
cd surveycore-web
git checkout dev
```

### 2. Crear archivo `.env` local
```bash
cp .env.example .env
```

Luego edita `.env` con tus valores:
```bash
# .env
VITE_API_BASE_URL=http://localhost:8000
VITE_AZURE_CLIENT_ID=4012c112-0db8-4411-85e5-907edceb644e
VITE_AZURE_TENANT_ID=0a964db6-c0c3-43a8-af0d-bccc2d2bd487
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Levantar servidor de desarrollo
```bash
npm run dev
```

**Resultado:** Frontend disponible en `http://localhost:5173`

---

## 🚀 Workflow de Desarrollo

```
1. Crear rama local desde dev
   git checkout dev
   git pull origin dev
   git checkout -b feature/mi-feature

2. Hacer cambios y commitear
   git add .
   git commit -m "feat: descripción del cambio"

3. Hacer push a rama feature
   git push origin feature/mi-feature

4. En GitHub: crear PR hacia rama dev

5. Después de merge a dev:
   git checkout dev
   git pull origin dev
```

---

## 📝 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levantar servidor con hot reload |
| `npm run build` | Compilar para producción (genera `dist/`) |
| `npm run lint` | Validar código con ESLint |
| `npm run preview` | Preview del build de producción local |

---

## 🐛 Troubleshooting

### Error: "Cannot find module @emotion/react"
```bash
npm install
npm run dev
```

### Error: "VITE_API_BASE_URL is undefined"
- Verificar que `.env` existe y contiene `VITE_API_BASE_URL`
- Prefijo `VITE_` es obligatorio para que Vite lo incluya en el bundle

### Backend no responde
- Verificar que el backend está corriendo en `http://localhost:8000`
- Verificar `CORS_ORIGINS` en backend `.env` incluye `http://localhost:5173`

### Hot reload no funciona
- Verificar que estás en rama `dev`
- Reiniciar `npm run dev`
- Limpiar cache: `rm -rf node_modules/.vite`

---

## 🌳 Ramas del Proyecto

| Rama | Propósito | Deploy |
|------|-----------|--------|
| **dev** | Desarrollo local | ❌ No (validación en PR) |
| **qa** | Testing en Azure QA | ✅ Automático al push |
| **main** (production) | Producción en Azure | ✅ Automático al push |

**Regla:** Siempre hacer PR a `dev`, nunca directamente a `qa` o `main`.

---

## ✅ Checklist de Setup

- [ ] Node.js 20+ instalado (`node --version`)
- [ ] Repositorio clonado en rama `dev`
- [ ] `.env` creado a partir de `.env.example`
- [ ] `npm install` ejecutado sin errores
- [ ] Backend corriendo en `http://localhost:8000`
- [ ] `npm run dev` inicia sin errores
- [ ] Frontend accesible en `http://localhost:5173`
