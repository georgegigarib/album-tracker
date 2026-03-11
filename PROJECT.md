# Album Progress Tracker — Documento Tecnico

## Descripcion

Aplicacion web para gestionar el progreso de produccion de albumes musicales. Permite rastrear canciones, fases de produccion (grabacion, edicion, mezcla, masterizacion), progreso de instrumentos por fase, notas, subtareas, enlaces y archivos. Soporta colaboracion entre usuarios.

## Stack Tecnologico

| Tecnologia | Version | Proposito |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Bundler y dev server |
| Bun | latest | Package manager y runtime |
| Firebase Auth | 12.10 | Autenticacion (email/password + Google) |
| Cloud Firestore | 12.10 | Base de datos en tiempo real |
| Firebase Storage | 12.10 | Almacenamiento de archivos |
| React Bootstrap | 2.10 | Componentes UI |
| React Router | 7 | Enrutamiento SPA |
| react-icons | 5 | Iconografia (Bootstrap icons) |
| Vitest | 4 | Testing framework |
| Testing Library | 16 | Testing de componentes React |

## Estructura de Archivos

```
album-tracker/
├── .github/workflows/ci.yml     # CI: lint + test + build en PRs a main
├── public/
├── src/
│   ├── __tests__/
│   │   ├── setup.js                  # Setup global (jsdom, cleanup)
│   │   ├── formatters.test.js        # Tests de utilidades de formato
│   │   ├── validators.test.js        # Tests de validaciones
│   │   ├── AudioPlayer.test.jsx      # Tests del reproductor de audio
│   │   ├── ConfirmModal.test.jsx     # Tests del modal de confirmacion
│   │   ├── InstrumentChecklist.test.jsx # Tests del checklist de instrumentos
│   │   ├── ProgressBar.test.jsx      # Tests de barra de progreso
│   │   ├── SubtaskList.test.jsx      # Tests de lista de subtareas
│   │   └── Timeline.test.jsx         # Tests del timeline de fases
│   ├── components/
│   │   ├── AlbumCard.jsx             # Tarjeta de album en dashboard
│   │   ├── AudioPlayer.jsx           # Reproductor de audio HTML5
│   │   ├── CollaboratorManager.jsx   # Gestion de colaboradores del album
│   │   ├── ConfirmModal.jsx          # Modal generico de confirmacion
│   │   ├── FileUploader.jsx          # Upload y lista de archivos
│   │   ├── InstrumentChecklist.jsx   # Checklist de instrumentos por fase
│   │   ├── LinksList.jsx             # Lista de enlaces por fase
│   │   ├── Navbar.jsx                # Barra de navegacion superior
│   │   ├── NotesList.jsx             # Notas por fase
│   │   ├── PrivateRoute.jsx          # Wrapper de ruta autenticada
│   │   ├── SongCard.jsx              # Tarjeta de cancion en album
│   │   ├── StagePanel.jsx            # Panel principal de una fase
│   │   ├── SubtaskList.jsx           # Lista de subtareas por fase
│   │   └── Timeline.jsx              # Timeline horizontal de fases
│   ├── config/
│   │   └── firebase.js               # Inicializacion Firebase
│   ├── context/
│   │   ├── AuthContext.jsx            # Provider de autenticacion
│   │   ├── authContextValue.js        # createContext (split por react-refresh)
│   │   ├── ThemeContext.jsx           # Provider de tema claro/oscuro
│   │   └── themeContextValue.js       # createContext del tema
│   ├── hooks/
│   │   ├── useAlbums.js              # CRUD de albumes
│   │   ├── useAuth.js                # Hook de autenticacion
│   │   ├── useFiles.js               # Upload/delete de archivos
│   │   ├── useLinks.js               # CRUD de enlaces
│   │   ├── useNotes.js               # CRUD de notas
│   │   ├── useSongs.js               # CRUD de canciones + instrumentos + fases
│   │   ├── useSubtasks.js            # CRUD de subtareas
│   │   └── useTheme.js               # Hook de tema
│   ├── pages/
│   │   ├── AlbumDetail.jsx           # Detalle de album con lista de canciones
│   │   ├── AlbumSettings.jsx         # Configuracion del album
│   │   ├── Dashboard.jsx             # Pagina principal con albumes
│   │   ├── Login.jsx                 # Inicio de sesion
│   │   ├── Profile.jsx               # Perfil de usuario
│   │   ├── Register.jsx              # Registro de cuenta
│   │   └── SongDetail.jsx            # Detalle de cancion (fases, progreso, etc.)
│   ├── utils/
│   │   ├── formatters.js             # Formateadores y calculo de progreso
│   │   ├── instruments.js            # Diccionario de instrumentos
│   │   └── validators.js             # Validaciones de archivos, email, password
│   ├── App.jsx                       # Componente raiz con rutas
│   ├── App.css                       # Estilos globales
│   └── main.jsx                      # Entry point (monta en #root)
├── firestore.rules                   # Reglas de seguridad Firestore
├── storage.rules                     # Reglas de seguridad Storage
├── vite.config.js                    # Configuracion de Vite
├── eslint.config.js                  # Configuracion ESLint (flat config)
├── package.json                      # Dependencias y scripts
├── .env.example                      # Plantilla de variables de entorno
└── index.html                        # HTML entry point
```

