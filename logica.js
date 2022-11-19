let max_oracion=0;
let indice_oracion=0;
let letra;
let efecto=false;

function cargar(){
	let temp=document.getElementById('seleccion');
	let ancho=datos.length;
	let msg='';
	for(let i=0;i<ancho;i++){
		msg+='<div class="letra" onclick="iniciar('+i+')">'+datos[i]["letra"]+'</div>';
	};
	temp.innerHTML=msg;
};

function iniciar(indice_letra){
	letra=indice_letra;
	indice_oracion=0;
	max_oracion=datos[letra]['datos'].length;
	avanzar();
	control_vistas(1);
};

function avanzar(){
	let temp=document.getElementById('oracion');
	let ancho_oracion=datos[letra]['datos'][indice_oracion].length;
	let msg='';
	for(let i=0;i<ancho_oracion;i++){
		let texto=datos[letra]['datos'][indice_oracion][i];
		if(texto===" "){
			msg+='<div class="segmento espacio">'+texto+'</div>';
		}else{
			msg+='<div class="segmento">'+texto+'</div>';
		};
	};
	temp.innerHTML=msg;
};

function anterior_oracion(){
	if((indice_oracion-1)>-1){
		indice_oracion-=1;
		avanzar();
	};
};

function siguiente_oracion(){
	if((indice_oracion+1)<max_oracion){
		indice_oracion+=1;
		avanzar();
	};
};

function control_vistas(vista){
	switch(vista){
		case 0:
			document.getElementById('seleccion').style.display="flex";
			document.getElementById('lector').style.display="none";
		break;
		case 1:
			document.getElementById('seleccion').style.display="none";
			document.getElementById('lector').style.display="flex";
		break;
	};
};

function iniciar_efecto(){
	if(!efecto){
		efecto=true;
		let temp=document.getElementById('oracion').firstChild;
		temp.classList.toggle('resaltar');
		setTimeout(function (){avanzar_efecto(temp)},500);
	};
};

function avanzar_efecto(nodo){
	nodo.classList.toggle('resaltar');
	let siguiente=nodo.nextSibling;
	if(siguiente!==null){
		siguiente.classList.toggle('resaltar');
		setTimeout(function (){avanzar_efecto(siguiente)},500);
	}else{efecto=false;};
};