# 🎬 Guía de demostración — UPB Ceremonias

> Sigue esto de arriba a abajo. Cada acto dice qué hacer, qué decir y qué van a ver.
> Duración total: ~12–15 minutos. URL: **https://up-bpagina-web.vercel.app**

---

## ✅ Antes de empezar (2 min de preparación)

Ten abierto y listo:

- [ ] **Navegador en el computador** con la URL de producción
- [ ] **Tu Gmail** (`josedavid135642@gmail.com`) en otra pestaña — ahí llegan los códigos y correos
- [ ] **Tu celular** con la cámara (para el escáner) y conectado a internet
- [ ] (Opcional) El **Excel** de graduandos en el escritorio, por si muestras la importación

### Credenciales y datos que vas a usar

| Para qué | Dato |
|---|---|
| Login administrador | `admin@upb.edu.co` · contraseña `UpbAdmin2026!` |
| Login operador de escáner | `scanner@upb.edu.co` · contraseña `Scanner2026!` |
| Graduando para registrar en vivo | cédula **`908557512`** (Rafael Castro — cupo libre) |
| Graduando con invitados ya listos | cédula `907070220` (Carlos Morales) |
| Ceremonia de la demo | "Prueba — Ceremonia importada desde Excel" |

> ⚠️ **Importante:** todos los correos (códigos e invitaciones) llegan a TU Gmail
> `josedavid135642@gmail.com`, no al correo real de cada persona. Es a propósito:
> estamos en modo de prueba hasta que UPB verifique su dominio en el proveedor de
> correo. Si alguien pregunta, esa es la respuesta honesta.

---

## ACTO 1 — La presentación (1 min)

**Pantalla:** la página principal (`/`)

**Qué hacer:** recorre la landing de arriba a abajo mientras hablas.

**Qué decir:**
> "Esta es la plataforma institucional de UPB para las ceremonias de grado.
> Resuelve tres cosas: que el graduando registre a sus invitados desde el celular,
> que cada invitado reciba un pase con QR único, y que el día del evento se valide
> cada ingreso en segundos — sin filas ni listas en papel."

Señala de paso: la sección "Cómo funciona" (4 pasos), "Para graduandos",
"El día del evento" con el reporte en vivo, y el escudo institucional.

---

## ACTO 2 — El panel del administrador (3 min)

**Pantalla:** `/admin/iniciar-sesion` → entra con `admin@upb.edu.co` / `UpbAdmin2026!`

### 2.1 Dashboard
Apenas entras ves las métricas reales: ceremonias activas, graduandos registrados,
invitaciones con QR, ingresos validados, y la **actividad reciente** (registro de auditoría).

> "Todo esto es en tiempo real, conectado a la base de datos institucional."

### 2.2 Importar graduandos *(opcional pero impactante)*
Menú → **Importar base** → selecciona la ceremonia → arrastra el Excel.

> "Secretaría Académica entrega un Excel con cientos de graduandos. El sistema
> detecta solo las columnas que necesita, valida fila por fila, y muestra una vista
> previa antes de guardar. Los duplicados se omiten automáticamente."

### 2.3 Graduandos
Menú → **Graduandos**. Filtra por la ceremonia "Prueba".

> "Aquí está toda la base. Y desde aquí, con un clic, puedo avisarles a todos que
> ya pueden registrar a sus invitados."

Muestra el botón **"Notificar graduandos"** (no es obligatorio enviarlo en vivo).

---

## ACTO 3 — El graduando registra sus invitados (4 min)

> Cambia a una **ventana de incógnito** (Ctrl+Shift+N) para simular que eres el
> graduando en su propio celular, sin la sesión de admin.

**Pantalla:** `/registro`

1. Tipo de documento: **Cédula de ciudadanía**
2. Número: **`908557512`** (Rafael Castro)
3. Clic en **Continuar**

> "El graduando entra solo con su documento. El sistema le manda un código de un
> solo uso a su correo institucional — no necesita contraseña."

4. Ve a tu **Gmail** → abre el correo "Tu código de acceso" → copia los 6 dígitos
5. Pégalos en la pantalla → **Verificar**

✅ Entras al **portal del graduando**: su nombre, su programa, su ceremonia y su cupo.

6. Clic en **"Agregar primer invitado"** → llena:
   - Nombre: *(el que quieras, ej. "Ana Restrepo")*
   - Correo: *(cualquiera, ej. tu propio correo)*
   - Relación: *(ej. Madre)*