## Modelo de Datos (Firestore)

### Coleccion: `users`
```
users/{uid}
  displayName: string
  email: string
  createdAt: Timestamp
```

### Coleccion: `albums`
```
albums/{albumId}
  title: string
  description: string
  ownerId: string (uid del creador)
  members: string[] (uids: owner + colaboradores, para queries)
  collaborators: string[] (uids de colaboradores)
  coverUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
```

### Subcoleccion: `albums/{albumId}/songs`
```
songs/{songId}
  title: string
  status: 'not_started' | 'in_progress' | 'mixing' | 'done'
  stages: {
    recording:    { completed: boolean, label: 'Grabacion' }
    editing:      { completed: boolean, label: 'Edicion' }
    mixing_stage: { completed: boolean, label: 'Mezcla' }
    mastering:    { completed: boolean, label: 'Masterizacion' }
  }
  stageProgress: {
    recording: {
      [instrumentKey]: { completed: boolean, label: string }
    }
    editing: {
      [instrumentKey]: { completed: boolean, label: string }
    }
    mixing_stage: {
      [instrumentKey]: { completed: boolean, label: string }
    }
  }
  completionPercent: number (0-100, calculado)
  estimatedEndDate: string | null
  assignedTo: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
```

> **Migracion**: canciones con el campo legacy `progress` (sin `stageProgress`) se migran automaticamente al leer. La migracion copia los instrumentos a las 3 fases con `completed: false`.

### Subcoleccion: `songs/{songId}/notes`
```
notes/{noteId}
  content: string
  stageKey: string (recording | editing | mixing_stage | mastering)
  authorId: string (uid)
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
```

### Subcoleccion: `songs/{songId}/subtasks`
```
subtasks/{subtaskId}
  title: string
  completed: boolean
  stageKey: string
  createdBy: string (uid)
  createdAt: Timestamp
```

### Subcoleccion: `songs/{songId}/links`
```
links/{linkId}
  title: string
  url: string
  stageKey: string
  createdBy: string (uid)
  createdAt: Timestamp
```

### Subcoleccion: `songs/{songId}/files`
```
files/{fileId}
  name: string
  url: string
  storagePath: string
  type: string (MIME)
  size: number (bytes)
  stageKey: string
  uploadedBy: string (uid)
  createdAt: Timestamp
```

## Sistema de Autenticacion

- **Provider**: Firebase Auth
- **Metodos**: email/password, Google (popup)
- **Contexto**: `AuthContext.jsx` envuelve toda la app
- **Hook**: `useAuthContext()` retorna `{ user, loading, register, login, loginWithGoogle, logout }`
- **Proteccion de rutas**: `PrivateRoute` redirige a `/login` si no autenticado
- **Patron split**: `authContextValue.js` exporta el `createContext` separado para cumplir con `react-refresh/only-export-components`

