// ═══════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════
const USERS = {
  'admin@scoms.edu':   { pass:'Admin@123', name:'Dr. Admin',    role:'admin',      id:'u1', dept:'Administration' },
  'super@scoms.edu':   { pass:'Super@123', name:'K. Sharma',    role:'supervisor', id:'u2', dept:'Electrical' },
  'tech@scoms.edu':    { pass:'Tech@123',  name:'Rajesh Kumar', role:'technician', id:'u3', dept:'Electrical' },
  'student@scoms.edu': { pass:'Stud@123',  name:'Aarav Singh',  role:'student',    id:'u5', dept:'CSE' },
};
let currentUser = null;
let currentPage = 'dashboard';
let globalSearchTerm = '';

let TICKETS = [
  { id:'TK-0001', title:'Main power failure – Block A Hostel',  category:'Electrical', priority:'Critical', status:'Escalated',  location:'Block A',      complainant:'Aarav Singh',  technician:'Rajesh Kumar', submitted:'2026-05-07 06:00', sla:'2026-05-07 10:00', desc:'Complete power failure in hostel block A. All sockets and lights are dead. Approximately 120 students affected.', rating:null },
  { id:'TK-0002', title:'Network switch down – Lab 3',           category:'Network',    priority:'High',     status:'InProgress', location:'Lab Block',    complainant:'Priya Sharma', technician:'Dev Joshi',    submitted:'2026-05-07 02:00', sla:'2026-05-07 14:00', desc:'Network switch in Lab 3 is unresponsive. No internet for 30 students. Lab exam scheduled in 4 hours.', rating:null },
  { id:'TK-0003', title:'Projector not working – LT-2',          category:'Electrical', priority:'High',     status:'Assigned',   location:'Lecture Hall', complainant:'Rahul Gupta',  technician:'Rajesh Kumar', submitted:'2026-05-07 01:00', sla:'2026-05-07 13:00', desc:'Projector in LT-2 does not power on. Class begins in 2 hours.', rating:null },
  { id:'TK-0004', title:'Water leakage – Corridor B2',           category:'Plumbing',   priority:'Medium',   status:'InProgress', location:'Block B',      complainant:'Sneha Patel',  technician:'Amit Verma',   submitted:'2026-05-06 08:00', sla:'2026-05-08 08:00', desc:'Water dripping from ceiling in B2 corridor near room 204. Slipping hazard.', rating:null },
  { id:'TK-0005', title:'Broken window – Room 308',              category:'Civil',      priority:'Low',      status:'Open',       location:'Block C',      complainant:'Kiran Mehta',  technician:null,           submitted:'2026-05-05 10:00', sla:'2026-05-12 10:00', desc:'Window glass cracked in room 308. Safety hazard, could injure occupants.', rating:null },
  { id:'TK-0006', title:'WiFi dead – Faculty Block',             category:'Network',    priority:'Critical', status:'Escalated',  location:'Faculty Block',complainant:'Dr. Sharma',   technician:'Dev Joshi',    submitted:'2026-05-07 05:00', sla:'2026-05-07 09:00', desc:'Complete WiFi outage in faculty block. Affecting 50+ users. Ongoing SLA breach.', rating:null },
  { id:'TK-0007', title:'Sewage smell – Block C washrooms',      category:'Plumbing',   priority:'Medium',   status:'Assigned',   location:'Block C',      complainant:'Mohit Das',    technician:'Sunita Rao',   submitted:'2026-05-06 14:00', sla:'2026-05-08 14:00', desc:'Strong sewage smell near Block C washrooms for last 2 days.', rating:null },
  { id:'TK-0008', title:'AC not cooling – Admin Office',         category:'Electrical', priority:'Medium',   status:'Resolved',   location:'Admin Block',  complainant:'Tanya Roy',    technician:'Rajesh Kumar', submitted:'2026-05-04 09:00', sla:'2026-05-06 09:00', desc:'Air conditioner running but not producing cold air.', rating:4 },
  { id:'TK-0009', title:'Broken bench – Library reading area',   category:'Civil',      priority:'Low',      status:'Closed',     location:'Library',      complainant:'Aarav Singh',  technician:'Sunita Rao',   submitted:'2026-05-01 11:00', sla:'2026-05-08 11:00', desc:'Wooden bench near reading section is broken. Leg snapped completely.', rating:5 },
];

const TICKET_HISTORY = {
  'TK-0001': [
    { from:null,         to:'Open',       by:'Aarav Singh',  time:'2026-05-07 06:00', note:'Complaint submitted online' },
    { from:'Open',       to:'Assigned',   by:'SYSTEM',       time:'2026-05-07 06:01', note:'Auto-assigned to Rajesh Kumar (REQ-4)' },
    { from:'Assigned',   to:'InProgress', by:'Rajesh Kumar', time:'2026-05-07 06:30', note:'On-site. Inspecting main DB panel' },
    { from:'InProgress', to:'Escalated',  by:'SYSTEM',       time:'2026-05-07 10:15', note:'SLA deadline breached – auto-escalated to supervisor (REQ-7)' },
  ],
  'TK-0008': [
    { from:null,         to:'Open',       by:'Tanya Roy',    time:'2026-05-04 09:00', note:'Complaint submitted' },
    { from:'Open',       to:'Assigned',   by:'SYSTEM',       time:'2026-05-04 09:01', note:'Auto-assigned to Rajesh Kumar' },
    { from:'Assigned',   to:'InProgress', by:'Rajesh Kumar', time:'2026-05-04 10:00', note:'Checking refrigerant levels' },
    { from:'InProgress', to:'Resolved',   by:'Rajesh Kumar', time:'2026-05-05 14:00', note:'Refrigerant refilled. Unit working normally. Evidence uploaded.' },
  ],
};

const VALID_TRANSITIONS = {
  Open:['Assigned'], Assigned:['InProgress','OnHold'], InProgress:['OnHold','Resolved'],
  OnHold:['InProgress','Escalated'], Escalated:['InProgress','Resolved'], Resolved:['Closed'], Closed:[],
};
const SLA_MAP = { Critical:'4 hours', High:'12 hours', Medium:'48 hours', Low:'7 days' };
const PRIORITY_RULES = [
  { cat:'Electrical', critical:['no power','main power','power failure','total outage','entire block'], high:['socket','switch broken','projector','no electricity'] },
  { cat:'Network',    critical:['entire','all dead','total down','complete outage','dead'], high:['slow','intermittent','switch'] },
  { cat:'Plumbing',   critical:['flooding','burst','sewage overflow','flood'], high:['major leak','overflow'] },
];
const DEPT_COLORS = { Electrical:'var(--blue)',Network:'var(--purple)',Plumbing:'var(--green)',Civil:'var(--amber)',Housekeeping:'var(--red)' };

