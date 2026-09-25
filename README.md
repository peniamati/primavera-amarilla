# Primavera amarilla 🌼

Web móvil interactiva de primavera, sin instalación ni compilación. Una puerta de entrada ofrece **dos juegos** con la misma sorpresa final:

- **Carrera de flores:** chica rubia en tres carriles. Deslizá a izquierda o derecha para cambiar de carril, arriba para saltar vallas y abajo para agacharte bajo muros con un paso libre. Cada flor dorada suma 5: juntá 100, 200 y 300 flores acumuladas para alcanzar los vales del abrazo, el beso y la cena. El vale aparece apenas completás la meta. Cada tramo dura hasta 75 segundos.
- **Lluvia de flores:** movela a izquierda o derecha entre tres carriles para recoger las flores que caen y hacer crecer un ramo. Esquivá las macetas. Sus metas son 22, 30 y 38 flores; los tiempos máximos son 70, 80 y 90 segundos.

Los dos juegos tienen tres vidas por tramo. Se puede reintentar el tramo actual sin perder los vales anteriores. Hay controles táctiles visibles y flechas de teclado como alternativa.

| Tramo | Carrera | Lluvia | Vale simbólico |
| --- | ---: | ---: | --- |
| 1 | 100 flores | 22 flores | Un abrazo |
| 2 | 200 flores | 30 flores | Un beso |
| 3 | 300 flores | 38 flores | Una salida a comer |

Las flores y el ramo de aspecto natural son recursos WebP transparentes. Los premios son mensajes divertidos para compartir, no cupones comerciales.

## Música

Al abrir la puerta se intenta reproducir «Flores Amarillas» de Floricienta desde YouTube. Un botón flotante de volumen apaga o vuelve a cargar la canción. Al reactivarla empieza desde el principio. El video no se muestra. La reproducción automática depende de las restricciones del navegador y de YouTube, especialmente en móviles.

## Uso y publicación

Abrí `index.html` en un navegador. GitHub Pages publica la rama `main` desde `/(root)` en `https://peniamati.github.io/primavera-amarilla/`.

Hecho en HTML, CSS y JavaScript. Las tipografías de Google Fonts tienen alternativas locales.

## Reclamo de premios y aviso por correo

Al superar los tres tramos de cualquiera de los juegos aparece el botón de reclamo. Se escapa cinco veces, luego caen flores amarillas como confeti y se acumulan desde abajo hasta llenar la pantalla. Ella puede reclamar los tres premios simbólicos sin completar ningún dato. El aviso identifica el reclamo como «Amor».

La web pública **no guarda credenciales**. El archivo `apps-script.gs` es la función de Google Apps Script que envía el aviso al Gmail del dueño mediante `MailApp` (permiso de envío). Tiene destinatario fijo, un envío por minuto y un máximo de 30 por día. El proyecto publicado ya tiene la URL de implementación en `config.js`. Para instalar otra instancia:

1. Crear un proyecto de Apps Script con `apps-script.gs`.
2. En **Configuración del proyecto → Propiedades de script**, guardar `CLAIM_RECIPIENT` con el correo destinatario.
3. Implementar como **Aplicación web**, ejecutar como propietario y permitir acceso **Cualquier persona**. Autorizar el permiso de envío de correo en Google.
4. Pegar la URL pública `/exec` devuelta por Google en `config.js` como `SPRING_CLAIM_ENDPOINT` y publicar de nuevo.

Si falta esa configuración, el botón final explica que el correo sigue pendiente de conexión; nunca finge haber enviado el aviso. La función pública puede recibir solicitudes de cualquier visitante, por eso fija el destinatario y limita los envíos. No uses contraseñas, claves ni tokens en `config.js`.
