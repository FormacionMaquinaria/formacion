/* Plataforma de formación · ingreso de aprendices compartido por todas las apps
   © 2026 Daniel González. Todos los derechos reservados.
   - El registro y las notas se guardan en el servidor del instructor (no en este código)
   - Sesión recordada por dispositivo; varios aprendices por dispositivo con acceso rápido por documento
   - Borrador del formulario: si se refresca la página, no se pierde lo escrito */
(function(){
  var API='https://script.google.com/macros/s/AKfycbzkz8H3BIma_Ml9icCeLG9EVhFxAiQ3dW6fFYWlUexqzpLGHdR6ds5YxDvF1Dhku7nM/exec';
  var KEY='pf_sesion', KREG='pf_registros', KDRAFT='pf_borrador', KMARCA='pf_marca';
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
    /* Identidad de la institución: llega del servidor solo con sesión activa */
    marca:function(){return E.reg?ld(KMARCA,null):null;},
    aplicarMarca:function(){
      var m=E.marca();
      document.querySelectorAll('[data-logo]').forEach(function(el){if(m&&m.logo){el.querySelector('img').src=m.logo;el.hidden=false;}else el.hidden=true;});
      document.querySelectorAll('[data-inst]').forEach(function(el){el.textContent=m?(el.getAttribute('data-inst')==='corta'?m.sigla+' · '+m.ciudad:m.institucion):'';});
      var f=document.querySelector('link[rel="icon"]');if(f)f.href=m&&m.logo?m.logo:'data:,';
    },
    /* La formación del aprendiz llega del servidor con su sesión: no hay listado público de grupos */
    formacion:function(){return E.reg&&E.reg.f?E.reg.f:null;},
    acceso:function(f,app){return !app||!!(f&&f.apps&&f.apps.indexOf(app)>=0);},
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
        return '<div class="eg-form">'+tabs+'<label for="egQ">Documento de identidad</label><input id="egQ" type="text" inputmode="numeric" autocomplete="off" placeholder="Número de documento" onkeydown="if(event.key===\'Enter\')EG.entrar()"><label for="egC">Código de grupo</label><input id="egC" type="text" autocapitalize="characters" autocomplete="off" maxlength="12" placeholder="Solo si ingresas desde otro dispositivo" onkeydown="if(event.key===\'Enter\')EG.entrar()"><div id="egErr" class="eg-err"></div><button class="eg-btn" data-t="Ingresar" onclick="EG.entrar()">Ingresar</button>'+(hay?'':'<p class="eg-fi">¿Primera vez? Toca "Registro nuevo".</p>')+'</div>';
      }
      var dr=ld(KDRAFT,{});
      return '<div class="eg-form">'+tabs+'<label for="egF">Código de grupo</label><input id="egF" type="text" autocapitalize="characters" autocomplete="off" maxlength="12" value="'+esc(dr.f)+'" oninput="EG.draft();EG.showF()" placeholder="Te lo da tu instructor"><div id="egFi" class="eg-fi"></div>'+
        '<label for="egN">Nombre completo</label><input id="egN" type="text" autocomplete="name" maxlength="80" value="'+esc(dr.n)+'" oninput="EG.draft()" placeholder="Nombres y apellidos">'+
        '<label for="egD">Documento de identidad</label><input id="egD" type="text" inputmode="numeric" maxlength="12" value="'+esc(dr.d)+'" oninput="EG.draft()" placeholder="Número de documento">'+
        '<div id="egErr" class="eg-err"></div><button class="eg-btn" data-t="'+esc(btnText||'Registrarme')+'" onclick="EG.submit()">'+esc(btnText||'Registrarme')+'</button></div>';
    },
    modo:function(m){MODE=m;var el=document.querySelector('.eg-form');if(el){el.outerHTML=E.formHTML(E._app,E._btn);E.showF();}},
    draft:function(){var g=function(id){var e=q(id);return e?e.value:'';};sv(KDRAFT,{f:g('egF'),n:g('egN'),d:g('egD')});},
    /* Confirma el grupo apenas el aprendiz escribe el código */
    showF:function(){
      var s=q('egF'),el=q('egFi');if(!s||!el)return;
      var c=s.value.toUpperCase().replace(/[^A-Z0-9]/g,'');clearTimeout(E._t);
      if(c.length<4){el.textContent='';return;}
      E._t=setTimeout(function(){
        el.textContent='Verificando código…';
        E.api('grupo',{codigo:c}).then(function(r){
          var a=q('egF');if(!a||a.value.toUpperCase().replace(/[^A-Z0-9]/g,'')!==c)return;
          el.textContent=r.ok?r.formacion.sede+' · '+r.formacion.nombre+' · '+r.formacion.horario:r.error;
        });
      },500);
    },
    _listo:function(a,token,marca,f){
      var rg=ld(KREG,{});rg[a.documento]={documento:a.documento,nombre:a.nombre,formacion:a.formacion,f:f,token:token};
      sv(KREG,rg);sv(KEY,a.documento);rm(KDRAFT);E.reg=rg[a.documento];MODE='doc';
      if(marca)sv(KMARCA,marca);
      if(typeof E.onReady==='function')E.onReady();
    },
    entrar:function(){
      if(BUSY)return;var d=(q('egQ').value||'').replace(/[\s.]/g,'');
      if(!/^\d{5,12}$/.test(d)){err('Escribe tu número de documento (solo números).');return;}
      var rg=ld(KREG,{});
      if(rg[d]&&rg[d].token){
        if(rg[d].f&&!E.acceso(rg[d].f,E._app)){err('Tu formación no tiene acceso a esta app.');return;}
        sv(KEY,d);E.reg=rg[d];if(typeof E.onReady==='function')E.onReady();return;
      }
      var c=((q('egC')||{}).value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
      if(c.length<4){err('En un dispositivo nuevo escribe también tu código de grupo.');return;}
      busy(true);
      E.api('ingresar',{documento:d,codigo:c}).then(function(r){
        busy(false);if(!r.ok){err(r.error);return;}
        if(!E.acceso(r.formacion,E._app)){err('Tu formación no tiene acceso a esta app.');return;}
        E._listo(r.aprendiz,r.token,r.marca,r.formacion);
      });
    },
    submit:function(){
      if(BUSY)return;
      var f=q('egF').value,n=q('egN').value.trim().replace(/\s+/g,' '),d=q('egD').value.replace(/[\s.]/g,'');
      f=f.toUpperCase().replace(/[^A-Z0-9]/g,'');
      if(f.length<4){err('Escribe el código de grupo que te dio tu instructor.');return;}
      if(n.split(' ').length<2){err('Escribe nombres y apellidos.');return;}
      if(!/^\d{5,12}$/.test(d)){err('Escribe tu número de documento (solo números).');return;}
      busy(true);
      E.api('registrar',{codigo:f,nombre:n,documento:d}).then(function(r){busy(false);if(!r.ok){err(r.error);return;}E._listo(r.aprendiz,r.token,r.marca,r.formacion);});
    },
    /* Arranque: muestra lo guardado y actualiza el menú de formaciones desde el servidor */
    iniciar:function(){
      E.aplicarMarca();
      if(!E.reg)return;
      var antes=!!(E.reg.f&&ld(KMARCA,null));
      E.apiS('sesion').then(function(r){
        if(!r.ok){if(!E.reg&&typeof E.onReady==='function')E.onReady();return;}
        var rg=ld(KREG,{}),d=E.reg.documento;if(!rg[d])return;
        rg[d].f=r.formacion;rg[d].formacion=r.formacion.id;rg[d].nombre=r.aprendiz.nombre;sv(KREG,rg);E.reg=rg[d];
        if(r.marca)sv(KMARCA,r.marca);
        E.aplicarMarca();
        if(!antes&&typeof E.onReady==='function')E.onReady();
      });
    }
  };
})();
