/* Plataforma de formación · ingreso de aprendices compartido por todas las apps
   © 2026 Daniel González. Todos los derechos reservados.
   - El registro y las notas se guardan en el servidor del instructor (no en este código)
   - Sesión recordada por dispositivo; varios aprendices por dispositivo con acceso rápido por documento
   - Borrador del formulario: si se refresca la página, no se pierde lo escrito */
(function(){
  var API='https://script.google.com/macros/s/AKfycbzkz8H3BIma_Ml9icCeLG9EVhFxAiQ3dW6fFYWlUexqzpLGHdR6ds5YxDvF1Dhku7nM/exec';
  var KEY='pf_sesion', KREG='pf_registros', KDRAFT='pf_borrador', KFORM='pf_formaciones', KMARCA='pf_marca';
  function ld(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
  function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function rm(k){try{localStorage.removeItem(k);}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function current(){var d=ld(KEY,null),rg=ld(KREG,{});return d&&rg[d]&&rg[d].token?rg[d]:null;}
  var MODE='doc',BUSY=false;
  function q(id){return document.getElementById(id);}
  function err(t){var e=q('egErr');if(e)e.textContent=t||'';}
  function busy(b,btn){BUSY=b;var x=document.querySelector('.eg-form .eg-btn');if(x){x.disabled=b;x.textContent=b?'Conectando…':(btn||x.getAttribute('data-t'));}}
  var E=window.EG={
    reg:current(),
    esc:esc,
    /* Llamada al servidor: JSON en texto plano (sin datos en la URL) */
    api:function(accion,datos){
      datos=datos||{};datos.accion=accion;
      var ctl=window.AbortController?new AbortController():null,t=setTimeout(function(){if(ctl)ctl.abort();},25000);
      return fetch(API,{method:'POST',body:JSON.stringify(datos),headers:{'Content-Type':'text/plain;charset=utf-8'},redirect:'follow',signal:ctl?ctl.signal:undefined})
        .then(function(r){clearTimeout(t);return r.json();})
        .catch(function(){clearTimeout(t);return {ok:false,error:'Sin conexión. Revisa tus datos o el wifi e intenta de nuevo.',red:true};})
        .then(function(r){
          if(r&&!r.ok&&/sesión venció/.test(r.error||'')){E.salir(true);}
          return r||{ok:false,error:'Respuesta no válida.'};
        });
    },
    /* con sesión: agrega el token del aprendiz */
    apiS:function(accion,datos){datos=datos||{};datos.token=E.reg?E.reg.token:'';return E.api(accion,datos);},
    lista:function(){return ld(KFORM,[]);},
    /* Identidad de la institución: llega del servidor solo con sesión activa */
    marca:function(){return E.reg?ld(KMARCA,null):null;},
    aplicarMarca:function(){
      var m=E.marca();
      document.querySelectorAll('[data-logo]').forEach(function(el){if(m&&m.logo){el.querySelector('img').src=m.logo;el.hidden=false;}else el.hidden=true;});
      document.querySelectorAll('[data-inst]').forEach(function(el){el.textContent=m?(el.getAttribute('data-inst')==='corta'?m.sigla+' · '+m.ciudad:m.institucion):'';});
      var f=document.querySelector('link[rel="icon"]');if(f)f.href=m&&m.logo?m.logo:'data:,';
    },
    cargarFormaciones:function(){
      return E.api('formaciones').then(function(r){if(r.ok){sv(KFORM,r.formaciones);}return E.lista();});
    },
    formaciones:function(app){return E.lista().filter(function(f){return !app||f.apps.indexOf(app)>=0;});},
    formacion:function(){var r=E.reg;if(!r)return null;return E.lista().filter(function(f){return f.id===r.formacion;})[0]||null;},
    grupo:function(){var f=E.formacion();return f?f.grupo:'x';},
    op:function(){var g=E.grupo();return g==='f'?'operadora':g==='m'?'operador':'operador(a)';},
    ops:function(){var g=E.grupo();return g==='f'?'operadoras':g==='m'?'operadores':'operadores y operadoras';},
    salir:function(silencio){rm(KEY);E.reg=null;if(!silencio&&typeof E.onReady==='function')E.onReady();},
    /* Formulario: acceso con documento o registro nuevo */
    formHTML:function(app,btnText){
      E._app=app;E._btn=btnText;
      var hay=Object.keys(ld(KREG,{})).length>0;
      var tabs='<div class="eg-tabs"><button class="'+(MODE==='doc'?'on':'')+'" onclick="EG.modo(\'doc\')">Ya estoy registrado</button><button class="'+(MODE==='new'?'on':'')+'" onclick="EG.modo(\'new\')">Registro nuevo</button></div>';
      if(MODE==='doc'){
        return '<div class="eg-form">'+tabs+'<label for="egQ">Documento de identidad</label><input id="egQ" type="text" inputmode="numeric" autocomplete="off" placeholder="Número de documento" onkeydown="if(event.key===\'Enter\')EG.entrar()"><div id="egErr" class="eg-err"></div><button class="eg-btn" data-t="Ingresar" onclick="EG.entrar()">Ingresar</button>'+(hay?'':'<p class="eg-fi">¿Primera vez? Toca "Registro nuevo".</p>')+'</div>';
      }
      var dr=ld(KDRAFT,{}),fs=E.formaciones(app),opts=fs.map(function(f){return '<option value="'+esc(f.id)+'"'+(dr.f===f.id?' selected':'')+'>'+esc(f.sede+' · '+f.nombre)+'</option>';}).join('');
      return '<div class="eg-form">'+tabs+'<label for="egF">Formación</label><select id="egF" onchange="EG.draft();EG.showF()"><option value="">'+(fs.length?'Selecciona tu formación':'Cargando formaciones…')+'</option>'+opts+'</select><div id="egFi" class="eg-fi"></div>'+
        '<label for="egN">Nombre completo</label><input id="egN" type="text" autocomplete="name" maxlength="80" value="'+esc(dr.n)+'" oninput="EG.draft()" placeholder="Nombres y apellidos">'+
        '<label for="egD">Documento de identidad</label><input id="egD" type="text" inputmode="numeric" maxlength="12" value="'+esc(dr.d)+'" oninput="EG.draft()" placeholder="Número de documento">'+
        '<div id="egErr" class="eg-err"></div><button class="eg-btn" data-t="'+esc(btnText||'Registrarme')+'" onclick="EG.submit()">'+esc(btnText||'Registrarme')+'</button></div>';
    },
    modo:function(m){MODE=m;var el=document.querySelector('.eg-form');if(el){el.outerHTML=E.formHTML(E._app,E._btn);E.showF();}},
    draft:function(){var g=function(id){var e=q(id);return e?e.value:'';};sv(KDRAFT,{f:g('egF'),n:g('egN'),d:g('egD')});},
    showF:function(){var s=q('egF');if(!s)return;var f=E.lista().filter(function(x){return x.id===s.value;})[0],el=q('egFi');if(el)el.textContent=f?f.tipo+' · '+f.horario:'';},
    _listo:function(a,token,marca){
      var rg=ld(KREG,{});rg[a.documento]={documento:a.documento,nombre:a.nombre,formacion:a.formacion,token:token};
      sv(KREG,rg);sv(KEY,a.documento);rm(KDRAFT);E.reg=rg[a.documento];MODE='doc';
      if(marca)sv(KMARCA,marca);
      if(typeof E.onReady==='function')E.onReady();
    },
    entrar:function(){
      if(BUSY)return;var d=(q('egQ').value||'').replace(/[\s.]/g,'');
      if(!/^\d{5,12}$/.test(d)){err('Escribe tu número de documento (solo números).');return;}
      var rg=ld(KREG,{});
      if(rg[d]&&rg[d].token){
        if(E._app&&!E.formaciones(E._app).some(function(f){return f.id===rg[d].formacion;})){err('Tu formación no tiene acceso a esta app.');return;}
        sv(KEY,d);E.reg=rg[d];if(typeof E.onReady==='function')E.onReady();return;
      }
      busy(true);
      E.api('ingresar',{documento:d}).then(function(r){
        busy(false);if(!r.ok){err(r.error);return;}
        if(E._app&&!E.formaciones(E._app).some(function(f){return f.id===r.aprendiz.formacion;})){err('Tu formación no tiene acceso a esta app.');return;}
        E._listo(r.aprendiz,r.token,r.marca);
      });
    },
    submit:function(){
      if(BUSY)return;
      var f=q('egF').value,n=q('egN').value.trim().replace(/\s+/g,' '),d=q('egD').value.replace(/[\s.]/g,'');
      if(!f){err('Selecciona tu formación.');return;}
      if(n.split(' ').length<2){err('Escribe nombres y apellidos.');return;}
      if(!/^\d{5,12}$/.test(d)){err('Escribe tu número de documento (solo números).');return;}
      busy(true);
      E.api('registrar',{formacion:f,nombre:n,documento:d}).then(function(r){busy(false);if(!r.ok){err(r.error);return;}E._listo(r.aprendiz,r.token,r.marca);});
    },
    /* Arranque: muestra lo guardado y actualiza el menú de formaciones desde el servidor */
    iniciar:function(){
      var habia=E.lista().length;
      E.aplicarMarca();
      E.cargarFormaciones().then(function(){if(!habia&&typeof E.onReady==='function')E.onReady();});
      if(E.reg&&!ld(KMARCA,null)){
        E.apiS('marca').then(function(r){if(r.ok&&r.marca){sv(KMARCA,r.marca);E.aplicarMarca();if(typeof E.onReady==='function')E.onReady();}});
      }
    }
  };
})();
