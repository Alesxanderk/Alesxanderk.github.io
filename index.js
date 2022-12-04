function cargar(){
	let msg='';
	let tam=datos.length;
	for(let i=0;i<tam;i++){
		msg+='<div class="segmento">';
		msg+='<div class="bloque">';
		msg+='<div class="saga">'+datos[i]['saga']+'</div>';
		let tam2=datos[i]['datos'].length;
		for(let j=0;j<tam2;j++){
			msg+='<div class="libro">'+datos[i]['datos'][j]+'</div>';
		};
		msg+='</div>';
		if(datos[i]['extras']!==undefined){
			msg+='<div class="bloque">';
			let tam3=datos[i]['extras'].length;		
			for(let k=0;k<tam3;k++){
				msg+='<div class="libro">'+datos[i]['extras'][k]+'</div>';
			};
			msg+='</div>';
		};
		msg+='</div>';
		msg+='</div>';
	};
	document.getElementById('libros_lista').innerHTML=msg;
};