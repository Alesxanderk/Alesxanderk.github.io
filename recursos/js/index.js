window.onbeforeunload=detener_tts;
document.onfullscreenchange=pantalla_salida;

/* Carga de archivo */
let elem_archivo=document.createElement('input');
elem_archivo.setAttribute('type','file');
elem_archivo.setAttribute('onchange','cargar_epub()');
elem_archivo.setAttribute('accept','.epub');
let lector;
let archivo;

/* Elementos */
let estilos_extra;
let abrir_1;
let abrir_2;
let boton_izq;
let boton_der;
let boton_tts;
let tts_1;
let tts_2;
let contenedor_rango;
let rango_paginas;
let valor_paginas;
let valor_barra;
let visor;
let contenido;
let modal_tts_ajustes;
let contenido_tts_ajustes;
let listado_voces_tts;
let modal_libros;
let listado_libros;
let contenido_libros;

/* JSZip */
let zip=new JSZip();

/* Parser */
let parser=new DOMParser();

/* -- */
let dir_estilos_extra;
let dir_paginas;
let dir_imagenes;

let indice_paginas=0;
let indice_estilos=0;
let indice_imagenes=0;
let indice_parrafo=0;
let max_parrafos;
let max_scroll=0;

/* TTS */
let tts=window.speechSynthesis;
let utterance=new SpeechSynthesisUtterance();
let voces=[];
let cancelado=false;

/* db */
let db=window.localStorage;
let pagina_cargada=null;
let parrafo_cargado=null;
let nombre_archivo='';

/* Controles menu */
let libro_abierto=false;

/* Funciones */
function cargar(){
	buscar_elementos();
	comprobar_tts();
	listado_voces();
	preparar_utterance();
};

/* Carga de elementos */
function buscar_elementos(){
	estilos_extra=document.getElementById('externo');
	
	abrir_1=document.getElementById('abrir_1');
	abrir_2=document.getElementById('abrir_2');
	
	boton_izq=document.getElementById('boton_izq');
	boton_der=document.getElementById('boton_der');
	boton_tts=document.getElementById('boton_tts');
	
	tts_1=document.getElementById('tts_1');
	tts_2=document.getElementById('tts_2');
	
	contenedor_rango=document.getElementById('contenedor_rango');
	rango_paginas=document.getElementById('rango_paginas');
	
	valor_paginas=document.getElementById('valor_paginas');
	
	valor_barra=document.getElementById('valor_barra');
	
	visor=document.getElementById('visor');
	contenido=document.getElementById('contenido');
	
	modal_tts_ajustes=document.getElementById('modal_tts_ajustes');
	contenido_tts_ajustes=document.getElementById('contenido_tts_ajustes');
	listado_voces_tts=document.getElementById('listado_voces_tts');
	
	modal_libros=document.getElementById('modal_libros');
	listado_libros=document.getElementById('listado_libros');
	contenido_libros=document.getElementById('contenido_libros');
	
	rango_paginas.addEventListener('input',visor_del_valor_paginas);
};

/* Manejo db */
function comprobar_base(){
	nombre_archivo=archivo.name;
	let datos_libro=db.getItem(nombre_archivo);
	if(datos_libro!==null){
		datos_libro=datos_libro.split('@');
		datos_libro[0]=parseInt(datos_libro[0],10);
		if(confirm("¿Abrir la sección "+(datos_libro[0]+1)+"?")){
			pagina_cargada=datos_libro[0];
			parrafo_cargado=parseInt(datos_libro[2],10);
		};
	}else{db.setItem(nombre_archivo,'0@0@0');};
};

/* Manejo del EPUB */
function solicitar_archivo(){
	if(!libro_abierto){elem_archivo.click();};
};

function cargar_epub(){
	archivo=elem_archivo.files[0];
	comprobar_base();
	lector=new FileReader();
	lector.readAsArrayBuffer(archivo);
	lector.onload=procesar_epub;
	lector.onerror=mostrar_error;
};

function procesar_epub(){
	zip.loadAsync(lector.result,{createFolders:true})
	.then(function (zip){buscar_mime();});
};