## Sistema de Fases (Timeline)

Cada cancion tiene 4 fases ordenadas:
1. **recording** — Grabacion
2. **editing** — Edicion
3. **mixing_stage** — Mezcla
4. **mastering** — Masterizacion

- El componente `Timeline` muestra las 4 fases horizontalmente con indicadores visuales
- Cada fase puede marcarse como completada (toggle switch en `StagePanel`)
- El `StagePanel` agrupa instrumentos, subtareas, notas y enlaces de la fase activa

### Orden de fases
Definido en `Timeline.jsx` como `STAGE_ORDER`:
```js
['recording', 'editing', 'mixing_stage', 'mastering']
```

## Sistema de Progreso por Instrumento por Fase

Los instrumentos se rastrean **independientemente por fase** (recording, editing, mixing_stage). Mastering no tiene instrumentos.

### Estructura `stageProgress`
```js
stageProgress: {
  recording:    { guitars: { completed: false, label: 'Guitarras' }, ... },
  editing:      { guitars: { completed: false, label: 'Guitarras' }, ... },
  mixing_stage: { guitars: { completed: false, label: 'Guitarras' }, ... },
}
```

### Operaciones
- **Toggle instrumento**: cambia `completed` solo en la fase activa
- **Agregar instrumento**: agrega a las 3 fases con `completed: false`
- **Eliminar instrumento**: elimina de las 3 fases

### Calculo de progreso general
`calcOverallProgress(stages, stageProgress)` cuenta:
- Los 4 items de `stages` (fases completadas)
- Todos los items de instrumentos en todas las fases de `stageProgress`
- Formula: `completados / total * 100`, redondeado

### Instrumentos disponibles
Definidos en `utils/instruments.js` — 26 instrumentos con labels en espanol:
guitars, bass, drums, vocals, keys, winds, strings, percussion, sfx, synths, samples, choir, brass, acoustic_guitar, electric_guitar, piano, organ, harmonica, flute, violin, cello, harp, turntables, programming

### Instrumentos por defecto en cancion nueva
guitars (Guitarras), bass (Bajo), drums (Bateria), vocals (Voces)

## Componentes — Props

### `StagePanel`
| Prop | Tipo | Descripcion |
|---|---|---|
| stageKey | string | Clave de la fase activa |
| stage | object | `{ completed, label }` |
| onToggleStage | function | Toggle de fase completada |
| progress | object | Instrumentos de la fase (plano) |
| onToggleInstrument | (key) => void | Toggle de instrumento |
| onAddInstrument | (key) => void | Agregar instrumento |
| onRemoveInstrument | (key) => void | Quitar instrumento |
| subtasks | array | Subtareas de la fase |
| onAddSubtask | (title) => void | Crear subtarea |
| onToggleSubtask | (id, completed) => void | Toggle subtarea |
| onDeleteSubtask | (id) => void | Eliminar subtarea |
| notes | array | Notas de la fase |
| onAddNote | (content) => void | Crear nota |
| onUpdateNote | (id, content) => void | Editar nota |
| onDeleteNote | (id) => void | Eliminar nota |
| links | array | Enlaces de la fase |
| onAddLink | (title, url) => void | Crear enlace |
| onDeleteLink | (id) => void | Eliminar enlace |

### `InstrumentChecklist`
| Prop | Tipo | Descripcion |
|---|---|---|
| progress | object | `{ [key]: { completed, label } }` |
| onToggle | (key) => void | Toggle completado |
| onAdd | (key) => void | Agregar instrumento |
| onRemove | (key) => void | Quitar instrumento |

### `Timeline`
| Prop | Tipo | Descripcion |
|---|---|---|
| stages | object | Todas las fases con estado |
| activeStage | string | Fase seleccionada |
| onSelectStage | (key) => void | Cambiar fase activa |

