# Reglas de juego (v0.1)

## Atributos
Vida, recurso (Aguante / Maná / Energía / Fe), Ataque, Defensa, Poder mágico, Resistencia mágica, Velocidad, Crítico %, Evasión %.
Estadísticas finales = base de clase + crecimiento por nivel + equipo.

## Clase, arma y nivel
- **La clase define quién eres:** 1 habilidad exclusiva siempre disponible (Guerrero: Grito de guerra, +30 % de daño 3 turnos; Mago: Meditación, +18 de maná) y qué familias de armas puede usar (Guerrero: espadas, hachas y escudos; Mago: báculos y tomos).
- **El arma define cómo luchas:** da el ataque básico y sus habilidades (3-4 en total). Sin arma: Puñetazo y Golpe bajo. Cada báculo da hechizos distintos.
- **Las defensivas dependen del equipo:** Bloqueo, Embestida y Muro de hierro solo con escudo; Barrera arcana solo con tomo. «Defender» (-50 % ese turno) está siempre.
- **El nivel marca tu progresión:** todo el equipo tiene nivel mínimo (1, 3, 5 u 8). Puedes llevar y guardar objetos de nivel superior, pero no equiparlos.
- Botín por escalones: cofres comunes niv. 1-3, cofres lacrados niv. 3-5, cofre del jefe niv. 5-8. El mercader vende hasta niv. 3.
- Las criaturas ganan un 15 % de vida, ataque y defensa por cada nivel del aventurero por encima del 1, y dan proporcionalmente más XP.
- XP: esqueleto 45, murciélago 30, jefe 250, Kael 60, +50 por extraer.
- Kit de recluta automático al morir sin ningún arma: arma y armadura básicas de la clase y una poción.

## Combate
- Cada ronda, los vivos actúan de mayor a menor **velocidad** (empate: bando del jugador primero).
- **Daño** = potencia × (Ataque o Poder mágico) × 60 / (60 + Defensa o Resistencia) × variación 0,9–1,1.
  - Crítico ×1,5. Defender ×0,5. Protección ×0,6. Mínimo 1.
  - La evasión solo afecta a ataques físicos (la Puñalada traicionera la ignora).
- Al final de su turno, cada combatiente sufre veneno (7 %), quemadura (6 %) o sangrado (5 %) de su vida máxima, regenera (6 %) si tiene Regeneración y recupera 2 de recurso.
- Congelación y aturdimiento hacen perder el siguiente turno.
- Huir: 40 % ± 3 % por punto de velocidad respecto al enemigo más rápido (15–85 %). No se puede huir de jefes, duelos ni traiciones.
- Desde la ronda 25 todos pierden un 8 % de vida por ronda, acumulativo.

## Extracción
- 12 minutos por expedición. Portal: 3 s quieto canalizando.
- Extraer: conservas todo lo que llevas y el oro encontrado.
- Morir, rendirse o agotar el tiempo: pierdes el equipo y la mochila con los que entraste y todo lo encontrado. Almacén y oro del banco a salvo. La experiencia se conserva.
- Si te quedas sin arma, el intendente te presta un equipo de recluta gratis.

## Kael el Errante
- Confianza inicial 35, codicia 30. Hablar sube la confianza (+10 las 3 primeras veces). Acepta una alianza con confianza ≥ 40 (hay que hablar antes).
- Aliado: te sigue, combate a tu lado y espera su parte de los cofres con 2 o más objetos. Darle algo: confianza +15, codicia −10. No darle nada: confianza −15, codicia +20.
- **Traición** = codicia + valor de tu botín/15 (máx. 40) − confianza/2 + 25 si tienes menos del 40 % de vida + 20 si estáis cerca del portal.
  ≥ 40: te avisa una vez («Kael mira tu mochila…»). ≥ 60: te ataca (empiezas sangrando).
- **Las traiciones son a muerte, en los dos sentidos: no se puede huir.** Si le traicionas tú, empieza aturdido; si te traiciona él, empiezas sangrando.
- Kael lleva equipo real: daga de hueso, capucha de cuero, botas del correveidile (raras), una moneda antigua, una poción y 45 de oro, más lo que le hayas dado. Si cae, lo deja todo en una bolsa. Si ganas tú, te lo quedas; si pierdes, mueres y pierdes lo que llevabas.
- Atacar a un Kael neutral (combate hostil, sin traición) sí permite huir.
- El duelo consensuado no mata: quien pierde se queda con algo de vida y nadie roba nada.

## Balance (simulado en `tests/balance.test.ts`, nivel 1 con equipo inicial y vida completa)
| | Esqueleto | Murciélago | Señor del Osario (3 pociones) |
|---|---|---|---|
| Guerrero | 100 % | 100 % | ≈80 % |
| Mago | 100 % | 100 % | ≈36 % |
En la mazmorra se llega con vida parcial, así que el riesgo real es mayor. El jefe es opcional y guarda el mejor cofre.