function buscar_mime(){
	zip.file('mimetype').async('string')
	.then(function (mimetype){
		if(mimetype==='application/epub+zip'){buscar_container();};
	});
};

function buscar_container(){
	zip.file('META-INF/container.xml').async('string')
	.then(function (file){buscar_opf(file);});
};

function buscar_opf(file){
	file=parser.parseFromString(file,'application/xml');
	let elem_temp=file.getElementsByTagName('rootfile')[0];
	let tipo_media=elem_temp['attributes']['media-type'].nodeValue;
	if(tipo_media==='application/oebps-package+xml'){
		let dir_opf=elem_temp['attributes']['full-path'].nodeValue;
		let dir_raiz='';
		if(dir_opf.indexOf('/')!==-1){
			let partes=dir_opf.split('/');
			let tam_partes=partes.length-1;
			for(let i=0;i<tam_partes;i++){dir_raiz+=partes[i]+'/';};
		};
		procesar_opf(dir_raiz,dir_opf);
	}else{
		alert('No se a encontrado el archivo OPF');
		console.log('No se a encontrado el archivo OPF');
	};
};

function procesar_opf(dir_raiz,dir_opf){
	dir_paginas=[];
	dir_estilos_extra=[];
	dir_imagenes=[];
	indice_paginas=0;
	indice_estilos=0;
	indice_imagenes=0;
	zip.file(dir_opf).async('string')
	.then(function (file){
		cambiar_abrir();
		file=parser.parseFromString(file,'application/xml');
		let lista_elem=file.getElementsByTagName('item');
		let tam_lista_elem=lista_elem.length;
		for(let i=0;i<tam_lista_elem;i++){
			let tipo_arc=lista_elem[i]['attributes']['media-type'].nodeValue;
			let valor_dir=lista_elem[i]['attributes']['href'].nodeValue;
			switch(tipo_arc){
				case 'image/png':
					dir_imagenes.push({'dir':dir_raiz+valor_dir,'nombre':'../'+valor_dir,'data':'','tipo':'image/png'});
					dir_imagenes.push({'dir':dir_raiz+valor_dir,'nombre':valor_dir,'data':'','tipo':'image/png'});
				break;
				case 'image/jpeg':
					dir_imagenes.push({'dir':dir_raiz+valor_dir,'nombre':'../'+valor_dir,'data':'','tipo':'image/jpeg'});
					dir_imagenes.push({'dir':dir_raiz+valor_dir,'nombre':valor_dir,'data':'','tipo':'image/jpeg'});
				break;
				case 'image/svg+xml':
					dir_imagenes.push({'dir':dir_raiz+valor_dir,'nombre':'../'+valor_dir,'data':'','tipo':'image/svg+xml'});
					dir_imagenes.push({'dir':dir_raiz+valor_dir,'nombre':valor_dir,'data':'','tipo':'image/svg+xml'});
				break;
				case 'image/gif':
					dir_imagenes.push({'dir':dir_raiz+valor_dir,'nombre':'../'+valor_dir,'data':'','tipo':'image/gif'});
					dir_imagenes.push({'dir':dir_raiz+valor_dir,'nombre':valor_dir,'data':'','tipo':'image/gif'});
				break;
				case 'text/css':
					dir_estilos_extra.push(dir_raiz+lista_elem[i]['attributes']['href'].nodeValue);
				break;
			};
		};
		let lista_ncx=file.getElementsByTagName('itemref');
		let tam_lista_ncx=lista_ncx.length;
		for(let i=0;i<tam_lista_ncx;i++){
			let id_elem=lista_ncx[i]['attributes']['idref'].nodeValue;
			let temp_elem=file.getElementById(id_elem);
			dir_paginas.push(dir_raiz+temp_elem['attributes']['href'].nodeValue);
		};
		rango_paginas.setAttribute('max',dir_paginas.length-1);
		actualizar_registro_libro();
		tooltip_range();
		cargar_imagenes();
		activar_botones();
	});
};

function mostrar_error(){alert('Ha ocurrido un error al leer el archivo');};