### `ConfirmModal`
| Prop | Tipo | Descripcion |
|---|---|---|
| show | boolean | Visible o no |
| title | string | Titulo del modal |
| message | string | Mensaje de confirmacion |
| confirmLabel | string | Texto del boton confirmar |
| confirmVariant | string | Variante Bootstrap (default: 'danger') |
| onConfirm | function | Callback al confirmar |
| onCancel | function | Callback al cancelar |

### `AlbumCard`
| Prop | Tipo | Descripcion |
|---|---|---|
| album | object | Datos del album |
| songsProgress | number | Progreso agregado |
| songCount | number | Numero de canciones |

### `SongCard`
| Prop | Tipo | Descripcion |
|---|---|---|
| song | object | Datos de la cancion |
| albumId | string | ID del album padre |

## Hooks — Detalle

### `useSongs(albumId)`
| Funcion | Parametros | Descripcion |
|---|---|---|
| createSong | (title, estimatedEndDate?) | Crea cancion con stageProgress y stages por defecto |
| updateSong | (songId, data) | Actualiza campos; recalcula completionPercent si cambia stageProgress/stages |
| toggleInstrument | (songId, stageKey, instrumentKey, currentStageProgress) | Toggle completado de instrumento en una fase |
| addInstrument | (songId, instrumentKey, currentStageProgress) | Agrega instrumento a las 3 fases |
| removeInstrument | (songId, instrumentKey, currentStageProgress) | Elimina instrumento de las 3 fases |
| toggleStage | (songId, stageKey, currentStages) | Toggle de fase completada |
| deleteSong | (songId) | Elimina cancion con todas sus subcolecciones |

### `useAlbums()`
| Funcion | Parametros | Descripcion |
|---|---|---|
| createAlbum | (title, description?) | Crea album con owner como miembro |
| updateAlbum | (albumId, data) | Actualiza campos del album |
| deleteAlbum | (albumId) | Elimina album y todas sus canciones |
| addCollaborator | (albumId, email) | Busca usuario y lo agrega como colaborador |
| removeCollaborator | (albumId, uid) | Quita colaborador |

### `useNotes(albumId, songId)`
| Funcion | Parametros | Descripcion |
|---|---|---|
| getNotesByStage | (stageKey) | Filtra notas por fase |
| addNote | (content, stageKey?) | Crea nota (con null check de user) |
| updateNote | (noteId, content) | Edita contenido de nota |
| deleteNote | (noteId) | Elimina nota |

### `useSubtasks(albumId, songId)`
| Funcion | Parametros | Descripcion |
|---|---|---|
| getSubtasksByStage | (stageKey) | Filtra subtareas por fase |
| addSubtask | (title, stageKey) | Crea subtarea (con null check de user) |
| toggleSubtask | (subtaskId, currentCompleted) | Toggle completado |
| deleteSubtask | (subtaskId) | Elimina subtarea |

### `useLinks(albumId, songId)`
| Funcion | Parametros | Descripcion |
|---|---|---|
| getLinksByStage | (stageKey) | Filtra enlaces por fase |
| addLink | (title, url, stageKey?) | Crea enlace (con null check de user) |
| updateLink | (linkId, data) | Edita enlace |
| deleteLink | (linkId) | Elimina enlace |

### `useFiles(albumId, songId)`
| Funcion | Parametros | Descripcion |
|---|---|---|
| getFilesByStage | (stageKey) | Filtra archivos por fase |
| uploadFile | (file, stageKey) | Sube a Storage, crea doc en Firestore |
| deleteFile | (fileId, storagePath) | Elimina de Storage y Firestore |

## Utils

