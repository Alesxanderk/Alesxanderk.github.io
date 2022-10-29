function mostrar(tipo){
	switch(tipo){
		case 0:
			document.getElementById("libros").style.display='flex';
			document.getElementById("cortos").style.display='none';
			document.getElementById("escrito").style.display='none';
		break;
		case 1:
			document.getElementById("libros").style.display='none';
			document.getElementById("cortos").style.display='flex';
			document.getElementById("escrito").style.display='none';
		break;
		case 2:
			document.getElementById("libros").style.display='none';
			document.getElementById("cortos").style.display='none';
			document.getElementById("escrito").style.display='flex';
		break;
	};
};