/* Manejo de Imanges */
function cargar_imagenes(){
	if(dir_imagenes[indice_imagenes]!==undefined){
	zip.file(dir_imagenes[indice_imagenes]['dir']).async('base64')
		.then(function (file){
			dir_imagenes[indice_imagenes]['data']=file;
			if(indice_imagenes<(dir_imagenes.length-1)){
				indice_imagenes+=1;
				cargar_imagenes();
			}else{cargar_estilos();};
		});
	};
};

/* Manejo de Estilos */
function cargar_estilos(){
	if(dir_estilos_extra[indice_estilos]!==undefined){
	zip.file(dir_estilos_extra[indice_estilos]).async('string')
		.then(function (file){
			file=file.replace('body','#contenido');
			estilos_extra.innerHTML+=file;
			if(indice_estilos<(dir_estilos_extra.length-1)){
				indice_estilos+=1;
				cargar_estilos();
			}else{cargar_pagina();};
		});
	};
};

/* Manejo de Paginas */
function cargar_pagina(){
	indice_parrafo=0;
	if(pagina_cargada!==null){
		indice_paginas=pagina_cargada;
		rango_paginas.value=indice_paginas;
		indice_parrafo=parrafo_cargado;
		tooltip_range();
		pagina_cargada=null;
		parrafo_cargado=null;
	};
	zip.file(dir_paginas[indice_paginas]).async('string')
	.then(function (file){
		for(let i=0;i<dir_imagenes.length;i++){			
			let temp_nombre=dir_imagenes[i]['nombre'];
			let temp_tipo=dir_imagenes[i]['tipo'];
			let temp_data='data:'+temp_tipo+';base64,'+dir_imagenes[i]['data'];
			file=file.replaceAll(temp_nombre,temp_data);
		};
		file=parser.parseFromString(file,'text/html');
		contenido.innerHTML=file.body.innerHTML;
		libro_abierto=true;
		let lista_nodos=contenido.children;
		max_parrafos=lista_nodos.length;
		for(let i=0;i<max_parrafos;i++){
			lista_nodos[i].setAttribute('id','id_'+i);
			lista_nodos[i].setAttribute('data-id',''+i);
		};
		if(indice_parrafo!==0){
			let elem_temp=document.getElementById('id_'+indice_parrafo);
			cambiar_seleccionado(elem_temp);
		};
		actualizar_registro_libro();
		maximo_scroll();
	});
};

/* Activar botones */
function activar_botones(){
	boton_izq.classList.remove('desactivado');
	boton_der.classList.remove('desactivado');
	contenedor_rango.classList.remove('desactivado');
	boton_tts.classList.remove('desactivado');
};

/* Movimiento entre las paginas */
function retroceder_pagina(){
	if((indice_paginas-1)>-1){
		indice_paginas-=1;
		actualizar_registro_libro();
		actualizar_elem_paginas();
		tooltip_range();
		detener_tts();
		cambiar_tts_3();
		cargar_pagina();
	};
};

function avanzar_pagina(){
	if((indice_paginas+1)<dir_paginas.length){
		indice_paginas+=1;
		actualizar_registro_libro();
		actualizar_elem_paginas();
		tooltip_range();
		detener_tts();
		cambiar_tts_3();
		cargar_pagina();
	}else{console.log("Por alguna razon no avanza: " + indice_paginas + "][" + dir_paginas.length);};
};

/* Movimiento entre paginas - range */
function cambiar_pagina(){
	indice_paginas=parseInt(rango_paginas.value,10);
	actualizar_registro_libro();
	detener_tts();
	cambiar_tts_3();
	cargar_pagina();	
};

/* Actualizar los visores de la pagina actual */
function actualizar_elem_paginas(){
	rango_paginas.value=indice_paginas;
};

function visor_del_valor_paginas(){
	let valor=parseInt(rango_paginas.value);
	valor_paginas.innerHTML=(valor+1)+' / '+dir_paginas.length;
};

/* Manejo Modales */
function libros(){
	ocultar_scroll();
	obtener_registro_libros();
	modal_libros.style.display='flex';
};

function ajustes_tts(){
	ocultar_scroll();
	modal_tts_ajustes.style.display='flex';
};