function classifyPriority(cat, desc) {
  const d = (desc||'').toLowerCase();
  const rule = PRIORITY_RULES.find(r => r.cat === cat);
  if (rule) {
    if (rule.critical && rule.critical.some(k => d.includes(k))) return 'Critical';
    if (rule.high && rule.high.some(k => d.includes(k))) return 'High';
    if (['Electrical','Network','Plumbing'].includes(cat)) return 'Medium';
  }
  return 'Low';
}

// ═══════════════════════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════════════════════
function tickClock() {
  const el = document.getElementById('live-clock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
}
setInterval(tickClock, 1000);

// ═══════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════
window.fillDemo = (email, pass) => {
  document.getElementById('login-email').value = email;
  document.getElementById('login-pass').value = pass;
  document.getElementById('login-pass').dispatchEvent(new Event('input'));
};

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') doLogin();
});

window.doLogin = () => {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const user = USERS[email];
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  if (!user || user.pass !== pass) {
    errEl.textContent = '✕ Invalid credentials. Try a demo account below.';
    errEl.style.display = 'block';
    btn.style.animation = 'none';
    setTimeout(() => btn.style.animation = '', 100);
    return;
  }
  errEl.style.display = 'none';
  currentUser = { ...user, email };
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'block';
  const initials = user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('top-avatar').textContent = initials;
  document.getElementById('top-name').textContent = user.name;
  const rb = document.getElementById('top-role');
  rb.textContent = user.role.toUpperCase();
  rb.className = `role-badge ${user.role}`;
  tickClock();
  buildSidebar();
  navigate('dashboard');
};

window.logout = () => {
  currentUser = null;
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('login-screen').style.display = 'block';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
};

// ═══════════════════════════════════════════════════════════════════════
// GLOBAL SEARCH
// ═══════════════════════════════════════════════════════════════════════
window.globalSearch = (val) => {
  globalSearchTerm = val.trim().toLowerCase();
  if (currentPage === 'tickets') renderPage('tickets');
};

// ═══════════════════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════════════════
const NAV = {
  admin:      [['dashboard','KPI Overview','⬡'],['tickets','Ticket Queue','⬡'],['submit','New Complaint','⬡'],['assets','Asset Registry','⬡'],['requirements','Requirements','⬡'],['architecture','Architecture','⬡'],['users','Users','⬡'],['report','Reports','⬡']],
  supervisor: [['dashboard','Dept Dashboard','⬡'],['tickets','All Tickets','⬡'],['assets','Asset Registry','⬡']],
  technician: [['dashboard','My Queue','⬡'],['tickets','My Tickets','⬡']],
  student:    [['dashboard','My Tickets','⬡'],['submit','Submit Complaint','⬡']],
};

const NAV_ICONS = {
  dashboard:'⊡', tickets:'⊟', submit:'⊕', assets:'⊙', requirements:'⊞', architecture:'⊠', users:'⊛', report:'⊟'
};

function countEscalated() { return TICKETS.filter(t=>t.status==='Escalated').length; }

function buildSidebar() {
  const role = currentUser.role;
  const items = NAV[role] || NAV.student;
  const esc = countEscalated();
  let html = `<div style="padding:14px 16px 12px">
    <div style="font-family:var(--mono);font-size:9px;color:var(--text3);letter-spacing:.1em;margin-bottom:8px">NAVIGATION</div>`;
  items.forEach(([page, label]) => {
    const badge = page === 'tickets' && esc > 0 ? `<span class="nav-badge">${esc}</span>` : '';
    html += `<div class="nav-item" id="nav-${page}" onclick="navigate('${page}')">
      <span class="nav-icon" style="font-size:12px;color:var(--text3)">${NAV_ICONS[page]||'◆'}</span>
      <span>${label}</span>${badge}</div>`;
  });
  html += `</div>`;
  html += `<div class="sidebar-bottom">
    <div class="sidebar-user">
      <div style="width:30px;height:30px;border-radius:50%;background:var(--bg4);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;color:var(--text2);flex-shrink:0">${currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
      <div class="sidebar-user-info"><div class="sidebar-user-name">${currentUser.name}</div><div class="sidebar-user-email">${currentUser.email}</div></div>
    </div>
    <button class="btn-logout" onclick="logout()">Sign Out</button>
  </div>`;
  document.getElementById('sidebar').innerHTML = html;
}

window.navigate = function(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');
  renderPage(page);
};

function renderPage(page) {
  const renders = { dashboard, tickets, submit, assets, requirements, architecture, users, report };
  const fn = renders[page];
  document.getElementById('main-content').innerHTML = fn ? fn() : `<div class="empty-state"><div class="empty-state-icon">⊙</div><p>Page not found</p></div>`;
  attachPageEvents(page);
}

function attachPageEvents(page) {
  if (page === 'submit') attachSubmitEvents();
  if (page === 'tickets') attachTicketEvents();
}