7. Guarda → aparece en la lista como "Borrador"
8. *(Opcional)* Agrega otro para mostrar el contador de cupo bajando
9. Clic en **"Enviar invitaciones"** → confirma

> "Apenas envía, cada invitado recibe por correo su pase con QR. Y el graduando
> recibe una confirmación con la lista completa."

10. Ve a tu Gmail → muestra que llegó el correo de invitación con el botón
    **"Ver mi pase de ingreso"**.

---

## ACTO 4 — El pase digital con QR (1 min)

**Pantalla:** abre el correo de invitación → clic en **"Ver mi pase de ingreso"**
(o usa uno de los enlaces directos de abajo).

> "Este es el pase. Tiene los datos de la ceremonia y el QR único del invitado.
> El QR no guarda datos personales: es una llave aleatoria. Funciona desde el
> celular, en captura de pantalla o impreso."

---

## ACTO 5 — El escáner el día del evento (3 min) ⭐

> Esta es la parte que más impresiona. Necesitas **dos pantallas**:
> el **computador** hace de escáner, el **celular** muestra el QR del invitado.

### Preparación
1. En el **computador**, ventana nueva → `/scanner`
2. Entra con `scanner@upb.edu.co` / `Scanner2026!`
3. Clic en **"Iniciar cámara"** → permite el acceso a la cámara

### Demostración (usa los pases de Carlos, ya listos)
En el **celular**, abre uno de estos enlaces (son pases reales de invitados de Carlos):

- **José Antonio** → válido:
  `https://up-bpagina-web.vercel.app/invitacion/5f4b19e96d6f4987b23d9b4ec3b11d81`
- **Sofía** → válido:
  `https://up-bpagina-web.vercel.app/invitacion/d9cc8f151aca451390b3fe2b0d9beab7`
- **Andrés** → válido:
  `https://up-bpagina-web.vercel.app/invitacion/41308a03ce1442a49cc6c45d33d0cec6`
- **María Eugenia** → revocada (para mostrar el rechazo):
  `https://up-bpagina-web.vercel.app/invitacion/60059140e7dc47e49a5de91441e1781b`

**Secuencia recomendada:**

1. Apunta la cámara del computador al QR de **José** en el celular
   → ✅ **"Permitido"** (suena un beep, aparece el nombre)
   > "Ingreso válido. La hora queda registrada automáticamente."

2. Vuelve a escanear **el mismo QR de José**
   → ❌ **"Ya usado"** (muestra que ya entró)
   > "Imposible entrar dos veces con el mismo pase. Lo garantiza la base de datos."

3. Escanea el QR de **María Eugenia** (la revocada)
   → ❌ **"No válido / revocado"**
   > "Si el graduando revoca a un invitado, su pase deja de funcionar al instante."

> **Plan B si la cámara falla:** en la pantalla del escáner hay un enlace
> "Ingresar código manualmente" — pega ahí el token (la parte final del enlace,
> ej. `5f4b19e96d6f4987b23d9b4ec3b11d81`) y valida igual.

---

## ACTO 6 — El control en tiempo real (1 min)

**Pantalla:** vuelve a la sesión de **admin** → `/admin/escaneos`

> "Mientras la gente entra, la coordinación ve cada ingreso en vivo: quién entró,
> a qué hora, quién lo escaneó, y los intentos rechazados. Todo queda para el
> reporte final, que se exporta a Excel."

Muestra también `/admin/auditoria` (acciones registradas) y `/admin/reportes`
(exportar CSV) si hay tiempo.

---

## 🎤 Frases para cerrar

- "Las reglas importantes están en la base de datos, no en la pantalla — son imposibles de saltar."
- "El graduando no necesita instrucciones: si sabe usar el correo, sabe usar esto."
- "Cada pase sirve una sola vez; cada acción queda registrada."
- "Para producción real solo falta que Sistemas UPB verifique el dominio de correo — 10 minutos de su lado — y los correos llegarán a los invitados reales."

---

## 🆘 Si algo se cae en vivo

| Síntoma | Qué hacer |
|---|---|
| Una pantalla no carga | Recarga con Ctrl+Shift+R |
| No llega el código al Gmail | Revisa spam; usa "Reenviar código"; o salta al Acto 5 (pases ya listos) |
| La cámara del escáner no abre | Usa "Ingresar código manualmente" con el token |
| Te quedaste sin invitados válidos | Quedan José, Sofía y Andrés — escanea uno que no hayas usado |

> Si el escáner ya marcó a José y Sofía como "usados" en un ensayo previo,
> pídele a Claude que los "reinicie a estado invitado" antes de la demo real.
