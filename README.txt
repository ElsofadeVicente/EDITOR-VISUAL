EXPLORADOR ALTO ORBIGO / LEON - PAQUETE OFFLINE (v2)
=====================================================

Como abrirlo:
- Descomprime la carpeta entera.
- Abre index.html directamente en el navegador.
- No necesita internet, ni instalar nada, ni servidor.

QUE HA CAMBIADO EN ESTA VERSION:
- BUG GORDO CORREGIDO: las casas se generaban boca abajo (bajo tierra),
  por eso no se veian. Arreglado.
- BUG DE PISTAS RURALES CORREGIDO: el export de OSM traia caminos
  agricolas de hasta 4,5 km que salian del pueblo, y el generador
  ponia casas sueltas a lo largo de ellos. Ahora solo se usan las
  calles reales que pertenecen al nucleo real del pueblo (35 calles,
  se descartaron 19 pistas/caminos que se iban al campo).
- Todas las casas tienen ahora tejado (antes solo los 4 edificios
  con nombre).
- Texturas de piedra/enfoscado en paredes y teja en tejados
  (generadas localmente, sin depender de ninguna imagen externa).
- Arboles junto al rio y repartidos por el pueblo.
- La camara ya no atraviesa los edificios (choca y se acerca).
- El personaje anda de verdad (piernas animadas).
- Guardado de ediciones: lo que anades o quitas en modo edicion se
  guarda en el propio navegador (localStorage) y sigue ahi aunque
  cierres y vuelvas a abrir. Boton "REINICIAR EDICIONES" para borrar
  esos cambios si quieres empezar de cero.
- Joystick tactil + boton de salto en movil.

QUE SIGUE PENDIENTE (necesita que tu aportes algo):
- Relieve real del terreno: esta todo plano. Para hacerlo real
  necesitaria datos de elevacion de la zona (mismo problema de antes:
  no tengo internet en vivo, pero tu si puedes descargarlos).
- Mas edificios reales: solo 1 fachada tiene contorno real en tu
  export de OSM, y 4 mas estan modeladas a partir de tus fotos.
  El resto son cajas genericas de 1-2 plantas. Cuantas mas fotos
  mandes (calle por calle), mas casas puedo ir sustituyendo por
  las reales.
- Leon: sigue sin datos reales, pendiente de que mandes su export .osm
  igual que hicimos con Llamas.

Controles:
- WASD: moverse / joystick en movil
- Espacio o boton SALTAR: saltar
- Arrastrar con el raton/dedo: orbitar camara
- Rueda: zoom
- "MODO EDICION": click en el suelo anade un bloque, click en un
  edificio lo quita. Se guarda solo.
- "REINICIAR EDICIONES": borra tus cambios guardados de esta zona.

RELIEVE (v3):
- Se ha aplicado el relieve real del terreno (81 puntos de elevacion
  NASA/SRTM 30m que nos pasaste), interpolado. El terreno, las calles,
  el rio, las casas, los arboles y el personaje siguen esa altura real.
- El rango real en la zona es de unos 18 metros (bastante llano, es la
  vega del rio, pero con desnivel real).

IGLESIA (v4):
- Ya no es una posicion aproximada. Esta trazada del plano oficial del
  Catastro (captura que mandaste, parcela 04542, incluye "Iglesia" y
  "Torre" explicitamente etiquetadas), calibrada usando la barra de
  escala del mapa (50 m) y las coordenadas reales de Plaza Mayor como
  ancla. No es descarga de vector exacto (el WFS de Catastro no nos
  dejo), pero la posicion y el tamaño ya vienen de la cartografia real,
  no estan inventados.

EDIFICIOS REALES DEL CATASTRO (v5) - EL CAMBIO GRANDE:
- Ya no hay casas genericas inventadas. Los ~680 edificios del pueblo
  vienen del Catastro oficial (Direccion General del Catastro, servicio
  INSPIRE, municipio 24094), con su contorno exacto y su altura real
  (numero de plantas real x 3m). Ya no hay ninguna "caja de relleno".
- El Ayuntamiento, la Farmacia, el Bar Zipi y Zape y el Bar Camping
  Llamas usan tambien su contorno real del Catastro (antes eran
  rectangulos aproximados centrados en su punto real).
- La Iglesia usa el contorno real de su parcela en el Catastro para el
  cuerpo principal; la torre no viene separada en los datos del
  Catastro, asi que sigue estimada del plano visual, pero anclada a la
  posicion real de la iglesia.

v6 - LEON FUERA, MEJORAS GENERALES Y BUGS:
- Se ha quitado Leon del todo (selector de ubicacion, datos placeholder,
  todo). Solo queda Llamas de la Ribera.
- Tejados: los edificios reales del Catastro con forma irregular (en L,
  con patio, muchos vertices) ya no llevan un tejado conico estirado
  que quedaba raro; ahora llevan un tejado plano. Los edificios de
  forma simple (rectangular) siguen con tejado a cuatro aguas.
- Terreno: textura de tierra/hierba generada localmente en vez de un
  verde plano.
- Arboles: los del rio ahora son chopos (alamos altos y estrechos,
  como las choperas reales del Orbigo), distintos de los arboles
  redondeados del resto del pueblo.
- Personaje: ahora tiene brazos que se mueven al andar, no solo piernas.
- Bug de rendimiento arreglado: la camara recalculaba la lista de los
  681 edificios 60 veces por segundo solo para comprobar colisiones;
  ahora se mantiene una lista ya preparada y se reutiliza.
- Bug de fisica arreglado: los edificios apoyaban su base en la altura
  del centro de la parcela, lo que en pendiente podia dejar una esquina
  flotando o hundida. Ahora se apoyan en el punto mas bajo real de la
  parcela (comprobado: la mayor pendiente dentro de una sola parcela
  del pueblo es de 2.2 m, ya no se nota).