// ═══════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════
window.showToast = (msg, type='success') => {
  const icons = { success:'✓', error:'✕', warn:'⚠' };
  const id = 'toast-' + Date.now();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.id = id;
  el.innerHTML = `<span class="toast-icon">${icons[type]||icons.success}</span><span>${msg}</span><button class="toast-close" onclick="document.getElementById('${id}').remove()">✕</button>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { const t=document.getElementById(id); if(t)t.style.cssText+='opacity:0;transform:translateY(6px);transition:.3s'; setTimeout(()=>{if(t)t.remove()},350) }, 3500);
};

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
function dashboard() {
  const role = currentUser.role;
  const myTickets = role==='student' ? TICKETS.filter(t=>t.complainant===currentUser.name)
                  : role==='technician' ? TICKETS.filter(t=>t.technician===currentUser.name)
                  : TICKETS;
  const open = myTickets.filter(t=>!['Resolved','Closed'].includes(t.status)).length;
  const escalated = myTickets.filter(t=>t.status==='Escalated').length;
  const resolved = myTickets.filter(t=>['Resolved','Closed'].includes(t.status)).length;
  const total = myTickets.length;

  if (role==='student' || role==='technician') {
    return `
    <div class="page-header">
      <h1 class="page-title">${role==='student' ? 'My Complaints' : 'My Queue'}</h1>
      <span class="page-tag">LIVE</span>
    </div>
    <div class="kpi-grid c3">
      <div class="kpi amber"><div class="kpi-accent">⊟</div><div class="kpi-label">Active</div><div class="kpi-val amber">${open}</div><div class="kpi-sub">open tickets</div></div>
      <div class="kpi red"><div class="kpi-accent">⚑</div><div class="kpi-label">Escalated</div><div class="kpi-val red">${escalated}</div><div class="kpi-sub">SLA breached</div></div>
      <div class="kpi green"><div class="kpi-accent">✓</div><div class="kpi-label">Resolved</div><div class="kpi-val green">${resolved}</div><div class="kpi-sub">completed</div></div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Recent Tickets</span><span class="panel-meta">${total} TOTAL</span></div>
      ${ticketTable(myTickets.slice(0,8))}
    </div>`;
  }

  const depts = ['Electrical','Plumbing','Network','Civil','Housekeeping'];
  const deptCounts = depts.map(d => ({ d, count:TICKETS.filter(t=>t.category===d && !['Resolved','Closed'].includes(t.status)).length }));
  const maxDept = Math.max(...deptCounts.map(d=>d.count), 1);
  const techLoad = [
    { name:'Dev Joshi',     dept:'Network',    count:9 },
    { name:'Rajesh Kumar',  dept:'Electrical', count:5 },
    { name:'Amit Verma',    dept:'Plumbing',   count:3 },
    { name:'Sunita Rao',    dept:'Civil',      count:2 },
  ];
  const slaComp = 82;
  const mttr = 6.3;

  return `
  <div class="page-header">
    <h1 class="page-title">Operations Dashboard</h1>
    <span class="page-tag">LIVE KPI</span>
    <div class="page-actions">
      <button class="btn" onclick="navigate('report')">↓ Export Report</button>
      <button class="btn primary" onclick="navigate('submit')">+ New Complaint</button>
    </div>
  </div>
  <div class="kpi-grid">
    <div class="kpi amber"><div class="kpi-accent">⊟</div><div class="kpi-label">Open Tickets</div><div class="kpi-val amber">${open}</div><div class="kpi-sub">active right now</div><div class="kpi-trend down">▲ +2 since yesterday</div></div>
    <div class="kpi red"><div class="kpi-accent">⚑</div><div class="kpi-label">Escalated</div><div class="kpi-val red">${escalated}</div><div class="kpi-sub">SLA breached</div><div class="kpi-trend down">requires attention</div></div>
    <div class="kpi green"><div class="kpi-accent">✓</div><div class="kpi-label">SLA Compliance</div><div class="kpi-val green">${slaComp}%</div><div class="kpi-sub">target: 90%</div><div class="kpi-trend down">▼ –3% vs last week</div></div>
    <div class="kpi blue"><div class="kpi-accent">⊡</div><div class="kpi-label">MTTR</div><div class="kpi-val blue">${mttr}h</div><div class="kpi-sub">mean time to resolve</div><div class="kpi-trend up">▼ –0.4h improved</div></div>
  </div>
  <div class="grid2">
    <div class="panel">
      <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Open Tickets by Department</span><span class="panel-meta">ACTIVE</span></div>
      ${deptCounts.map(({d,count}) => `
        <div class="bar-row">
          <div class="bar-label"><span>${d}</span><span class="bar-count">${count}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/maxDept*100)}%;background:${DEPT_COLORS[d]}"></div></div>
        </div>`).join('')}
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--amber)"></span>Technician Workload</span><span class="panel-meta">ACTIVE TICKETS</span></div>
      ${techLoad.map(t => {
        const cls = t.count>=8 ? 'hi' : t.count>=6 ? 'warn' : '';
        return `<div class="wl-row">
          <div class="wl-avatar">${t.name.split(' ').map(w=>w[0]).join('')}</div>
          <span class="wl-name">${t.name}</span>
          <div class="wl-bar-wrap"><div class="wl-bar ${cls}" style="width:${Math.min(100,t.count*10)}%"></div></div>
          <span class="wl-count">${t.count}</span>
          <span class="wl-dept">${t.dept}</span>
        </div>`;}).join('')}
    </div>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--text3)"></span>Recent Tickets</span><span class="panel-meta">${TICKETS.length} TOTAL</span></div>
    ${ticketTable(TICKETS.slice(0,6))}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// TICKET TABLE (shared)
// ═══════════════════════════════════════════════════════════════════════
function ticketTable(list) {
  if (!list.length) return `<div class="empty-state"><div class="empty-state-icon">⊙</div><p style="font-size:12px">No tickets found</p></div>`;
  return `<table class="data-table">
    <thead><tr><th>ID</th><th>TITLE</th><th>CATEGORY</th><th>PRIORITY</th><th>STATUS</th><th>TECHNICIAN</th><th>SLA</th></tr></thead>
    <tbody>${list.map(t => {
      const slaColor = t.status==='Escalated' ? 'var(--red)' : t.status==='Resolved'||t.status==='Closed' ? 'var(--green)' : 'var(--amber)';
      return `<tr onclick="openTicket('${t.id}')">
        <td class="td-id">${t.id}</td>
        <td class="td-title">${t.title}</td>
        <td><span class="chip">${t.category}</span></td>
        <td><span class="pill ${t.priority}">${t.priority}</span></td>
        <td><span class="pill ${t.status}">${t.status}</span></td>
        <td style="color:var(--text2);font-size:11px">${t.technician || '<span style="color:var(--text3)">Unassigned</span>'}</td>
        <td style="font-family:var(--mono);font-size:9px;color:${slaColor}">${t.sla||'–'}</td>
      </tr>`;}).join('')}
    </tbody></table>`;
}

