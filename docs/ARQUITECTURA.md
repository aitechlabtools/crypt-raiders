# Arquitectura de Crypt Raiders

## Decisiones técnicas

| Pieza | Elección | Motivo |
|---|---|---|
| Web y menús | React 19 + TypeScript + Vite + Tailwind 4 | Interfaces complejas (inventario, combate) más fáciles de mantener que dentro del motor |
| Motor | Phaser 3.90 (versión 3 estable) | Soporte web maduro, `pixelArt`, cámaras, partículas. Phaser 4 es reciente; se puede migrar más adelante |
| Lógica | TypeScript puro en `src/core` | Determinista, probado con Vitest y reutilizable tal cual en un servidor Node |
| Guardado | IndexedDB con respaldo en localStorage | Suficiente para la demo; sin servidor |
| Arte y audio | Generados por código | Originales, sin dependencias externas, fáciles de sustituir |

## Capas

```
Datos (core/data)  →  Lógica (core/*.ts)  →  Estado y acciones (game/state)  →  Interfaz (game/ui) y Motor (game/engine)
                                                       ↓
                                              Persistencia (game/persistence)
```

- **El núcleo nunca importa Phaser ni React.** Recibe estado y devuelve estado nuevo.
- **El combate es determinista**: usa un generador con semilla (`core/rng.ts`). Mismo estado + misma acción = mismo resultado. Esto permite pruebas reproducibles y, en multijugador, que el servidor sea la única autoridad.
- **Phaser solo dibuja y mueve.** Cuando ocurre algo de juego (tocar un enemigo, abrir un cofre, llegar al portal) llama a una acción del estado. El estado avisa a la escena mediante un bus de eventos mínimo (`game/state/bus.ts`).
- **La expedición es una copia.** Al entrar se copia la mochila y el equipo; el perfil guardado no cambia hasta extraer o morir. Por eso una recarga a mitad de partida no puede duplicar ni perder objetos.

## Multijugador real (fase 7): propuesta y compromisos

> Pendiente de implementar. Esta sección existe para acordar el diseño antes de escribir el servidor.

### Arquitectura

- **Servidor autoritativo** en Node con **Colyseus** (salas, sincronización de estado y reconexión ya resueltas). El cliente solo envía intenciones («moverme hacia aquí», «abrir cofre 3», «usar Bola de fuego sobre X»).
- `src/core` se ejecuta en el servidor tal cual. El cliente puede predecir el movimiento, pero el resultado de combates, botín e inventario lo decide el servidor.
- Base de datos persistente (PostgreSQL) para perfiles, almacén y oro. El estado de una expedición vive en memoria de la sala hasta que termina.

### Exploración en tiempo real + combate por turnos

- La exploración es en tiempo real. Cuando dos entidades entran en contacto hostil, el servidor crea un **encuentro instanciado**: los participantes quedan «en combate» en su posición, visibles para los demás con un indicador.
- **Intervención**: un tercero puede unirse a un encuentro en curso solo si llega a menos de N casillas y elige bando. Entra al final de la ronda actual, nunca a mitad.
- **Turnos con límite de tiempo** (p. ej. 20 s). Si no actúas, se aplica «Defender». Evita bloquear a los demás.
- **Inmunidad de transición**: 2 s tras salir de un combate o de una carga sin que puedan iniciar otro contra ti. Evita ataques injustos encadenados.
- **Fin garantizado**: la «Cripta reclama su tributo» a partir de la ronda 25 (ya implementado) y huida siempre disponible salvo contra jefes.

### Riesgos y cómo se mitigan

| Riesgo | Mitigación |
|---|---|
| Duplicación de objetos | Cada objeto tiene `uid`. Toda transferencia es una operación atómica en el servidor; nunca se confía en el inventario que envía el cliente. La extracción se confirma en una transacción de base de datos |
| Desincronización | El servidor manda el estado; el cliente solo interpola posiciones. Los combates se reproducen a partir de eventos firmados por el servidor |
| Trampas (velocidad, teletransporte) | Validación de movimiento por velocidad máxima y colisiones en el servidor |
| Desconexiones | Colyseus permite reconectar a la misma sala durante X segundos; mientras tanto el personaje defiende en combate y se queda quieto fuera |
| Abuso de alianzas | La alianza es un estado explícito en el servidor. Atacar a un aliado exige la acción «Romper alianza» con confirmación, de modo que un clic accidental no es una traición |
| Combates interminables | Ronda de castigo creciente + límite de tiempo por turno |

### Reputación (fase posterior)

Historial de alianzas cumplidas y rotas, visible al proponer una alianza. **Sin castigos automáticos** al principio: primero medir cuánto se traiciona y cómo lo viven los jugadores, y después decidir.

## Versión de escritorio (fase 8)

Recomendación: **Tauri 2**. Reutiliza `dist/` sin cambios, genera instaladores pequeños (≈10 MB frente a ≈100 MB de Electron) y usa WebView2, que ya viene con Windows 10/11. Electron solo compensaría si se necesitaran APIs de Node en el cliente, que este proyecto no usa.
La web activará el botón de descarga cambiando `DOWNLOAD_URL` en `src/landing/App.tsx` **solo** cuando exista un instalador probado.
