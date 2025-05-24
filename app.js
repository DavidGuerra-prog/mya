// Navegación de secciones
const menuLinks = document.querySelectorAll('#mainMenuLinks a[data-section]');
const sections = {
  inicio: document.getElementById('section-inicio'),
  grupos: document.getElementById('section-grupos'),
  calendario: document.getElementById('section-calendario')
};
menuLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    menuLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    Object.keys(sections).forEach(key => sections[key].style.display = 'none');
    const section = this.getAttribute('data-section');
    if (sections[section]) {
      sections[section].style.display = '';
      if(section === 'grupos') renderGrupos();
      if(section === 'calendario') renderCalendario(0);
    }
  });
});
// ------ GRUPOS ------
function gruposKey() {
  const u = localStorage.getItem("loggedUser") || "demo";
  return "grupos_" + u;
}
function cargarGrupos() {
  let g = localStorage.getItem(gruposKey());
  return g ? JSON.parse(g) : [];
}
function guardarGrupos(grupos) {
  localStorage.setItem(gruposKey(), JSON.stringify(grupos));
}
function renderGrupos() {
  const listaDiv = document.getElementById('gruposLista');
  const grupos = cargarGrupos();
  listaDiv.innerHTML = "";
  if (grupos.length === 0) {
    listaDiv.innerHTML = "<p style='color:#b05c79'>No has creado grupos.</p>";
    return;
  }
  grupos.forEach((g, idx) => {
    const d = document.createElement('div');
    d.className = "grupo-card";
    d.innerHTML = `<div class="grupo-titulo">${g.nombre}</div>
    <div class="grupo-desc">${g.descripcion}</div>
    <button class="btn" style="background:#f8bbd0;font-size:0.9em;" onclick="eliminarGrupo(${idx})">Eliminar</button>`;
    listaDiv.appendChild(d);
  });
}
window.eliminarGrupo = function(idx) {
  let grupos = cargarGrupos();
  grupos.splice(idx,1);
  guardarGrupos(grupos);
  renderGrupos();
}
document.getElementById('grupoForm').onsubmit = function(e) {
  e.preventDefault();
  const nombre = document.getElementById('grupoNombre').value.trim();
  const descripcion = document.getElementById('grupoDesc').value.trim();
  if (!nombre) return alert("El grupo debe tener nombre");
  let grupos = cargarGrupos();
  grupos.push({nombre, descripcion});
  guardarGrupos(grupos);
  this.reset();
  renderGrupos();
};
renderGrupos();

// ------ CALENDARIO ------
function calendarKey() {
  const u = localStorage.getItem("loggedUser") || "demo";
  return "eventosCalendar_" + u;
}
function cargarEventos() {
  let e = localStorage.getItem(calendarKey());
  return e ? JSON.parse(e) : [];
}
function guardarEventos(eventos) {
  localStorage.setItem(calendarKey(), JSON.stringify(eventos));
}
function renderCalendario(monthOffset = 0) {
  let today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  if (typeof renderCalendario.mOffset === "number") {
    renderCalendario.mOffset += monthOffset;
  } else {
    renderCalendario.mOffset = 0;
  }
  let showMonth = new Date(currentYear, currentMonth + renderCalendario.mOffset, 1);
  let year = showMonth.getFullYear();
  let month = showMonth.getMonth();
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  document.getElementById('calendarMonth').textContent = meses[month] + " " + year;
  let firstDay = new Date(year, month, 1);
  let startDay = (firstDay.getDay() || 7)-1;
  let daysInMonth = new Date(year, month+1, 0).getDate();
  let tbody = document.getElementById('calendarBody');
  tbody.innerHTML = "";
  let row = document.createElement('tr');
  for(let i=0; i<startDay; i++) row.appendChild(document.createElement('td'));
  let eventos = cargarEventos();
  let fechaISO = "";
  for(let d=1; d<=daysInMonth; d++) {
    if ((row.children.length) % 7 === 0 && d !== 1) {
      tbody.appendChild(row);
      row = document.createElement('tr');
    }
    let td = document.createElement('td');
    fechaISO = year + "-" + String(month+1).padStart(2,'0') + "-" + String(d).padStart(2,'0');
    td.textContent = d;
    if (year === today.getFullYear() && month === today.getMonth() && d === today.getDate()) td.classList.add('today');
    if (eventos.some(ev => ev.fecha === fechaISO)) td.classList.add('event-day');
    td.onclick = function() {
      document.getElementById('eventDate').value = fechaISO;
      document.getElementById('eventTitle').focus();
    }
    row.appendChild(td);
  }
  while (row.children.length<7) row.appendChild(document.createElement('td'));
  tbody.appendChild(row);
  let eventosList = document.getElementById('calendarEventsList');
  eventosList.innerHTML = "";
  eventos.filter(ev=>ev.fecha.slice(0,7)===fechaISO.slice(0,7))
    .sort((a,b)=>a.fecha.localeCompare(b.fecha))
    .forEach(ev=>{
      let li = document.createElement('li');
      li.innerHTML = `<span class="event-date">${ev.fecha}</span>: <b>${ev.titulo}</b> ${ev.descripcion?("("+ev.descripcion+")"):""}
      <button style="font-size:0.9em;background:#f8bbd0;border-radius:5px;border:none;margin-left:0.6em;color:#fff;cursor:pointer;" onclick="eliminarEvento('${ev.fecha}','${ev.titulo.replace(/'/g,"")}')">Eliminar</button>`;
      eventosList.appendChild(li);
    });
}
window.eliminarEvento = function(fecha,titulo) {
  let eventos = cargarEventos();
  guardarEventos(eventos.filter(ev=>!(ev.fecha===fecha&&ev.titulo===titulo)));
  renderCalendario(0);
}
document.getElementById('prevMonthBtn').onclick = ()=>renderCalendario(-1);
document.getElementById('nextMonthBtn').onclick = ()=>renderCalendario(1);
document.getElementById('calendarEventForm').onsubmit = function(e){
  e.preventDefault();
  let fecha = document.getElementById('eventDate').value;
  let titulo = document.getElementById('eventTitle').value.trim();
  let descripcion = document.getElementById('eventDesc').value.trim();
  if (!fecha || !titulo) return alert("El evento debe tener fecha y título");
  let eventos = cargarEventos();
  eventos.push({fecha, titulo, descripcion});
  guardarEventos(eventos);
  this.reset();
  renderCalendario(0);
};
renderCalendario();

// ------ LOGIN, REGISTRO, PERFIL: LÓGICA BÁSICA (puedes adaptar el resto de tu JS aquí) ------
// ... aquí iría todo tu sistema de usuarios, modales, etc. ...
// Por espacio, te indico que puedes copiar la lógica de tu plataforma anterior aquí.
// Asegúrate de que los modales usan style.display = "block"/"none" para mostrar/ocultar.