// ═══════════════════════════════════════════════════════════════════════
// TICKETS PAGE
// ═══════════════════════════════════════════════════════════════════════
function tickets() {
  const role = currentUser.role;
  let list = role==='student' ? TICKETS.filter(t=>t.complainant===currentUser.name)
           : role==='technician' ? TICKETS.filter(t=>t.technician===currentUser.name)
           : TICKETS;
  if (globalSearchTerm) list = list.filter(t =>
    t.id.toLowerCase().includes(globalSearchTerm) ||
    t.title.toLowerCase().includes(globalSearchTerm) ||
    t.category.toLowerCase().includes(globalSearchTerm) ||
    (t.technician||'').toLowerCase().includes(globalSearchTerm)
  );
  const STATES = ['Open','Assigned','InProgress','OnHold','Escalated','Resolved','Closed'];
  return `
  <div class="page-header">
    <h1 class="page-title">Ticket Queue</h1>
    <span class="page-tag">${list.length} TICKETS</span>
    <div class="page-actions">
      <select class="btn" id="filter-status" onchange="filterTickets()"><option value="">All Statuses</option>${STATES.map(s=>`<option>${s}</option>`).join('')}</select>
      <select class="btn" id="filter-cat" onchange="filterTickets()"><option value="">All Depts</option>${['Electrical','Plumbing','Network','Civil','Housekeeping'].map(c=>`<option>${c}</option>`).join('')}</select>
      <select class="btn" id="filter-pri" onchange="filterTickets()"><option value="">All Priorities</option>${['Critical','High','Medium','Low'].map(p=>`<option>${p}</option>`).join('')}</select>
    </div>
  </div>
  <div class="panel" style="margin-bottom:14px">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Ticket Lifecycle</span><span class="panel-meta">REQ-5</span></div>
    <div class="state-machine">${STATES.map((s,i)=>`${i>0?'<span class="state-arrow">→</span>':''}<div class="state-node">${s}</div>`).join('')}</div>
    <p style="font-size:10px;color:var(--text3);margin-top:8px">Only valid state transitions are enforced. Click any ticket row to view details and update status.</p>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--text3)"></span>All Tickets</span>${globalSearchTerm?`<span class="panel-meta">SEARCH: ${globalSearchTerm.toUpperCase()}</span>`:''}</div>
    <div id="ticket-table">${ticketTable(list)}</div>
  </div>`;
}

function attachTicketEvents() {
  window.filterTickets = () => {
    const status = document.getElementById('filter-status').value;
    const cat = document.getElementById('filter-cat').value;
    const pri = document.getElementById('filter-pri').value;
    const role = currentUser.role;
    let list = role==='student' ? TICKETS.filter(t=>t.complainant===currentUser.name)
             : role==='technician' ? TICKETS.filter(t=>t.technician===currentUser.name)
             : TICKETS;
    if (globalSearchTerm) list = list.filter(t=>t.title.toLowerCase().includes(globalSearchTerm)||t.id.toLowerCase().includes(globalSearchTerm));
    if (status) list = list.filter(t=>t.status===status);
    if (cat) list = list.filter(t=>t.category===cat);
    if (pri) list = list.filter(t=>t.priority===pri);
    document.getElementById('ticket-table').innerHTML = ticketTable(list);
  };
}

// ═══════════════════════════════════════════════════════════════════════
// TICKET DETAIL
// ═══════════════════════════════════════════════════════════════════════
window.openTicket = function(id) {
  const t = TICKETS.find(x=>x.id===id);
  if (!t) return;
  const history = TICKET_HISTORY[id] || [
    { from:null, to:'Open', by:t.complainant, time:t.submitted, note:'Complaint submitted' },
    t.technician ? { from:'Open', to:'Assigned', by:'SYSTEM', time:t.submitted, note:'Auto-assigned to '+t.technician } : null,
  ].filter(Boolean);
  const role = currentUser.role;
  const canUpdate = ['technician','supervisor','admin'].includes(role);
  const nextStates = VALID_TRANSITIONS[t.status] || [];
  const dotColor = { Resolved:'green', Escalated:'red', OnHold:'amber', InProgress:'purple' };
  const dotIcon = { Resolved:'✓', Escalated:'!', Open:'○', Assigned:'→' };

  const updateSection = canUpdate && nextStates.length > 0 ? `
    <div class="panel">
      <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Update Status</span><span class="panel-meta">REQ-10</span></div>
      <div class="form-row">
        <label class="form-label">Transition To</label>
        <select class="form-input" id="new-status">
          <option value="">Select next state…</option>
          ${nextStates.map(s=>`<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <label class="form-label">Progress Notes</label>
        <textarea class="form-input" id="update-notes" placeholder="Describe the work performed…"></textarea>
      </div>
      <button class="btn primary full" onclick="updateTicketStatus('${id}')">Update + Notify Complainant</button>
    </div>` : '';

  const reopenBtn = t.status==='Resolved' && role==='student' ? `
    <button class="btn" style="margin-top:12px;width:100%" onclick="reopenTicket('${id}')">↺ Reopen Ticket <span style="font-family:var(--mono);font-size:9px;color:var(--text3)">(48h window)</span></button>` : '';

  const ratingSection = t.status==='Closed' && role==='student' && !t.rating ? `
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <p style="font-size:11px;color:var(--text3);margin-bottom:8px;font-family:var(--mono)">RATE THIS RESOLUTION  ·  REQ-16</p>
      <div class="stars" id="stars-${id}">
        ${[1,2,3,4,5].map(n=>`<span class="star" onclick="rateTicket('${id}',${n})" onmouseover="hoverStars('${id}',${n})" onmouseout="resetStars('${id}')">★</span>`).join('')}
      </div>
    </div>` : t.rating ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><span style="color:var(--amber);font-size:14px">${'★'.repeat(t.rating)}<span style="color:var(--bg4)">${'★'.repeat(5-t.rating)}</span></span><span style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-left:8px">${t.rating}.0 / 5.0</span></div>` : '';

  document.getElementById('main-content').innerHTML = `
  <div class="page-header">
    <span class="td-id" style="font-size:14px">${t.id}</span>
    <h1 class="page-title" style="font-size:15px">${t.title}</h1>
    <div class="page-actions"><button class="btn" onclick="navigate('tickets')">← Back</button></div>
  </div>
  <div class="grid2" style="margin-bottom:14px">
    <div class="panel">
      <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Ticket Details</span></div>
      <table class="ticket-info-table">
        <tr><td>Status</td><td><span class="pill ${t.status}">${t.status}</span></td></tr>
        <tr><td>Priority</td><td><span class="pill ${t.priority}">${t.priority}</span></td></tr>
        <tr><td>Category</td><td><span class="chip">${t.category}</span></td></tr>
        <tr><td>Location</td><td>${t.location}</td></tr>
        <tr><td>Complainant</td><td>${t.complainant}</td></tr>
        <tr><td>Technician</td><td style="color:${t.technician?'var(--blue)':'var(--text3)'}">${t.technician||'Unassigned'}</td></tr>
        <tr><td>Submitted</td><td style="font-family:var(--mono);font-size:10px">${t.submitted}</td></tr>
        <tr><td>SLA Deadline</td><td style="font-family:var(--mono);font-size:10px;color:${t.status==='Escalated'?'var(--red)':'var(--amber)'}">${t.sla}</td></tr>
      </table>
      <div class="desc-box">${t.desc}</div>
      ${reopenBtn}
      ${ratingSection}
    </div>
    ${updateSection || '<div></div>'}
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--text3)"></span>Lifecycle Audit Trail</span><span class="panel-meta">REQ-15 · ${history.length} EVENTS</span></div>
    <div class="timeline">
      ${history.map(h => `
        <div class="tl-item">
          <div class="tl-dot ${dotColor[h.to]||''}">${dotIcon[h.to]||''}</div>
          <div class="tl-content">
            <div class="tl-action">${h.from?`<span class="pill ${h.from}">${h.from}</span> <span style="color:var(--text3)">→</span> <span class="pill ${h.to}">${h.to}</span>`:`<span class="pill ${h.to}">${h.to}</span>`}${h.note?` <span style="color:var(--text3);font-size:11px">— ${h.note}</span>`:''}</div>
            <div class="tl-meta">${h.by} · ${h.time}</div>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
};

