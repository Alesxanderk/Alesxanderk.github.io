document.addEventListener("DOMContentLoaded", _load);

function _load(){
	document.getElementById("cabecera").addEventListener("click", _cabecera);
	document.getElementById("grados").addEventListener("click", _grados);
	document.getElementById("niveles").addEventListener("click", _niveles);
	window.speechSynthesis.onvoiceschanged = _cargarVoces;
	_cargarVoces();
};

let arbolTexto = [];

const niveles = [
	{ tipo: "parrafo", separador: "\n" },
	{ tipo: "oracion", separador: "." },
	{ tipo: "palabra", separador: " " }
];

let voces;

let selectorNivel = {
	grado: undefined,
	nivel: undefined
};

function _cargarVoces(){
    voces = window.speechSynthesis.getVoices();
	vocesSelect = document.getElementById("voz");
    vocesSelect.innerHTML = "";
    voces.forEach((voz, indice) => {
		const option = document.createElement("option");
		option.value = indice;
		option.textContent = `${voz.name}`;
		vocesSelect.appendChild(option);
    });
  };

function _grados(e){
	selectorNivel.grado = e.target.dataset.grado;
	if(selectorNivel.grado !== undefined){
		document.getElementById("grados").classList.add("hide");
		document.getElementById("niveles").classList.remove("hide");
	};
};

function _niveles(e){
	selectorNivel.nivel = parseInt(e.target.dataset.nivel, 10) - 1;
	if(selectorNivel.nivel !== undefined){
		document.getElementById("selector").classList.add("hide");
		document.getElementById("grados").classList.remove("hide");
		document.getElementById("niveles").classList.add("hide");
		document.getElementById("lector").classList.remove("hide");
		_prepararTexto();
	};
};

function _prepararTexto(){
	const texto = textos[selectorNivel.grado][selectorNivel.nivel];
	const resultado = _construirNivel(texto);
	arbolTexto = resultado.nodos;
	const visor = document.getElementById("visor");
	visor.innerHTML = "";
	visor.appendChild(resultado.frag);
};

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

function _construirNivel(texto, nivel = 0){
	const config = niveles[nivel];
	const frag = document.createDocumentFragment();
	const nodos = [];
	if(nivel < 3){
		let partes = texto.split(config.separador)
			.map(p => p.trim())
			.filter(p => p !== "")
			.map(p => config.tipo === "oracion" ? p + config.separador : p);
		
		partes.forEach((parte, i) => {
			const el = _elemento(config.tipo, i, nivel === 2 ? parte : "");
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
	};
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