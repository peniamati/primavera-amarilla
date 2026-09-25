/**
 * Primavera amarilla — public, fixed-recipient notification endpoint.
 * Deploy as Web app: Execute as Me; access Anyone. Set Script Property
 * CLAIM_RECIPIENT to your own Gmail address before deployment.
 * No Gmail credentials are ever stored in the GitHub Pages source.
 */
function doGet(e) {
  const output = (data) => ContentService
    .createTextOutput('springClaimCallback(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
  try {
    const params = (e && e.parameter) || {};
    if (params.action !== 'claim') return output({ok:false,error:'Solicitud inválida'});
    const recipient = PropertiesService.getScriptProperties().getProperty('CLAIM_RECIPIENT');
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return output({ok:false,error:'Falta configurar el correo'});
    const name = String(params.name || '').trim().slice(0,40).replace(/[<>\r\n]/g,'');
    if (!name) return output({ok:false,error:'Falta el nombre'});
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return output({ok:false,error:'Intentá otra vez en un momento'});
    try {
      const cache = CacheService.getScriptCache();
      const last = Number(cache.get('lastClaim') || 0);
      if (Date.now() - last < 60000) return output({ok:false,error:'Esperá un minuto antes de otro reclamo'});
      const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const props = PropertiesService.getScriptProperties();
      const countKey = 'count-' + today;
      const count = Number(props.getProperty(countKey) || 0);
      if (count >= 30) return output({ok:false,error:'Por hoy ya recibí demasiados reclamos'});
      MailApp.sendEmail(recipient, '🌼 Reclamo de premios — Primavera amarilla',
        name + ' completó el juego y reclamó los premios simbólicos:\n\n' +
        '🫂 Un abrazo\n💛 Un beso\n🍽️ Una salida a comer\n\n' +
        'Fecha: ' + new Date().toLocaleString('es-AR') + '\n' +
        'Sitio: https://peniamati.github.io/primavera-amarilla/');
      cache.put('lastClaim', String(Date.now()), 65);
      props.setProperty(countKey, String(count + 1));
      return output({ok:true});
    } finally { lock.releaseLock(); }
  } catch (error) {
    console.error(error);
    return output({ok:false,error:'No se pudo enviar el aviso'});
  }
}