window.updateTicketStatus = function(id) {
  const newStatus = document.getElementById('new-status').value;
  const notes = document.getElementById('update-notes').value;
  if (!newStatus) { showToast('Select a status first','error'); return; }
  const t = TICKETS.find(x=>x.id===id);
  const prev = t.status;
  t.status = newStatus;
  if (newStatus==='Resolved') t.technician = t.technician||currentUser.name;
  if (!TICKET_HISTORY[id]) TICKET_HISTORY[id] = [];
  TICKET_HISTORY[id].push({ from:prev, to:newStatus, by:currentUser.name, time:new Date().toLocaleString(), note:notes||'Status updated' });
  buildSidebar(); document.getElementById('nav-'+currentPage).classList.add('active');
  showToast(`Status → ${newStatus}`);
  openTicket(id);
};

window.reopenTicket = function(id) {
  const t = TICKETS.find(x=>x.id===id);
  const prev = t.status; t.status = 'Open';
  if (!TICKET_HISTORY[id]) TICKET_HISTORY[id] = [];
  TICKET_HISTORY[id].push({ from:prev, to:'Open', by:currentUser.name, time:new Date().toLocaleString(), note:'Reopened by complainant (REQ-11)' });
  showToast('Ticket reopened'); openTicket(id);
};

window.hoverStars = (id, n) => document.querySelectorAll(`#stars-${id} .star`).forEach((s,i)=>s.classList.toggle('filled',i<n));
window.resetStars = (id) => { const t=TICKETS.find(x=>x.id===id); document.querySelectorAll(`#stars-${id} .star`).forEach((s,i)=>s.classList.toggle('filled',i<(t.rating||0))); };
window.rateTicket = (id, rating) => { TICKETS.find(x=>x.id===id).rating=rating; showToast('Rating submitted — thank you!'); openTicket(id); };

