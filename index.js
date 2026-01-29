document.addEventListener("DOMContentLoaded", _load);

const utter = new SpeechSynthesisUtterance();
let stateTTS = "stop";
let index = 0;
let text = [];
let timerUtter = undefined;

function _load(){
	_addEvent("btnStartCustom", "click", _btnStartCustom);
	_addEvent("btnReturnWork", "click", _btnReturnWork);
	_addEvent("btnPlay", "click", _btnPlay);
};

function _btnStartCustom(){
	if(!_checkCustomText()){
		alert("No se ha ingresado texto.");
		return false;
	};
	_hideElement("customText");
	_showElement("work");
	let text = _getValue("textCustom");
	_clearValue("textCustom");
	_prepareText(text);
};

function _btnReturnWork(){
	_hideElement("work");
	_showElement("customText");
	_clearContent("workSpace");
};

function _checkCustomText(){
	if(_getValue("textCustom").length > 0){ return true; };
	return false;
};

function _prepareText(text){
	text = _cleanText(text);
	const fragText = text.split("\n");
	fragText.forEach(frag => {
		const card = _createCard(frag);
		_getElement("workSpace").appendChild(card);
	});
};

function _cleanText(text){
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n|\r/g, "\n")
    .trim()
    .replace(/\t+/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])([^\s\n])/g, "$1 $2")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n");
};



function _createCard(text){
	const card = _createElement("div");
	card.classList.add("card");
	card.appendChild(_createBtnTTS());
	card.appendChild(_createContent(text));
	return card;
};

function _createBtnTTS(){
	const btnTTS = _createElement("button");
	btnTTS.classList.add("btnTTS");
	btnTTS.textContent = "Play";
	btnTTS.addEventListener("click", _btnTTS);
	return btnTTS;
};

function _createContent(text){
	const content = _createElement("div");
	content.classList.add("content");
	content.classList.add("hide-text");
	content.addEventListener("click", _showText);
	content.textContent = text;
	return content;
};


function _showText(e){
	e.target.classList.toggle("hide-text");
};

function _btnPlay(e){
	switch(stateTTS){
		case "stop":
		
			const mode = _getValue("selectMode");
			const contents = document.getElementsByClassName("content");
			text = _getText([... contents], mode);
			
			_prepareUtter();
			
			speechSynthesis.cancel();
			if(timerUtter !== undefined){ clearTimeout(timerUtter); };
			
			_startTTS(text);
			stateTTS = "play";
			
			_unselectBtn();
			_selectBtn(e.target);
			
		break;
		case "play":
			speechSynthesis.cancel();
			if(timerUtter !== undefined){ clearTimeout(timerUtter); };
			stateTTS = "stop";
			_unselectBtn();
		break;
	};
};

function _btnTTS(e){
	switch(stateTTS){
		case "stop":
			const mode = _getValue("selectMode");
			const div = e.target.parentElement.children[1];
			
			text = _getText(div, mode);
			_prepareUtter();
			
			speechSynthesis.cancel();
			clearTimeout(timerUtter);
			
			_startTTS(text);
			stateTTS = "play";
			
			_unselectBtn();
			_selectBtn(e.target);
		break;
		case "play":
			speechSynthesis.cancel();
			clearTimeout(timerUtter);
			
			stateTTS = "stop";
			_unselectBtn();
		break;
	};
};

function _getText(div, mode){
	let frag = [];
	const array = { "parrafo": "\n", "oracion": ".", "palabra": " " };
	if(Array.isArray(div)){
		let temp = "";
		div.forEach(k => (temp += k.textContent + "\n") );
		frag = temp.split(array[mode]);
		frag = frag.map( k => _cleanText(k) );
		frag = frag.filter( k => k !== "" );
	}
	else{ frag = div.textContent.split(array[mode]).filter(k => k !== ""); };
	return frag;
};


function _prepareUtter(){
	utter.lang = "en-US";
	utter.rate = parseFloat(_getValue("selectSpeed"));
	utter.onend = () => {
		if(stateTTS === "play"){
			if(index < text.length - 1){
				index++;
				timerUtter = setTimeout( _startTTS , parseFloat(_getValue("selectPause")));
			}else{
				stateTTS = "stop";
				if(timerUtter !== undefined){ clearTimeout(timerUtter); };
				_unselectBtn();
			};
		}else{ _unselectBtn(); };
	};
	index = 0;
};

function _startTTS(array){
	utter.text = text[index];
	speechSynthesis.speak(utter);
};

function _selectBtn(e){ e.classList.add("btnSelect"); };

function _unselectBtn(){
	const array = [... document.getElementsByClassName("btnSelect")];
	array.forEach(el => el.classList.remove("btnSelect"));
};


function _getElement(n){ return document.getElementById(n); };

function _createElement(n){ return document.createElement(n); };

function _getValue(n){ return document.getElementById(n).value; };

function _clearContent(n){ document.getElementById(n).innerHTML = ""; };

function _clearValue(n){ document.getElementById(n).value=""; };

function _showElement(n){ document.getElementById(n).classList.remove("hide"); };

function _hideElement(n){ document.getElementById(n).classList.add("hide"); };

function _addEvent(n, t, f){ document.getElementById(n).addEventListener(t, f); };