/* Salida de los modales */
window.onclick=function(event){
	switch(event.target){
		case modal_libros:
			modal_libros.style.display="none";
			habilitar_scroll();
		break;
		case modal_tts_ajustes:
			modal_tts_ajustes.style.display="none";
			habilitar_scroll();
		break;
	};
};

/* Manejo Scroll */
function habilitar_scroll(){visor.style='overflow:scroll';};

function ocultar_scroll(){visor.style='overflow:hidden';};

function maximo_scroll(){
	habilitar_scroll();
	setTimeout(segundo,200);
};

function segundo(){
	visor.scrollTop=10000000000000000;
	max_scroll=visor.scrollTop;
	visor.scrollTop=0;
};

/* Manejo de la pantalla completa */
function p_completa(){
	if(document.fullscreenElement===null){
		if(document.documentElement.requestFullscreen){
			document.documentElement.requestFullscreen();
			pantalla_1.style='display:none';
			pantalla_2.style='display:flex';
		}else if(document.documentElement.webkitRequestFullscreen){
			document.documentElement.webkitRequestFullscreen();
			pantalla_1.style='display:none';
			pantalla_2.style='display:flex';
		}else if(document.documentElement.msRequestFullscreen){
			document.documentElement.msRequestFullscreen();
			pantalla_1.style='display:none';
			pantalla_2.style='display:flex';
		};
	};
};

function pantalla_salida(){
	if(document.fullscreenElement===null){
		pantalla_1.style='display:flex';
		pantalla_2.style='display:none';
	};
};

/* Manejo del TTS */
function comprobar_tts(){
	if(speechSynthesis.onvoiceschanged!==undefined){
		speechSynthesis.onvoiceschanged=listado_voces;
	};
};

function preparar_utterance(){
	utterance.onend=utterance_terminar;
	utterance.utterance_error;
};

function utterance_terminar(){
	if(cancelado==false){
		if((indice_parrafo+1)<max_parrafos){
			indice_parrafo+=1;
			actualizar_registro_libro();
			leer();
		};
	};
};

function utterance_error(){console.error('Ocurrio un error');};

function listado_voces(){
	voces=tts.getVoices().sort(function (a,b){
		let a_name=a.name.toUpperCase();
		let b_name=b.name.toUpperCase();
		if (a_name<b_name){return -1;}
		else if(a_name==b_name){return 0;}
		else{return +1;}
	});
	let indice_voz=listado_voces_tts.selectedIndex<0?0:listado_voces_tts.selectedIndex;
	listado_voces_tts.innerHTML='';
	for(let i=0;i<voces.length;i++){
		let elem_opcion=document.createElement('option');
		elem_opcion.textContent=voces[i].name+' '+voces[i].lang;
		if(voces[i].default){elem_opcion.textContent+=' -- Prede.';};
		elem_opcion.setAttribute("data-lang", voces[i].lang);
		elem_opcion.setAttribute("data-name", voces[i].name);
		listado_voces_tts.appendChild(elem_opcion);
	};
	listado_voces_tts.selectedIndex=indice_voz;
};

function iniciar_tts(){
	if(tts.speaking){detener_tts();cambiar_tts();}
	else{cancelado=false;leer();cambiar_tts();};
};

function leer(){
	if(tts.speaking){
		console.error('TTS hablando');
		return;
	};
	if(contenido.textContent!==''){
		let elem_temp=document.getElementById('id_'+indice_parrafo);
		cambiar_seleccionado(elem_temp);
		let texto=elem_temp.textContent;
		let voz=listado_voces_tts.selectedOptions[0].getAttribute('data-name');
		for(let i=0;i<voces.length;i++){
			if (voces[i].name===voz){
				utterance.voice=voces[i];
				break;
			};
		};
		utterance.text=texto;
		utterance.pitch=1;
		utterance.rate=1.7;
		tts.speak(utterance);
	};
};

function detener_tts(){
	cancelado=true;
	tts.cancel();
};

