window.onbeforeunload=detener_tts;

/* Carga de archivo */

let elem_archivo=document.createElement('input');
elem_archivo.setAttribute('type','file');
elem_archivo.setAttribute('onchange','cargar_epub()');
elem_archivo.setAttribute('accept','.epub');
let lector;
let archivo;

/* Elemntos */

let elem_modal_ajustes_tts;
let elem_encabezado;
let elem_visor;
let elem_contenido;

let elem_valor_tam_fuente;
let elem_valor_inter;
let elem_valor_paginas;
let elem_rango_paginas;
let elem_valor_progeso;
let elem_botones_paginas;

let elem_listado_voces_tts;

let elem_estilos_extra;
let elem_estilo_usuario;

/* JSZip */

let zip=new JSZip();
let parser=new DOMParser();

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
let nombre_archivo='';

/* Funciones */

function cargar(){
	buscar_elementos();
	comprobar_tts();
	listado_voces();
	preparar_utterance();
};

/* Carga de elementos */

function buscar_elementos(){
	elem_encabezado=document.getElementById('encabezado');
	elem_visor=document.getElementById('visor');
	elem_contenido=document.getElementById('contenido');
	elem_modal_ajustes_tts=document.getElementById('modal_tts_ajustes');
	elem_valor_tam_fuente=document.getElementById('valor_tam');
	elem_valor_inter=document.getElementById('valor_inter');
	elem_valor_paginas=document.getElementById('valor_pagina');
	elem_rango_paginas=document.getElementById('rango_paginas');
	elem_valor_progeso=document.getElementById('valor_progreso');
	elem_listado_voces_tts=document.getElementById('listado_voces_tts');
	elem_pitch=document.getElementById('pitch');
	elem_rate=document.getElementById('rate');
	elem_estilos_extra=document.getElementById('externo');
	elem_botones_paginas=document.getElementById('botones_paginas');
};

/* Manejo db */

function comprobar_base(){
	nombre_archivo=archivo.name;
	let libro=db.getItem(nombre_archivo);
	if(libro!==null){
		libro=parseInt(libro,10);
		if(confirm("¿Abrir la sección "+(libro+1)+"?")){
			pagina_cargada=libro;
		}else{/*Abrir en 0*/};
	}else{db.setItem(nombre_archivo,'0');};
};

function actualizar_base(){
	db.setItem(nombre_archivo,indice_paginas);
};

/* Manejo del EPUB */

function solicitar_archivo(){elem_archivo.click();};

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
	.then(function (zip){
		buscar_mime();
	});
};

function buscar_mime(){
	zip.file('mimetype').async('string')
	.then(function (mimetype){
		if(mimetype==='application/epub+zip'){
			buscar_container();
		};
	});
};

function buscar_container(){
	zip.file('META-INF/container.xml').async('string')
	.then(function (file){
		buscar_opf(file);
	});
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
				/*default:console.log(tipo_arc);break;*/
			};
		};
		let lista_ncx=file.getElementsByTagName('itemref');
		let tam_lista_ncx=lista_ncx.length;
		for(let i=0;i<tam_lista_ncx;i++){
			let id_elem=lista_ncx[i]['attributes']['idref'].nodeValue;
			let temp_elem=file.getElementById(id_elem);
			dir_paginas.push(dir_raiz+temp_elem['attributes']['href'].nodeValue);
		};
		elem_rango_paginas.setAttribute('max',dir_paginas.length-1);
		actualizar_paginas();
		cargar_imagenes();
		activar_botones();
	});
};

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
			elem_estilos_extra.innerHTML+=file;
			if(indice_estilos<(dir_estilos_extra.length-1)){
				indice_estilos+=1;
				cargar_estilos();
			}else{
				cargar_pagina();
			};
		});
	};
};

/* Manejo de Paginas */

function cargar_pagina(){
	if(pagina_cargada!==null){
		indice_paginas=pagina_cargada;
		elem_rango_paginas.value=indice_paginas;
		actualizar_paginas();
		pagina_cargada=null;
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
		elem_contenido.innerHTML=file.body.innerHTML;
		let lista_nodos=elem_contenido.children;
		max_parrafos=lista_nodos.length;
		for(let i=0;i<max_parrafos;i++){
			lista_nodos[i].setAttribute('id','id_'+i);
			lista_nodos[i].setAttribute('data-id',''+i);
		};
		indice_parrafo=0;
		maximo_scroll();
	});
};

/* Botones de paginas */

function activar_botones(){
	elem_botones_paginas.classList.toggle('desactivado');
};

function manejo_pagina(tipo){
	switch(tipo){
		case '-':retroceder_pagina();break;
		case '+':avanzar_pagina();break;
	};
};

function retroceder_pagina(){
	if((indice_paginas-1)>-1){
		indice_paginas-=1;
		actualizar_base();
		actulizar_elem_paginas();
		actualizar_paginas();
		detener_tts();
		cargar_pagina();
	};
};

