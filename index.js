document.addEventListener("DOMContentLoaded",_load);

function _load(){
	const visor = document.getElementById("visor");
	const resultado = _construirNivel(texto);
	arbolTexto = resultado.nodos;
	visor.appendChild(resultado.frag);
	
	document.getElementById("cabecera").addEventListener("click", _cabecera);
	
	_cargarVoces();
};

let texto = `Mi nombre es Ana y vivo en una ciudad pequeña. Tengo una familia grande y muy amable. Me gusta caminar por el parque los fines de semana. También disfruto escuchar música en casa.
Cada mañana me levanto temprano para ir a la escuela. Desayuno pan y tomo un vaso de leche. En la escuela aprendo español y matemáticas. Me gusta estudiar con mis amigos.`;

let arbolTexto = [];

const niveles = [
	{ tipo: "parrafo", separador: "\n" },
	{ tipo: "oracion", separador: "." },
	{ tipo: "palabra", separador: " " },
	{ tipo: "silaba", separador: null }
];

let voces;

function _cargarVoces(){
    voces = window.speechSynthesis.getVoices();
	vocesSelect = document.getElementById("voz");
    vocesSelect.innerHTML = "";
    voces.forEach((voz, indice) => {
		const option = document.createElement("option");
		option.value = indice;
		option.textContent = `${voz.name} (${voz.lang})`;
		vocesSelect.appendChild(option);
    });
  };

// Algunos navegadores cargan las voces después
window.speechSynthesis.onvoiceschanged = _cargarVoces; 

function _cabecera(e){
	switch(e.target.id){
		case "play": _iniciarLectura(); break;
		case "pause": _pausarLectura(); break;
		case "stop": _detenerLectura(); break;
	};
};

function _obtenerConfigTTS(){
	return {
		unidad: document.getElementById("modo").value,
		velocidad: parseFloat(document.getElementById("velocidad").value),
		pausa: parseInt(document.getElementById("pausa").value, 10),
		voz: voces[document.getElementById("voz").value],
		repeticiones: 1
	};
};

function _iniciarLectura(){
	if(!speechSynthesis.speaking){
		_estadoBotones("play");
		let config = _obtenerConfigTTS();
		_leerSecuencial(_obtenerUnidades(arbolTexto, config.unidad), config);
	}else{
		_estadoBotones("play");
		_continuarLectura();
	};
};

function _continuarLectura(){
	_estadoBotones("play");
	speechSynthesis.resume();
};

function _pausarLectura(){
	if(speechSynthesis.speaking){
		_estadoBotones("pause");
		speechSynthesis.pause();
	};
};

function _detenerLectura(){
	if(speechSynthesis.speaking){
		document.getElementsByClassName("activo")[0].classList.remove("activo");
		_estadoBotones("stop");
		speechSynthesis.cancel();
	};
};

function _estadoBotones(btn){
	document.getElementById("play").classList.remove("btnActivo");
	document.getElementById("pause").classList.remove("btnActivo");
	document.getElementById("stop").classList.remove("btnActivo");
	document.getElementById(btn).classList.add("btnActivo");	
};

function _construirNivel(texto, nivel = 0, store = null){
	const config = niveles[nivel];
	const frag = document.createDocumentFragment();
	const nodos = [];
	if (!config.separador){
		const silabas = _exportSilabas(texto).syllables();
		silabas.forEach((sil, i) => {
			const el = _elemento("silaba", i, sil);
			const nodo = {
				tipo: "silaba",
				texto: sil,
				elemento: el,
				hijos: []
			};
			frag.appendChild(el);
			nodos.push(nodo);
		});
		return { frag, nodos };
	};
	let partes = texto.split(config.separador)
		.map(p => p.trim())
		.filter(p => p !== "")
		.map(p => config.tipo === "oracion" ? p + config.separador : p);
	partes.forEach((parte, i) => {
		const el = _elemento(config.tipo, i);
		const nodo = {
			tipo: config.tipo,
			texto: parte,
			elemento: el,
			hijos: []
		};
		const resultado = _construirNivel(parte, nivel + 1);
		nodo.hijos = resultado.nodos;
		el.appendChild(resultado.frag);
		frag.appendChild(el);
		nodos.push(nodo);
	});
	return { frag, nodos };
};

function _elemento(tipo, a, texto = ""){
	let div = document.createElement("div");
	div.className = tipo;
	div.id = tipo+"-"+a;
	div.dataset.tipo = tipo;
	div.dataset.indice = a;
	if(texto !== ""){ div.textContent = texto; };
	return div;
};

function _leerNodo(nodo, config, onFinish){
	_resaltarNodo(nodo);
	let u = new SpeechSynthesisUtterance(nodo.texto);
	u.rate = config.velocidad;
	u.voice = config.voz;
	u.onend = () => {
		_desresaltarNodo(nodo);
		setTimeout(onFinish, config.pausa);
	};
	speechSynthesis.speak(u);
}

function _obtenerUnidades(arbol, unidad){
	let resultado = [];
	function _recorrerNodos(nodos){
		nodos.forEach(nodo => {
			if (nodo.tipo === unidad) {
				resultado.push(nodo);
			};
			if (nodo.hijos && nodo.hijos.length > 0) {
				_recorrerNodos(nodo.hijos);
			};
		});
	};
	_recorrerNodos(arbol);
	return resultado;
}

function _leerSecuencial(unidades, config){
	let i = 0;
	function _siguiente(){
		if (i >= unidades.length) return;
		let rep = 0;
		function _repetir(){
			if (rep >= config.repeticiones){
				i++;
				_siguiente();
				return;
			};
			_leerNodo(unidades[i], config, () => {
				rep++;
				_repetir();
			});
		};
		_repetir();
	};
	_siguiente();
};

function _resaltarNodo(nodo){
	nodo.elemento.classList.add("activo");
};

function _desresaltarNodo(nodo){
	nodo.elemento.classList.remove("activo");
};