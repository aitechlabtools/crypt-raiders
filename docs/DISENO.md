# Reglas de juego (v0.1)

## Atributos
Vida, recurso (Aguante / Maná / Energía / Fe), Ataque, Defensa, Poder mágico, Resistencia mágica, Velocidad, Crítico %, Evasión %.
Estadísticas finales = base de clase + crecimiento por nivel + equipo.

## Combate
- Cada ronda, los vivos actúan de mayor a menor **velocidad** (empate: bando del jugador primero).
- **Daño** = potencia × (Ataque o Poder mágico) × 60 / (60 + Defensa o Resistencia) × variación 0,9–1,1.
  - Crítico ×1,5. Defender ×0,5. Protección ×0,6. Mínimo 1.
  - La evasión solo afecta a ataques físicos (la Puñalada traicionera la ignora).
- Al final de su turno, cada combatiente sufre veneno (7 %), quemadura (6 %) o sangrado (5 %) de su vida máxima, regenera (6 %) si tiene Regeneración y recupera 2 de recurso.
- Congelación y aturdimiento hacen perder el siguiente turno.
- Huir: 40 % ± 3 % por punto de velocidad respecto al enemigo más rápido (15–85 %). No se puede huir de jefes ni de duelos.
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
- Si le traicionas tú, empieza aturdido. Si cae, deja una bolsa con sus objetos.
- El duelo consensuado no mata: quien pierde se queda con algo de vida y nadie roba nada.

## Balance (simulado en `tests/balance.test.ts`, nivel 1 con equipo inicial y vida completa)
| | Esqueleto | Murciélago | Señor del Osario (3 pociones) |
|---|---|---|---|
| Guerrero | 100 % | 100 % | ≈80 % |
| Mago | 100 % | 100 % | ≈36 % |
En la mazmorra se llega con vida parcial, así que el riesgo real es mayor. El jefe es opcional y guarda el mejor cofre.