function avanzar_pagina(){
	if((indice_paginas+1)<dir_paginas.length){
		indice_paginas+=1;
		actualizar_base();
		actulizar_elem_paginas();
		actualizar_paginas();
		detener_tts();
		cargar_pagina();
	}else{console.log("Por alguna razon no avanza: " + indice_paginas + "][" + dir_paginas.length);};
};

function cambiar_pagina(){
	indice_paginas=parseInt(elem_rango_paginas.value,10);
	actualizar_paginas();
	detener_tts();
	cargar_pagina();	
};

function actualizar_paginas(){
	elem_valor_paginas.textContent=(indice_paginas+1)+' / '+dir_paginas.length;
};

function actulizar_elem_paginas(){
	elem_rango_paginas.value=indice_paginas;
};

function mostrar_error(){alert('Ha ocurrido un error al leer el archivo');};

/* Manejo Modales */

function ajustes(){
	ocultar_scroll();
	elem_modal_ajustes.style.display='flex';
};

function ajustes_tts(){
	ocultar_scroll();
	elem_modal_ajustes_tts.style.display='flex';
};

window.onclick=function(event){
	switch(event.target){
		case elem_modal_ajustes_tts:
			elem_modal_ajustes_tts.style.display="none";
			habilitar_scroll();
		break;
	};
};

function habilitar_scroll(){
	elem_visor.style='overflow:scroll';
};

function ocultar_scroll(){
	elem_visor.style='overflow:hidden';
};

function maximo_scroll(){
	habilitar_scroll();
	setTimeout(segundo,200);
};

function segundo(){
	elem_visor.scrollTop=10000000000000000;
	max_scroll=elem_visor.scrollTop;
	elem_visor.scrollTop=0;
};

function progreso(){
	let i=(1/max_scroll)*elem_visor.scrollTop;
	let porcentaje=(100*i);	
	elem_valor_progeso.style='min-height:'+porcentaje+'%;'+'max-height:'+porcentaje+'%;';
};

/* Manejo de la pantalla completa */

function p_completa(){	
	if(document.documentElement.requestFullscreen){
		document.documentElement.requestFullscreen();
	}else if(document.documentElement.webkitRequestFullscreen){
		document.documentElement.webkitRequestFullscreen();
	}else if(document.documentElement.msRequestFullscreen){
		document.documentElement.msRequestFullscreen();
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
			leer();
		};
	};
};

function utterance_error(){
	console.error('Ocurrio un error');
};

function listado_voces(){
	voces=tts.getVoices().sort(function (a,b){
		let a_name=a.name.toUpperCase();
		let b_name=b.name.toUpperCase();
		if (a_name<b_name){return -1;}
		else if(a_name==b_name){return 0;}
		else{return +1;}
	});
	let indice_voz=elem_listado_voces_tts.selectedIndex<0?0:elem_listado_voces_tts.selectedIndex;
	elem_listado_voces_tts.innerHTML='';
	for(let i=0;i<voces.length;i++){
		let elem_opcion=document.createElement('option');
		elem_opcion.textContent=voces[i].name+' '+voces[i].lang;
		if(voces[i].default){elem_opcion.textContent+=' -- Prede.';};
		elem_opcion.setAttribute("data-lang", voces[i].lang);
		elem_opcion.setAttribute("data-name", voces[i].name);
		elem_listado_voces_tts.appendChild(elem_opcion);
	};
	elem_listado_voces_tts.selectedIndex=indice_voz;
};

function iniciar_tts(){
	if(tts.speaking){detener_tts();}
	else{cancelado=false;leer();};
};

function leer(){
	if(tts.speaking){
		console.error('TTS hablando');
		return;
	};
	if(elem_contenido.textContent!==''){
		let elem_temp=document.getElementById('id_'+indice_parrafo);
		cambiar_seleccionado(elem_temp);
		let texto=elem_temp.textContent;
		let voz=elem_listado_voces_tts.selectedOptions[0].getAttribute('data-name');
		for(let i=0;i<voces.length;i++){
			if (voces[i].name===voz){
				utterance.voice=voces[i];
				break;
			};
		};
		utterance.text=texto;
		utterance.pitch=elem_pitch.value;
		utterance.rate=elem_rate.value;
		tts.speak(utterance);
	};
};

function detener_tts(){
	cancelado=true;
	tts.cancel();
};

/* Funciones auxilires */

function entero(valor){return Math.floor(valor);};

/* --- */

function buscar_padre(){
	let elem_hijo=event.target;
	let salir=false;
	while(!salir){
		let elem_padre=elem_hijo.parentNode;
		let valor=elem_padre.getAttribute('id');
		if(valor==='contenido'){
			let temp_id=elem_hijo.getAttribute('id');
			indice_parrafo=parseInt(elem_hijo.getAttribute('data-id'),10);
			cambiar_seleccionado(document.getElementById(temp_id));
			detener_tts();
			cancelado=false;
			leer();
			salir=true;
		}else{elem_hijo=elem_padre;};
	};
};

function cambiar_seleccionado(elem_nuevo){
	let lista_seleccionado=document.getElementsByClassName('selecionado');
	if(lista_seleccionado.length>0){
		lista_seleccionado[0].classList.toggle('selecionado');
	};
	elem_nuevo.classList.toggle('selecionado');
};