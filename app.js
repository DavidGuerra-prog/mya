// === Utilidades ===
function $(id) { return document.getElementById(id); }
function show(el) { el && (el.style.display = ""); }
function hide(el) { el && (el.style.display = "none"); }
function clearInputs(form) { if(form) Array.from(form.elements).forEach(e => { if(e.type!=='submit') e.value=''; }); }
function hash(pwd) { return btoa(unescape(encodeURIComponent(pwd))); } // Simple hash para demo
function hideAllErrors() {
  hide($('loginError'));
  hide($('registerError'));
  hide($('registerSuccess'));
}

// === Variables globales ===
const menuLinks = document.querySelectorAll('#mainMenuLinks a[data-section]');
const sections = {
  login: $('section-login'),
  inicio: $('section-inicio'),
  grupos: $('section-grupos'),
  calendario: $('section-calendario')
};
let loggedUser = null; // Objeto usuario logueado (no solo username)
let calendarMonthOffset = 0;

// === Gestión de usuarios y sesión ===
function getStoredUsers() {
  let u = localStorage.getItem('appUsers');
  try { return u ? JSON.parse(u) : []; } catch { return []; }
}
function setStoredUsers(users) {
  localStorage.setItem('appUsers', JSON.stringify(users));
}
function getLoggedUser() {
  const username = localStorage.getItem("loggedUser");
  if (!username) return null;
  const users = getStoredUsers();
  return users.find(u => u.username === username) || null;
}
function userAvatarOrDefault(user) {
  return user && user.avatar
    ? user.avatar
    : "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.nombre || user?.username || "Estudiante") + "&background=476072&color=fff&rounded=true&size=128";
}
if(!localStorage.getItem('appUsers')) {
  setStoredUsers([
    { username: 'alumno1', password: hash('1234'), nombre: 'María González', avatar: "" },
    { username: 'alumno2', password: hash('abcd'), nombre: 'Juan Pérez', avatar: "" }
  ]);
}

// === Navegación y control de secciones ===
function setActiveSection(sectionKey) {
  Object.entries(sections).forEach(([key, sec]) => sec && (sec.style.display = key === sectionKey ? "" : "none"));
  menuLinks.forEach(l => l.classList.toggle('active', l.dataset.section === sectionKey));
  if(sectionKey === 'grupos') renderGrupos();
  if(sectionKey === 'calendario') renderCalendario(0, true);
}
menuLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const seccion = this.getAttribute('data-section');
    if(seccion !== 'login' && !loggedUser) {
      setActiveSection('login');
      return;
    }
    setActiveSection(seccion);
  });
});

// === Login/Registro ===
$('loginForm').onsubmit = function(e) {
  e.preventDefault();
  hideAllErrors();
  const username = $('username').value.trim();
  const password = $('password').value;
  const user = getStoredUsers().find(u => u.username === username && u.password === hash(password));
  if(user) {
    localStorage.setItem("loggedUser", username);
    loggedUser = user;
    mostrarSessionUI(user);
    setActiveSection('inicio');
    clearInputs(this);
  } else {
    show($('loginError'));
  }
};

$('registerForm').onsubmit = function(e) {
  e.preventDefault();
  hideAllErrors();
  const nombre = $('registerNombre').value.trim();
  const username = $('registerUsername').value.trim();
  const password = $('registerPassword').value;
  let users = getStoredUsers();
  if(users.some(u => u.username === username)) {
    show($('registerError'));
    return;
  }
  let avatarData = "";
  if($('registerAvatar').files && $('registerAvatar').files[0]) {
    let reader = new FileReader();
    reader.onload = function(evt) {
      avatarData = evt.target.result;
      users.push({ username, password: hash(password), nombre, avatar: avatarData });
      setStoredUsers(users);
      show($('registerSuccess'));
      setTimeout(() => { $('registerForm').reset(); hide($('registerSuccess')); }, 1400);
    };
    reader.readAsDataURL($('registerAvatar').files[0]);
  } else {
    users.push({ username, password: hash(password), nombre, avatar: "" });
    setStoredUsers(users);
    show($('registerSuccess'));
    setTimeout(() => { $('registerForm').reset(); hide($('registerSuccess')); }, 1400);
  }
};

// === UI tras login ===
function mostrarSessionUI(user) {
  show($('userInfo'));
  $('usernameDisplay').textContent = user.nombre;
  $('userAvatarThumb').src = userAvatarOrDefault(user);
  show($('userAvatarThumb'));
  $('sidebarUserLabel').textContent = user.nombre;
  $('sidebarUserId').textContent = user.username;
  $('sidebarAvatarThumb').src = userAvatarOrDefault(user);
  show($('sidebarAvatarThumb'));
  hide($('sidebarAvatarCircle'));
}

// === Logout ===
$('logoutBtn').onclick = function() {
  localStorage.removeItem("loggedUser");
  loggedUser = null;
  hide($('userInfo'));
  $('sidebarUserLabel').textContent = "Cuenta";
  $('sidebarUserId').textContent = "Tablero";
  hide($('sidebarAvatarThumb'));
  show($('sidebarAvatarCircle'));
  setActiveSection('login');
};

