/* PresupuestoClaro — recursos/funciones.js
   Fase 3: interactividad con JavaScript puro (sin manejadores inline).
   Toda la inicialización ocurre dentro del evento load. */

window.addEventListener('load', iniciar);

/* ---------- Catálogo de servicios con tarifa por hora (en pesos) ---------- */
var catalogo = [
  { nombre: 'Relevamiento inicial', tarifa: 15000 },
  { nombre: 'Instalación de red', tarifa: 20000 },
  { nombre: 'Configuración de router / Wi-Fi', tarifa: 18000 },
  { nombre: 'Cableado estructurado', tarifa: 22000 },
  { nombre: 'Mantenimiento de PC', tarifa: 16000 },
  { nombre: 'Soporte mensual', tarifa: 14000 },
  { nombre: 'Instalación de software', tarifa: 15000 },
  { nombre: 'Backup y recuperación de datos', tarifa: 19000 },
  { nombre: 'Desarrollo de sitio web', tarifa: 25000 },
  { nombre: 'Herramienta a medida', tarifa: 28000 },
  { nombre: 'Capacitación al personal', tarifa: 17000 }
];
var OPCION_OTRO = 'otro';

/* ---------- Estado de la agenda (arreglo de objetos) ---------- */
var agenda = [
  { id: 1, nombre: 'Relevamiento inicial', tarifa: 15000, horas: 2, prioridad: 'Normal' },
  { id: 2, nombre: 'Instalación de red', tarifa: 20000, horas: 4, prioridad: 'Urgente' },
  { id: 3, nombre: 'Soporte mensual', tarifa: 14000, horas: 3, prioridad: 'Baja' }
];
var proximoId = 4;

function iniciar() {
  iniciarMenu();
  iniciarFormulario();
  iniciarBuscador();
  iniciarAgenda();
}

/* ---------- 1. Menú táctil móvil ---------- */
function iniciarMenu() {
  var botonMenu = document.getElementById('btn-menu');
  if (botonMenu) {
    botonMenu.addEventListener('click', toggleMenu);
  }
}

function toggleMenu() {
  var menu = document.getElementById('menu-nav');
  var botonMenu = document.getElementById('btn-menu');
  var abierto = menu.classList.toggle('activo');
  botonMenu.setAttribute('aria-expanded', abierto ? 'true' : 'false');
}

/* ---------- 2. Validación visual del formulario ---------- */
function iniciarFormulario() {
  var form = document.getElementById('form-contacto');
  if (!form) {
    return;
  }
  var campos = form.querySelectorAll('input, textarea');
  for (var i = 0; i < campos.length; i++) {
    campos[i].addEventListener('input', validarCampo);
    campos[i].addEventListener('change', validarCampo);
  }
  form.addEventListener('submit', enviarFormulario);
}

// Devuelve true si el valor del campo es correcto
function esCampoValido(campo) {
  var valor = campo.value.trim();
  if (campo.id === 'telefono') {
    // Opcional: si se completa, debe tener formato de teléfono
    return valor === '' || /^[0-9 +()-]{8,}$/.test(valor);
  }
  if (campo.required && valor === '') {
    return false;
  }
  return campo.checkValidity();
}

function validarCampo(evento) {
  var campo = evento.target;
  campo.classList.remove('campo-ok', 'campo-error');
  if (campo.id === 'telefono' && campo.value.trim() === '') {
    return; // campo opcional vacío: sin estilos
  }
  if (esCampoValido(campo)) {
    campo.classList.add('campo-ok');
  } else {
    campo.classList.add('campo-error');
  }
}

function enviarFormulario(evento) {
  evento.preventDefault();
  var form = evento.target;
  var campos = form.querySelectorAll('input, textarea');
  var todoValido = true;
  for (var i = 0; i < campos.length; i++) {
    if (!esCampoValido(campos[i])) {
      campos[i].classList.add('campo-error');
      campos[i].classList.remove('campo-ok');
      todoValido = false;
    }
  }
  var mensaje = document.getElementById('mensaje-form');
  if (todoValido) {
    mensaje.textContent = '¡Gracias! Recibimos tu mensaje y te respondemos a la brevedad.';
    mensaje.classList.remove('oculto');
    form.reset();
    for (var j = 0; j < campos.length; j++) {
      campos[j].classList.remove('campo-ok', 'campo-error');
    }
  } else {
    mensaje.classList.add('oculto');
  }
}