/* Manejo seleccionar parrafo para TTS */
function buscar_padre(){	
	if(libro_abierto){
		let elem_hijo=event.target;
		let salir=false;
		while(!salir){
			let elem_padre=elem_hijo.parentNode;
			let valor=elem_padre.getAttribute('id');
			if(valor==='contenido'){
				let temp_id=elem_hijo.getAttribute('id');
				indice_parrafo=parseInt(elem_hijo.getAttribute('data-id'),10);
				actualizar_registro_libro();
				cambiar_seleccionado(document.getElementById(temp_id));
				detener_tts();
				cancelado=false;
				leer();
				cambiar_tts_2()
				salir=true;
			}else{elem_hijo=elem_padre;};
		};
	};
};

function cambiar_seleccionado(elem_nuevo){
	let lista_seleccionado=document.getElementsByClassName('selecionado');
	if(lista_seleccionado.length>0){
		lista_seleccionado[0].classList.toggle('selecionado');
	};
	elem_nuevo.classList.toggle('selecionado');
};

/* Manejo botones encabezado */
function cambiar_abrir(){
	boton_abrir.classList.add('desactivado');
	abrir_1.style='display:none';
	abrir_2.style='display:flex';
};

function cambiar_tts(){
	let temp_valor=tts_1.style.display;
	if(temp_valor===''){
		tts_1.style='display:none;';
		tts_2.style='display:flex;';
	}else if(temp_valor==='none'){
		tts_1.style='display:flex;';
		tts_2.style='display:none;';
	}else if(temp_valor==='flex'){
		tts_1.style='display:none;';
		tts_2.style='display:flex;';
	}else{
		console.error('Un valor no permitido:',tts_1.style.display);
	};
};

function cambiar_tts_2(){
	tts_1.style='display:none';
	tts_2.style='display:flex';
};

function cambiar_tts_3(){
	tts_2.style='display:none';
	tts_1.style='display:flex';
};

/* Manejo Modal Libros */
function obtener_registro_libros(){
	let cant_libros=db.length;
	let msg='';	
	for(let i=0;i<cant_libros;i++){
		let nombre_libro=db.key(i);
		let datos_libro=db.getItem(nombre_libro);
		datos_libro=datos_libro.split('@');
		msg+='<fieldset class="horizontal_listado">';
			msg+='<legend class="titulo_listado">'+nombre_libro+'</legend>';
			msg+='<div class="texto_listado">'+(parseInt(datos_libro[0])+1)+' / '+datos_libro[1]+'</div>';
			msg+='<div class="texto_listado">'+datos_libro[2]+'</div>';
			msg+='<div class="centrar boton_efecto" onclick="borrar_entrada_libro('+i+')">';
				msg+='<div class="svg_boton borrar"></div>';
			msg+='</div>';
		msg+='</fieldset>';
	};
	listado_libros.innerHTML=msg;
};

/* Guardaro del ultimo parrafo leido */
function actualizar_registro_libro(){
	let libro_temp=db.getItem(nombre_archivo);
	if(libro_temp!==null){
		libro_temp=libro_temp.split('@');
		libro_temp[0]=indice_paginas
		libro_temp[1]=dir_paginas.length;
		libro_temp[2]=indice_parrafo;
		db.setItem(nombre_archivo,libro_temp[0]+'@'+libro_temp[1]+'@'+libro_temp[2]);
		/* cambiar para solo afectar la indicada */
		obtener_registro_libros();
	}else{console.error('No existe la entrada');};
};

function borrar_entrada_libro(no_libro){
	let libro_temp=db.key(no_libro);
	if(libro_temp!==null){
		if(confirm("¿Seguro de borrar la entrada ["+libro_temp+"]?")){
			db.removeItem(libro_temp);
			obtener_registro_libros();
		};
	}else{console.error('No existe la entrada');};
};

/* Manejo progreso de lectura */
function progreso_lectura(){
	let i=(1/max_scroll)*visor.scrollTop;
	let porcentaje=i*100;
	valor_barra.style='min-height:'+porcentaje+'%;max-height:'+porcentaje+'%';
};

window.onresize=calcular_scroll;

function calcular_scroll(){
	let i=(1/max_scroll)*visor.scrollTop;
	visor.scrollTop=10000000000000000;
	max_scroll=visor.scrollTop;
	visor.scrollTop=(i/(1/max_scroll));
};

/* Funciones auxilires */
function entero(valor){return Math.floor(valor);};