// === Mantener sesión al recargar ===
window.onload = function() {
  loggedUser = getLoggedUser();
  if(loggedUser) {
    mostrarSessionUI(loggedUser);
    setActiveSection('inicio');
  } else {
    setActiveSection('login');
  }
};

// === Grupos ===
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
  const listaDiv = $('gruposLista');
  const grupos = cargarGrupos();
  listaDiv.innerHTML = "";
  if (grupos.length === 0) {
    listaDiv.innerHTML = "<p style='color:#527ba0'>No has creado grupos.</p>";
    return;
  }
  grupos.forEach((g, idx) => {
    const d = document.createElement('div');
    d.className = "grupo-card";
    d.innerHTML = `<div class="grupo-titulo">${g.nombre}</div>
      <div class="grupo-desc">${g.descripcion}</div>
      <button class="btn eliminar-grupo" data-idx="${idx}" style="background:#527ba0;font-size:0.9em;">Eliminar</button>`;
    listaDiv.appendChild(d);
  });
}
// Delegación de eventos para eliminar grupos
$('gruposLista').addEventListener('click', function(e) {
  if (e.target.classList.contains('eliminar-grupo')) {
    const idx = Number(e.target.dataset.idx);
    let grupos = cargarGrupos();
    grupos.splice(idx, 1);
    guardarGrupos(grupos);
    renderGrupos();
  }
});
$('grupoForm').onsubmit = function(e) {
  e.preventDefault();
  const nombre = $('grupoNombre').value.trim();
  const descripcion = $('grupoDesc').value.trim();
  if (!nombre) return alert("El grupo debe tener nombre");
  let grupos = cargarGrupos();
  grupos.push({nombre, descripcion});
  guardarGrupos(grupos);
  this.reset();
  renderGrupos();
};

// === Calendario ===
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
function renderCalendario(monthOffset = 0, forceReset = false) {
  if(forceReset) calendarMonthOffset = 0;
  calendarMonthOffset += monthOffset;
  let today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let showMonth = new Date(currentYear, currentMonth + calendarMonthOffset, 1);
  let year = showMonth.getFullYear();
  let month = showMonth.getMonth();
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  $('calendarMonth').textContent = meses[month] + " " + year;
  let firstDay = new Date(year, month, 1);
  let startDay = (firstDay.getDay() || 7)-1;
  let daysInMonth = new Date(year, month+1, 0).getDate();
  let tbody = $('calendarBody');
  tbody.innerHTML = "";
  let row = document.createElement('tr');
  for(let i=0; i<startDay; i++) row.appendChild(document.createElement('td'));
  let eventos = cargarEventos();
  for(let d=1; d<=daysInMonth; d++) {
    if ((row.children.length) % 7 === 0 && d !== 1) {
      tbody.appendChild(row);
      row = document.createElement('tr');
    }
    let td = document.createElement('td');
    let fechaISO = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    td.textContent = d;
    if (year === today.getFullYear() && month === today.getMonth() && d === today.getDate()) td.classList.add('today');
    if (eventos.some(ev => ev.fecha === fechaISO)) td.classList.add('event-day');
    td.onclick = function() {
      $('eventDate').value = fechaISO;
      $('eventTitle').focus();
    }
    row.appendChild(td);
  }
  while (row.children.length<7) row.appendChild(document.createElement('td'));
  tbody.appendChild(row);
  // Mostrar eventos del mes
  let eventosList = $('calendarEventsList');
  eventosList.innerHTML = "";
  let mesActual = `${year}-${String(month+1).padStart(2,'0')}`;
  eventos.filter(ev=>ev.fecha.slice(0,7)===mesActual)
    .sort((a,b)=>a.fecha.localeCompare(b.fecha))
    .forEach(ev=>{
      let li = document.createElement('li');
      li.innerHTML = `<span class="event-date">${ev.fecha}</span>: <b>${ev.titulo}</b> ${ev.descripcion?("("+ev.descripcion+")"):""}
      <button class="eliminar-evento" data-fecha="${ev.fecha}" data-titulo="${ev.titulo.replace(/'/g,"")}"
      style="font-size:0.9em;background:#527ba0;border-radius:5px;border:none;margin-left:0.6em;color:#fff;cursor:pointer;">Eliminar</button>`;
      eventosList.appendChild(li);
    });
}
// Delegación para eliminar eventos
$('calendarEventsList').addEventListener('click', function(e) {
  if (e.target.classList.contains('eliminar-evento')) {
    let fecha = e.target.dataset.fecha;
    let titulo = e.target.dataset.titulo;
    let eventos = cargarEventos();
    guardarEventos(eventos.filter(ev=>!(ev.fecha===fecha&&ev.titulo===titulo)));
    renderCalendario(0, true);
  }
});
$('prevMonthBtn').onclick = ()=>renderCalendario(-1);
$('nextMonthBtn').onclick = ()=>renderCalendario(1);
$('calendarEventForm').onsubmit = function(e){
  e.preventDefault();
  let fecha = $('eventDate').value;
  let titulo = $('eventTitle').value.trim();
  let descripcion = $('eventDesc').value.trim();
  if (!fecha || !titulo) return alert("El evento debe tener fecha y título");
  let eventos = cargarEventos();
  eventos.push({fecha, titulo, descripcion});
  guardarEventos(eventos);
  this.reset();
  renderCalendario(0, true);
};