// ═══════════════════════════════════════════════════════════════════════
// SUBMIT COMPLAINT
// ═══════════════════════════════════════════════════════════════════════
function submit() {
  return `
  <div class="page-header"><h1 class="page-title">Submit Complaint</h1><span class="page-tag">REQ-1 · REQ-2 · REQ-3</span></div>
  <div style="max-width:640px">
    <div id="submit-success" style="display:none">
      <div class="success-box">
        <p style="font-family:var(--mono);font-size:9px;color:var(--green);letter-spacing:.12em;margin-bottom:8px">✓ TICKET CREATED SUCCESSFULLY</p>
        <p id="success-title" style="font-size:14px;color:var(--text);font-weight:500;margin-bottom:10px"></p>
        <p id="success-details" style="font-size:11px;color:var(--text2);line-height:2"></p>
      </div>
      <div class="btn-group">
        <button class="btn primary" onclick="navigate('tickets')">View All Tickets →</button>
        <button class="btn" onclick="document.getElementById('submit-success').style.display='none';document.getElementById('submit-form').style.display='block'">Submit Another</button>
      </div>
    </div>
    <div id="submit-form">
      <div class="panel">
        <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Complaint Details</span></div>
        <div class="form-row"><label class="form-label">Title <span style="color:var(--red)">*</span></label><input class="form-input" id="s-title" placeholder="Brief summary of the issue"></div>
        <div class="form-grid">
          <div class="form-row">
            <label class="form-label">Category <span style="color:var(--red)">*</span></label>
            <select class="form-input" id="s-cat" onchange="previewPriority()">
              <option value="">Select category…</option>
              ${['Electrical','Plumbing','Network','Civil','Housekeeping'].map(c=>`<option>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-row"><label class="form-label">Location <span style="color:var(--red)">*</span></label><input class="form-input" id="s-loc" placeholder="e.g. Block A, Room 204"></div>
        </div>
        <div class="form-row"><label class="form-label">Description <span style="color:var(--red)">*</span></label><textarea class="form-input" id="s-desc" style="min-height:100px" placeholder="Describe the issue in detail. Specific keywords like 'power failure' or 'complete outage' trigger higher priority classification." oninput="previewPriority()"></textarea></div>
        <div id="priority-preview" style="display:none" class="priority-preview">
          <div><p style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:5px">AUTO-CLASSIFIED  ·  REQ-2</p><span id="prev-pill"></span></div>
          <div><p style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:5px">SLA DEADLINE  ·  REQ-6</p><span id="prev-sla" style="font-family:var(--mono);font-size:12px;color:var(--amber)"></span></div>
          <div><p style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:5px">ROUTED TO  ·  REQ-3</p><span id="prev-dept" style="font-family:var(--mono);font-size:12px;color:var(--blue)"></span></div>
        </div>
        <button class="btn primary full" onclick="doSubmit()">Submit Complaint →</button>
      </div>
    </div>
  </div>`;
}

function attachSubmitEvents() {
  window.previewPriority = () => {
    const cat = document.getElementById('s-cat').value;
    const desc = document.getElementById('s-desc').value;
    if (!cat) { document.getElementById('priority-preview').style.display='none'; return; }
    const p = classifyPriority(cat, desc);
    document.getElementById('prev-pill').innerHTML = `<span class="pill ${p}">${p}</span>`;
    document.getElementById('prev-sla').textContent = 'Max ' + SLA_MAP[p];
    document.getElementById('prev-dept').textContent = cat + ' Dept.';
    document.getElementById('priority-preview').style.display = 'flex';
  };
  window.doSubmit = () => {
    const title = document.getElementById('s-title').value.trim();
    const cat = document.getElementById('s-cat').value;
    const loc = document.getElementById('s-loc').value.trim();
    const desc = document.getElementById('s-desc').value.trim();
    if (!title||!cat||!loc||!desc) { showToast('Please fill in all required fields','error'); return; }
    const priority = classifyPriority(cat, desc);
    const id = 'TK-' + String(TICKETS.length+1).padStart(4,'0');
    const techs = { Electrical:'Rajesh Kumar', Network:'Dev Joshi', Plumbing:'Amit Verma', Civil:'Sunita Rao', Housekeeping:'Sunita Rao' };
    const newT = { id, title, category:cat, priority, status:'Assigned', location:loc, complainant:currentUser.name, technician:techs[cat]||null, submitted:new Date().toLocaleString(), sla:'Within '+SLA_MAP[priority], desc, rating:null };
    TICKETS.unshift(newT);
    TICKET_HISTORY[id] = [
      { from:null, to:'Open', by:currentUser.name, time:new Date().toLocaleString(), note:'Complaint submitted' },
      { from:'Open', to:'Assigned', by:'SYSTEM', time:new Date().toLocaleString(), note:'Auto-assigned to '+(techs[cat]||'queue')+' (REQ-4)' },
    ];
    document.getElementById('submit-form').style.display = 'none';
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-details').innerHTML = `Ticket ID: <span style="font-family:var(--mono);color:var(--blue)">${id}</span> &nbsp;·&nbsp; Priority: <span class="pill ${priority}">${priority}</span> &nbsp;·&nbsp; Assigned: <span style="color:var(--blue)">${techs[cat]||'Queue'}</span> &nbsp;·&nbsp; SLA: <span style="color:var(--amber)">${SLA_MAP[priority]}</span>`;
    document.getElementById('submit-success').style.display = 'block';
    buildSidebar(); navigate_silent_sidebar();
    showToast(`✓ Ticket ${id} created and assigned`);
  };
}
function navigate_silent_sidebar() { const el=document.getElementById('nav-submit'); if(el)el.classList.add('active'); }

// ═══════════════════════════════════════════════════════════════════════
// ASSETS
// ═══════════════════════════════════════════════════════════════════════
function assets() {
  const data = [
    { id:'A-001', name:'Generator Block-A',     cat:'Electrical', loc:'Block A',   interval:30, last:'2026-04-06', next:'2026-05-06', status:'due' },
    { id:'A-002', name:'Main UPS – Server Room', cat:'Electrical', loc:'Server Rm', interval:90, last:'2026-03-15', next:'2026-06-15', status:'ok' },
    { id:'A-003', name:'HVAC Central Unit',      cat:'Civil',      loc:'Admin Block',interval:90,last:'2026-04-20', next:'2026-07-20', status:'ok' },
    { id:'A-004', name:'Water Pump Block-B',     cat:'Plumbing',   loc:'Block B',   interval:35, last:'2026-04-01', next:'2026-05-01', status:'overdue' },
    { id:'A-005', name:'Network Core Switch',    cat:'Network',    loc:'Server Rm', interval:90, last:'2026-04-25', next:'2026-07-25', status:'ok' },
    { id:'A-006', name:'Lift Motor – Block D',   cat:'Civil',      loc:'Block D',   interval:60, last:'2026-04-10', next:'2026-06-09', status:'ok' },
  ];
  const sp = { ok:`<span class="pill Resolved">OK</span>`, due:`<span class="pill High">DUE</span>`, overdue:`<span class="pill Escalated">OVERDUE</span>` };
  const catColor = { Electrical:'blue', Network:'purple', Plumbing:'green', Civil:'amber', Housekeeping:'red' };
  return `
  <div class="page-header">
    <h1 class="page-title">Asset Registry</h1>
    <span class="page-tag">REQ-13 · REQ-18</span>
    <div class="page-actions"><button class="btn primary">+ Register Asset</button></div>
  </div>
  <div class="kpi-grid c3" style="margin-bottom:18px">
    <div class="kpi green"><div class="kpi-label">Healthy Assets</div><div class="kpi-val green">${data.filter(a=>a.status==='ok').length}</div><div class="kpi-sub">no action needed</div></div>
    <div class="kpi amber"><div class="kpi-label">Maintenance Due</div><div class="kpi-val amber">${data.filter(a=>a.status==='due').length}</div><div class="kpi-sub">schedule this week</div></div>
    <div class="kpi red"><div class="kpi-label">Overdue</div><div class="kpi-val red">${data.filter(a=>a.status==='overdue').length}</div><div class="kpi-sub">act immediately</div></div>
  </div>
  <div class="asset-grid">
    ${data.map(a=>`
      <div class="asset-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <span style="font-family:var(--mono);font-size:9px;color:var(--text3)">${a.id}</span>${sp[a.status]}
        </div>
        <div style="font-size:12px;font-weight:500;color:var(--text);margin-bottom:4px">${a.name}</div>
        <div style="display:flex;gap:6px;margin-bottom:10px"><span class="chip ${catColor[a.cat]||''}">${a.cat}</span><span class="chip">${a.loc}</span></div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text3)">Next: <span style="color:${a.status==='overdue'?'var(--red)':a.status==='due'?'var(--amber)':'var(--green)'}">${a.next}</span> · every ${a.interval}d</div>
      </div>`).join('')}
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--text3)"></span>Full Registry</span><span class="panel-meta">${data.length} ASSETS</span></div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>NAME</th><th>CATEGORY</th><th>LOCATION</th><th>INTERVAL</th><th>LAST MAINT.</th><th>NEXT MAINT.</th><th>STATUS</th></tr></thead>
      <tbody>${data.map(a=>`
        <tr>
          <td class="td-id">${a.id}</td>
          <td style="color:var(--text);font-weight:500">${a.name}</td>
          <td><span class="chip ${catColor[a.cat]||''}">${a.cat}</span></td>
          <td>${a.loc}</td>
          <td style="font-family:var(--mono)">${a.interval}d</td>
          <td style="font-family:var(--mono);font-size:10px">${a.last}</td>
          <td style="font-family:var(--mono);font-size:10px">${a.next}</td>
          <td>${sp[a.status]}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════
function requirements() {
  const REQS = [
    ['REQ-1','H','Web-based complaint submission: category, location, description, optional photo attachment.'],
    ['REQ-2','H','Auto-classify complaints by category and assign priority level (Critical/High/Medium/Low).'],
    ['REQ-3','H','Route each complaint to the appropriate department queue based on its category.'],
    ['REQ-4','H','Auto-assign to technician with fewest active tickets in the department (load balancing).'],
    ['REQ-5','H','Enforce ticket lifecycle: Open → Assigned → InProgress → OnHold → Escalated → Resolved → Closed.'],
    ['REQ-6','H','SLA deadlines: Critical=4h, High=12h, Medium=48h, Low=7 days.'],
    ['REQ-7','H','Auto-escalate SLA-breached tickets via cron job every 15 minutes.'],
    ['REQ-8','H','Email and in-app notifications via Socket.io on every state transition.'],
    ['REQ-9','H','Role-based dashboards for Student, Technician, Supervisor, Admin via JWT RBAC.'],
    ['REQ-10','H','Technicians update status, add progress notes, upload completion evidence.'],
    ['REQ-11','M','Complainants may reopen resolved tickets within a 48-hour window.'],
    ['REQ-12','M','Admin KPI dashboard: open tickets, MTTR, SLA compliance rate, technician utilisation.'],
    ['REQ-13','M','Preventive maintenance schedule with configurable intervals per registered campus asset.'],
    ['REQ-14','M','Export complaint history and SLA reports in CSV/JSON format.'],
    ['REQ-15','M','Full immutable audit log of all state transitions with timestamps.'],
    ['REQ-16','L','1–5 star satisfaction rating after ticket closure.'],
    ['REQ-20','H','Security: bcrypt password hashing, JWT authentication on all API endpoints.'],
    ['REQ-24','M','MVC architecture with ≥80% unit test coverage (Jest + Supertest).'],
    ['REQ-25','M','ACID-compliant PostgreSQL transactions with enforced foreign-key constraints.'],
  ];
  const pc = { H:'<span class="pill Critical">HIGH</span>', M:'<span class="pill Medium">MEDIUM</span>', L:'<span class="pill Low">LOW</span>' };
  return `
  <div class="page-header">
    <h1 class="page-title">Software Requirements</h1>
    <span class="page-tag">IEEE 830 · ${REQS.length} REQUIREMENTS</span>
  </div>
  <div class="kpi-grid c3" style="margin-bottom:18px">
    <div class="kpi red"><div class="kpi-label">High Priority</div><div class="kpi-val red">${REQS.filter(r=>r[1]==='H').length}</div></div>
    <div class="kpi blue"><div class="kpi-label">Medium Priority</div><div class="kpi-val blue">${REQS.filter(r=>r[1]==='M').length}</div></div>
    <div class="kpi"><div class="kpi-label">Low Priority</div><div class="kpi-val">${REQS.filter(r=>r[1]==='L').length}</div></div>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>All Requirements</span><span class="panel-meta">SRS</span></div>
    <table class="data-table">
      <thead><tr><th>REQ-ID</th><th>PRIORITY</th><th>DESCRIPTION</th></tr></thead>
      <tbody>${REQS.map(([id,p,desc])=>`
        <tr class="${p==='H'?'req-row-h':''}">
          <td class="td-id">${id}</td>
          <td>${pc[p]}</td>
          <td style="font-size:11px;color:var(--text2);line-height:1.6">${desc}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════
function architecture() {
  const STACK = [
    { label:'PRESENTATION',   color:'var(--blue)',   items:[{t:'ReactJS',c:'blue'},{t:'Tailwind CSS',c:'blue'},{t:'Chart.js',c:'blue'},{t:'Student Portal'},{t:'Admin Dashboard'},{t:'Tech Panel'}], req:'REQ-9,23' },
    { label:'BUSINESS LOGIC', color:'var(--green)',  items:[{t:'Node.js',c:'green'},{t:'Express.js',c:'green'},{t:'SLA Engine'},{t:'DeptRouter'},{t:'PM Scheduler'},{t:'NotificationSvc'}], req:'REQ-2–7' },
    { label:'DATA',           color:'var(--amber)',  items:[{t:'PostgreSQL',c:'amber'},{t:'users'},{t:'complaints'},{t:'ticket_history'},{t:'assets'},{t:'sla_policies'}], req:'REQ-25' },
    { label:'AUTH / SECURITY',color:'var(--purple)', items:[{t:'JWT',c:'purple'},{t:'bcryptjs',c:'purple'},{t:'Role Guards'},{t:'RBAC Middleware'},{t:'AuthMiddleware'}], req:'REQ-20' },
    { label:'INFRA',          color:'var(--text2)',  items:[{t:'Docker'},{t:'Nginx'},{t:'node-cron'},{t:'Socket.io'},{t:'Nodemailer'}], req:'REQ-21,24' },
  ];
  const SEQ = [
    ['Student fills complaint form & submits','User interaction'],
    ['Browser POST /api/complaints (JSON payload)','HTTP'],
    ['API validates JWT token via AuthMiddleware','Auth · REQ-20'],
    ['ComplaintService.createComplaint() called','Service Layer'],
    ['PriorityClassifier.classify(category, description)','REQ-2'],
    ['SLAEngine.calculateDeadline(priority) → timestamp','REQ-6'],
    ['DB INSERT complaint — status = Open','PostgreSQL'],
    ['DepartmentRouter.route(category) → departmentId','REQ-3'],
    ['SELECT technician WHERE MIN(activeTicketCount)','REQ-4'],
    ['UPDATE complaint SET assignedTo, status = Assigned','PostgreSQL'],
    ['NotificationService.sendNotification() dispatched','REQ-8'],
    ['201 Created — ticketId + slaDeadline returned to client','Response'],
  ];
  return `
  <div class="page-header"><h1 class="page-title">System Architecture</h1><span class="page-tag">THREE-TIER MVC</span></div>
  <div class="panel" style="margin-bottom:14px">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Technology Stack</span><span class="panel-meta">REQ-24</span></div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${STACK.map(layer=>`
        <div class="arch-layer" style="border-left:3px solid ${layer.color}">
          <span class="arch-layer-label">${layer.label}</span>
          <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1">${layer.items.map(i=>`<span class="chip ${i.c||''}">${i.t}</span>`).join('')}</div>
          <span style="font-family:var(--mono);font-size:9px;color:var(--text3);border:1px solid var(--border);padding:2px 6px;border-radius:3px">${layer.req}</span>
        </div>`).join('')}
    </div>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--green)"></span>Sequence: Complaint Submission + Auto-Assignment</span><span class="panel-meta">REQ-1,4</span></div>
    <div style="display:flex;flex-direction:column">
      ${SEQ.map(([text,tag],i)=>`
        <div class="seq-item">
          <span class="seq-num">${String(i+1).padStart(2,'0')}</span>
          <span class="seq-text">${text}</span>
          <span style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-left:auto;white-space:nowrap">${tag}</span>
        </div>`).join('')}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════
function users() {
  const list = [
    { name:'Dr. Admin',    email:'admin@scoms.edu',   role:'admin',      dept:'Administration', tickets:'N/A', since:'2024-01-15' },
    { name:'K. Sharma',    email:'super@scoms.edu',   role:'supervisor', dept:'Electrical',     tickets:'N/A', since:'2024-02-01' },
    { name:'Rajesh Kumar', email:'tech@scoms.edu',    role:'technician', dept:'Electrical',     tickets:'5',   since:'2024-03-10' },
    { name:'Dev Joshi',    email:'dev@scoms.edu',     role:'technician', dept:'Network',        tickets:'9',   since:'2024-03-10' },
    { name:'Sunita Rao',   email:'sunita@scoms.edu',  role:'technician', dept:'Civil',          tickets:'2',   since:'2024-04-05' },
    { name:'Amit Verma',   email:'amit@scoms.edu',    role:'technician', dept:'Plumbing',       tickets:'3',   since:'2024-04-05' },
    { name:'Aarav Singh',  email:'student@scoms.edu', role:'student',    dept:'CSE',            tickets:'2',   since:'2025-07-20' },
  ];
  const roleColor = { admin:'red', supervisor:'amber', technician:'green', student:'purple' };
  return `
  <div class="page-header">
    <h1 class="page-title">User Management</h1>
    <span class="page-tag">RBAC · REQ-9</span>
    <div class="page-actions"><button class="btn primary">+ Add User</button></div>
  </div>
  <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px">
    ${['admin','supervisor','technician','student'].map(r=>{
      const c = roleColor[r]; const cnt = list.filter(u=>u.role===r).length;
      return `<div class="kpi ${c}"><div class="kpi-label">${r.toUpperCase()}S</div><div class="kpi-val ${c}">${cnt}</div></div>`;
    }).join('')}
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Registered Users</span><span class="panel-meta">${list.length} USERS</span></div>
    <table class="data-table">
      <thead><tr><th></th><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>DEPARTMENT</th><th>ACTIVE TICKETS</th><th>MEMBER SINCE</th></tr></thead>
      <tbody>${list.map(u=>`
        <tr>
          <td style="width:36px"><div style="width:28px;height:28px;border-radius:50%;background:var(--bg4);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:9px;color:var(--text2)">${u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div></td>
          <td style="color:var(--text);font-weight:500">${u.name}</td>
          <td style="font-family:var(--mono);font-size:10px;color:var(--blue)">${u.email}</td>
          <td><span class="role-badge ${u.role}">${u.role.toUpperCase()}</span></td>
          <td>${u.dept}</td>
          <td style="font-family:var(--mono);text-align:center">${u.tickets}</td>
          <td style="font-family:var(--mono);font-size:10px;color:var(--text3)">${u.since}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════
function report() {
  return `
  <div class="page-header">
    <h1 class="page-title">Reports & Exports</h1>
    <span class="page-tag">REQ-14</span>
  </div>
  <div class="grid2">
    <div class="panel">
      <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--blue)"></span>Export Options</span></div>
      <div class="form-grid" style="margin-bottom:16px">
        <div class="form-row"><label class="form-label">From Date</label><input class="form-input" type="date" id="rep-from"></div>
        <div class="form-row"><label class="form-label">To Date</label><input class="form-input" type="date" id="rep-to"></div>
      </div>
      <div class="form-row">
        <label class="form-label">Report Type</label>
        <select class="form-input" id="rep-type">
          <option>Complaint History</option>
          <option>SLA Compliance</option>
          <option>Technician Performance</option>
        </select>
      </div>
      <div class="btn-group">
        <button class="btn primary" onclick="exportCSV()">↓ Download CSV</button>
        <button class="btn" onclick="exportJSON()">↓ Download JSON</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--green)"></span>Summary Stats</span></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${[
          ['Total Tickets', TICKETS.length, 'var(--text)'],
          ['Escalated', TICKETS.filter(t=>t.status==='Escalated').length, 'var(--red)'],
          ['Resolved / Closed', TICKETS.filter(t=>['Resolved','Closed'].includes(t.status)).length, 'var(--green)'],
          ['SLA Compliance', '82%', 'var(--green)'],
          ['Avg. MTTR', '6.3 hrs', 'var(--blue)'],
        ].map(([l,v,c])=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:12px;color:var(--text2)">${l}</span>
            <span style="font-family:var(--mono);font-size:13px;color:${c};font-weight:500">${v}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title"><span class="panel-title-dot" style="background:var(--text3)"></span>Complaint Report</span><span class="panel-meta">ALL TICKETS</span></div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>TITLE</th><th>CATEGORY</th><th>PRIORITY</th><th>STATUS</th><th>SLA</th><th>COMPLAINANT</th></tr></thead>
      <tbody>${TICKETS.map(t=>`
        <tr onclick="openTicket('${t.id}')">
          <td class="td-id">${t.id}</td>
          <td class="td-title">${t.title}</td>
          <td><span class="chip">${t.category}</span></td>
          <td><span class="pill ${t.priority}">${t.priority}</span></td>
          <td><span class="pill ${t.status}">${t.status}</span></td>
          <td><span class="pill ${t.status==='Escalated'?'Escalated':'Resolved'}">${t.status==='Escalated'?'Breached':'Met'}</span></td>
          <td style="font-size:11px">${t.complainant}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

window.exportCSV = () => {
  const rows = TICKETS.map(t=>`${t.id},"${t.title}",${t.category},${t.priority},${t.status},"${t.complainant}","${t.technician||''}","${t.submitted}"`);
  const blob = new Blob(['ID,Title,Category,Priority,Status,Complainant,Technician,Submitted\n'+rows.join('\n')], {type:'text/csv'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='scoms-report.csv'; a.click();
  showToast('CSV downloaded');
};
window.exportJSON = () => {
  const blob = new Blob([JSON.stringify(TICKETS,null,2)], {type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='scoms-report.json'; a.click();
  showToast('JSON downloaded');
};