/* ---------- 3. Buscador de servicios (filtro con bucle for) ---------- */
function iniciarBuscador() {
  var buscador = document.getElementById('buscar-servicio');
  if (buscador) {
    buscador.addEventListener('input', filtrarServicios);
  }
}

function filtrarServicios(evento) {
  var texto = evento.target.value.trim().toLowerCase();
  var tarjetas = document.querySelectorAll('#catalogo-servicios .tarjeta-servicio');
  var visibles = 0;
  for (var i = 0; i < tarjetas.length; i++) {
    var contenido = tarjetas[i].textContent.toLowerCase();
    if (contenido.indexOf(texto) !== -1) {
      tarjetas[i].classList.remove('oculto');
      visibles++;
    } else {
      tarjetas[i].classList.add('oculto');
    }
  }
  document.getElementById('sin-resultados').classList.toggle('oculto', visibles > 0);
}

/* ---------- 4. Agenda de presupuesto dinámica ---------- */
function iniciarAgenda() {
  var contenedor = document.getElementById('filas-agenda');
  if (!contenedor) {
    return;
  }
  cargarCatalogo();
  document.getElementById('agregar-item').addEventListener('click', agregarItem);
  document.getElementById('nuevo-servicio').addEventListener('change', cambiarServicio);
  contenedor.addEventListener('click', quitarItem);

  var campos = [
    document.getElementById('nuevo-nombre'),
    document.getElementById('nuevo-horas'),
    document.getElementById('nuevo-tarifa')
  ];
  for (var i = 0; i < campos.length; i++) {
    campos[i].addEventListener('input', validarNuevoCampo);
  }
  renderizarAgenda();
}

// Llena el <select> con los servicios del catálogo + la opción "Otro"
function cargarCatalogo() {
  var select = document.getElementById('nuevo-servicio');
  for (var i = 0; i < catalogo.length; i++) {
    var opcion = document.createElement('option');
    opcion.value = i;
    opcion.textContent = catalogo[i].nombre + ' — ' + formatearPesos(catalogo[i].tarifa) + '/h';
    select.appendChild(opcion);
  }
  var otro = document.createElement('option');
  otro.value = OPCION_OTRO;
  otro.textContent = 'Otro (personalizado)';
  select.appendChild(otro);
}

// Muestra u oculta los campos del ítem personalizado
function cambiarServicio(evento) {
  var esOtro = evento.target.value === OPCION_OTRO;
  document.getElementById('grupo-personalizado').classList.toggle('oculto', !esOtro);
  document.getElementById('grupo-tarifa').classList.toggle('oculto', !esOtro);
}

function validarNuevoCampo(evento) {
  var campo = evento.target;
  var valido;
  campo.classList.remove('campo-ok', 'campo-error');
  if (campo.id === 'nuevo-nombre') {
    valido = campo.value.trim() !== '';
  } else {
    valido = Number(campo.value) >= 1;
  }
  campo.classList.add(valido ? 'campo-ok' : 'campo-error');
}

function limpiarCampo(campo) {
  campo.value = '';
  campo.classList.remove('campo-ok', 'campo-error');
}