### `formatters.js`
- `formatDate(timestamp)` — Convierte Timestamp/Date a string localizado (es-ES)
- `formatFileSize(bytes)` — Formatea bytes a B/KB/MB/GB
- `calcCompletionPercent(progress)` — Porcentaje de items completados (uso legacy)
- `getStatusLabel(status)` — Label en espanol para estados de cancion
- `getStatusVariant(status)` — Variante Bootstrap para badge de estado
- `getStageLabel(stageKey)` — Label en espanol para fases
- `calcOverallProgress(stages, stageProgress)` — Progreso total combinando fases + instrumentos de todas las fases

### `validators.js`
- `validateFile(file)` — Valida tipo MIME y tamano de archivos audio/imagen
- `validateEmail(email)` — Validacion regex
- `validatePassword(password)` — Minimo 6 caracteres
- `checkStorageLimit(existingSize, newSize)` — Limite de 50MB por cancion
- Constantes: `ALLOWED_AUDIO_TYPES`, `ALLOWED_IMAGE_TYPES`, `MAX_AUDIO_SIZE` (10MB), `MAX_IMAGE_SIZE` (5MB), `MAX_SONG_STORAGE` (50MB)

### `instruments.js`
- `ALL_INSTRUMENTS` — Objeto con 26 instrumentos `{ key: labelEnEspanol }`

## Reglas de Seguridad Firestore

```
users/{uid}        → read: autenticado | write: solo el propio usuario
albums/{albumId}   → read: miembro | create: sera owner | update: miembro | delete: solo owner
  songs/           → read/write: miembro del album padre
    notes/         → read/write: miembro del album padre
    files/         → read/write: miembro del album padre
    subtasks/      → read/write: miembro del album padre
    links/         → read/write: miembro del album padre
```

La membresía se verifica con `request.auth.uid in resource.data.members` (albums) o via `get()` del album padre (subcolecciones).

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`):
- Trigger: Pull requests a `main`
- Runner: `ubuntu-latest`
- Steps: checkout → setup-bun → `bun install --frozen-lockfile` → `bun run lint` → `bun test` → `bun run build`

## Scripts de Desarrollo

```bash
bun run dev       # Servidor de desarrollo (Vite)
bun run build     # Build de produccion
bun run lint      # ESLint
bun run test      # Vitest (run once)
bun run test:watch # Vitest (watch mode)
bun run preview   # Preview del build
```

## Convenciones de Codigo

- **Componentes**: default export, PascalCase, archivos `.jsx`
- **Hooks**: named export, camelCase con prefijo `use`, archivos `.js`
- **Utils**: named exports, archivos `.js`
- **Context**: split en 2 archivos (Provider + contextValue) para cumplir `react-refresh/only-export-components`
- **Firestore**: todos los hooks usan `onSnapshot` para datos en tiempo real
- **Timestamps**: `serverTimestamp()` para creacion/actualizacion
- **Null checks**: todos los hooks que acceden a `user.uid` deben tener guard `if (!user) return`
- **ESLint**: flat config (v9), plugins: react-hooks, react-refresh

## Rutas

| Ruta | Pagina | Privada |
|---|---|---|
| `/login` | Login | No |
| `/register` | Register | No |
| `/dashboard` | Dashboard | Si |
| `/albums/:albumId` | AlbumDetail | Si |
| `/albums/:albumId/songs/:songId` | SongDetail | Si |
| `/albums/:albumId/settings` | AlbumSettings | Si |
| `/profile` | Profile | Si |
| `*` | Redirect a /dashboard | — |

## Flujo de Usuario

1. Registro/login (email o Google)
2. Dashboard: ver albumes, crear nuevo album
3. Album: ver canciones, crear cancion, gestionar colaboradores
4. Cancion: navegar fases en timeline → por cada fase:
   - Marcar instrumentos como completados (independiente por fase)
   - Agregar/quitar instrumentos
   - Marcar fase como completada (switch)
   - Crear subtareas, notas, enlaces
   - Subir archivos de audio/imagen
5. Progreso general se calcula automaticamente

## Variables de Entorno

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

> **Nota**: Mantener este documento actualizado con cada cambio significativo al modelo de datos, estructura de componentes o logica de negocio.
