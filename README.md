# Primavera amarilla 🌼

Web móvil interactiva de primavera, sin instalación ni compilación. Una puerta de entrada abre una carrera de tres carriles con una chica rubia. Deslizá a izquierda o derecha (también hay botones y teclado) para juntar flores amarillas de 10 en 10 y esquivar macetas. La carrera tiene tres tramos con vales acumulativos:

| Tramo | Objetivo acumulado | Tiempo máximo | Vale simbólico |
| --- | ---: | ---: | --- |
| 1 | 100 flores | 35 s | Un abrazo |
| 2 | 200 flores | 35 s | Un beso |
| 3 | 300 flores | 35 s | Una salida a comer |

Cada tramo comienza con tres vidas; chocar con una maceta quita una. Al alcanzar el objetivo aparece el vale en el camino. Si falla, reintenta ese tramo desde el último vale. Los premios son mensajes divertidos para compartir, no cupones comerciales.

## Música

Al abrir la puerta se intenta reproducir «Flores Amarillas» de Floricienta desde YouTube. Un botón flotante de volumen apaga o vuelve a cargar la canción. Al reactivarla empieza desde el principio. El video no se muestra. La reproducción automática depende de las restricciones del navegador y de YouTube, especialmente en móviles.

## Uso y publicación

Abrí `index.html` en un navegador. GitHub Pages publica la rama `main` desde `/(root)` en `https://peniamati.github.io/primavera-amarilla/`.

Hecho en HTML, CSS y JavaScript. Las tipografías de Google Fonts tienen alternativas locales.

## Reclamo de premios y aviso por correo

Al superar los tres niveles aparece el botón de reclamo. Se escapa cinco veces, luego caen flores amarillas como confeti y se acumulan desde abajo hasta llenar la pantalla. Ella puede reclamar los tres premios simbólicos sin completar ningún dato. El aviso identifica el reclamo como «Amor».

La web pública **no guarda credenciales**. El archivo `apps-script.gs` es la función de Google Apps Script que envía el aviso al Gmail del dueño mediante `MailApp` (permiso de envío). Tiene destinatario fijo, un envío por minuto y un máximo de 30 por día. El proyecto publicado ya tiene la URL de implementación en `config.js`. Para instalar otra instancia:

1. Crear un proyecto de Apps Script con `apps-script.gs`.
2. En **Configuración del proyecto → Propiedades de script**, guardar `CLAIM_RECIPIENT` con el correo destinatario.
3. Implementar como **Aplicación web**, ejecutar como propietario y permitir acceso **Cualquier persona**. Autorizar el permiso de envío de correo en Google.
4. Pegar la URL pública `/exec` devuelta por Google en `config.js` como `SPRING_CLAIM_ENDPOINT` y publicar de nuevo.

Si falta esa configuración, el botón final explica que el correo sigue pendiente de conexión; nunca finge haber enviado el aviso. La función pública puede recibir solicitudes de cualquier visitante, por eso fija el destinatario y limita los envíos. No uses contraseñas, claves ni tokens en `config.js`.