function agregarItem() {
  var select = document.getElementById('nuevo-servicio');
  var campoNombre = document.getElementById('nuevo-nombre');
  var campoTarifa = document.getElementById('nuevo-tarifa');
  var campoHoras = document.getElementById('nuevo-horas');
  var prioridad = document.getElementById('nuevo-prioridad').value;
  var horas = Number(campoHoras.value);
  var nombre;
  var tarifa;
  var valido = true;

  if (select.value === OPCION_OTRO) {
    nombre = campoNombre.value.trim();
    tarifa = Number(campoTarifa.value);
    if (nombre === '') {
      campoNombre.classList.add('campo-error');
      valido = false;
    }
    if (!(tarifa >= 1)) {
      campoTarifa.classList.add('campo-error');
      valido = false;
    }
  } else {
    nombre = catalogo[Number(select.value)].nombre;
    tarifa = catalogo[Number(select.value)].tarifa;
  }
  if (!(horas >= 1)) {
    campoHoras.classList.add('campo-error');
    valido = false;
  }
  if (!valido) {
    return;
  }

  agenda.push({ id: proximoId, nombre: nombre, tarifa: tarifa, horas: horas, prioridad: prioridad });
  proximoId++;
  limpiarCampo(campoNombre);
  limpiarCampo(campoTarifa);
  limpiarCampo(campoHoras);
  renderizarAgenda();
}

function quitarItem(evento) {
  var boton = evento.target.closest('.agenda-quitar');
  if (!boton) {
    return;
  }
  var id = Number(boton.getAttribute('data-id'));
  var nuevaAgenda = [];
  for (var i = 0; i < agenda.length; i++) {
    if (agenda[i].id !== id) {
      nuevaAgenda.push(agenda[i]);
    }
  }
  agenda = nuevaAgenda;
  renderizarAgenda();
}

function claseFila(prioridad) {
  if (prioridad === 'Urgente') {
    return 'fila-urgente';
  } else if (prioridad === 'Baja') {
    return 'fila-baja';
  }
  return 'fila-normal';
}

// Factor según prioridad: Urgente +30%, Baja -10%, Normal sin cambio
function factorPrioridad(prioridad) {
  if (prioridad === 'Urgente') {
    return 1.3;
  } else if (prioridad === 'Baja') {
    return 0.9;
  }
  return 1;
}

function formatearPesos(monto) {
  return '$' + Math.round(monto).toLocaleString('es-AR');
}

function formatearAjuste(monto) {
  if (monto > 0) {
    return '+' + formatearPesos(monto);
  } else if (monto < 0) {
    return '−' + formatearPesos(Math.abs(monto));
  }
  return formatearPesos(0);
}

function crearElemento(etiqueta, clase, texto) {
  var el = document.createElement(etiqueta);
  el.className = clase;
  el.textContent = texto;
  return el;
}

function renderizarAgenda() {
  var contenedor = document.getElementById('filas-agenda');
  var totalHoras = 0;
  var totalBase = 0;
  var totalFinal = 0;
  contenedor.innerHTML = '';

  if (agenda.length === 0) {
    contenedor.appendChild(crearElemento('p', 'agenda-vacia', 'La agenda está vacía. Agregá un ítem para empezar.'));
  }

  for (var i = 0; i < agenda.length; i++) {
    var item = agenda[i];
    var base = item.tarifa * item.horas;
    var subtotal = base * factorPrioridad(item.prioridad);

    var fila = document.createElement('div');
    fila.className = 'agenda-fila ' + claseFila(item.prioridad);
    fila.appendChild(crearElemento('span', 'agenda-item', item.nombre));
    fila.appendChild(crearElemento('span', 'agenda-horas', item.horas + ' hs × ' + formatearPesos(item.tarifa)));
    fila.appendChild(crearElemento('span', 'agenda-prioridad', item.prioridad));
    fila.appendChild(crearElemento('span', 'agenda-subtotal', formatearPesos(subtotal)));

    var quitar = crearElemento('button', 'agenda-quitar', 'Quitar');
    quitar.type = 'button';
    quitar.setAttribute('data-id', item.id);
    fila.appendChild(quitar);

    contenedor.appendChild(fila);
    totalHoras += item.horas;
    totalBase += base;
    totalFinal += subtotal;
  }

  document.getElementById('desglose-horas').textContent = totalHoras + ' hs';
  document.getElementById('desglose-base').textContent = formatearPesos(totalBase);
  document.getElementById('desglose-ajuste').textContent = formatearAjuste(totalFinal - totalBase);
  document.getElementById('total-agenda').textContent = formatearPesos(totalFinal);
}
