/* ============================================================
   IMS ERP V5.1 - FIREBASE CLOUD EDITION (NO-SERVER)
   All Features Preserved | Realtime Sync | No CORS Error
   ============================================================ */

/* ----------------------------------------------------
   1. FIREBASE CONFIGURATION & INITIALIZATION
   ---------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyDWO_T0iL8K-CaF8haK0MYkdyOzpTR2CVo",
  authDomain: "taqwa-7ddf2.firebaseapp.com",
  databaseURL: "https://taqwa-7ddf2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "taqwa-7ddf2",
  storageBucket: "taqwa-7ddf2.firebasestorage.app",
  messagingSenderId: "1053737405036",
  appId: "1:1053737405036:web:c9837bbd0ea0e9be612649",
  measurementId: "G-6MZ4Z431MP"
};

// Initialize Firebase (Compat Mode for Browser)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const dbRef = firebase.database().ref('IMS_DATA_V5_ULTRA');

/* ----------------------------------------------------
   2. GLOBAL VARIABLES & STATE
   ---------------------------------------------------- */
let currentUser = null;
let currentRole = null; // 'admin' or 'member'
let currentPage = 'dashboard';
let db = {
  admins: [{ id: "ADM-001", name: "Super Admin", pass: "admin123", role: "SUPER" }],
  members: [{ id: "FM-001", name: "Demo Member", pass: "1234", status: "ACTIVE", phone: "01700000000", address: "Dhaka", joinedAt: new Date().toISOString() }],
  investments: [],
  expenses: [],
  notices: [],
  activityLogs: [],
  settings: { companyName: "Taqwa Invest", currency: "BDT" }
};

/* ----------------------------------------------------
   3. DATA SYNC ENGINE (Replaces LocalStorage)
   ---------------------------------------------------- */
// Load data from Cloud on startup
function initApp() {
  const loading = document.getElementById('loadingOverlay');
  if(loading) loading.style.display = 'flex';

  dbRef.on('value', (snapshot) => {
    const cloudData = snapshot.val();
    
    if (cloudData) {
      db = cloudData; // Sync local state with cloud
      console.log("🔥 Data Synced from Firebase");
    } else {
      // First time run: Upload default DB
      saveDB(db); 
    }

    if(loading) loading.style.display = 'none';
    
    // Refresh current view if user is logged in
    if (currentUser) {
      go(currentPage);
    }
  }, (error) => {
    toast("Network Error", error.message);
    if(loading) loading.style.display = 'none';
  });
}

// Function to get data (Sync replacement)
function ensureDB() {
  return db;
}

// Function to save data (Sync replacement)
function saveDB(updatedDB) {
  db = updatedDB; // Update local immediately (Optimistic UI)
  
  // Send to Cloud in background
  dbRef.set(updatedDB).then(() => {
    // Optional: console.log("Cloud Saved");
  }).catch(err => {
    toast("Sync Error", "Could not save to cloud: " + err.message);
  });
}

// Logger Function
function logActivity(action, details) {
  const newLog = {
    at: new Date().toISOString(),
    action: action,
    details: details,
    byId: currentUser ? currentUser.id : "GUEST",
    byRole: currentRole || "N/A"
  };
  
  // Keep last 500 logs only
  if(!db.activityLogs) db.activityLogs = [];
  db.activityLogs.unshift(newLog);
  if(db.activityLogs.length > 500) db.activityLogs.pop();
  
  saveDB(db);
}

/* ----------------------------------------------------
   4. EVENT LISTENERS & DOM
   ---------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Login Tabs
  document.getElementById('tabAdmin').addEventListener('click', () => switchTab('admin'));
  document.getElementById('tabMember').addEventListener('click', () => switchTab('member'));
  
  // Buttons
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Modals Close
  document.querySelectorAll('.closeX, .closeBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modalWrap').forEach(m => m.style.display = 'none');
    });
  });
});

/* ----------------------------------------------------
   5. AUTHENTICATION LOGIC
   ---------------------------------------------------- */
let loginMode = 'admin';

function switchTab(mode) {
  loginMode = mode;
  document.getElementById('tabAdmin').className = mode === 'admin' ? 'tabBtn active' : 'tabBtn';
  document.getElementById('tabMember').className = mode === 'member' ? 'tabBtn active' : 'tabBtn';
}

function doLogin() {
  const id = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value.trim();

  if (!id || !pass) return toast("Error", "Please enter ID and Password");

  let user;
  if (loginMode === 'admin') {
    user = db.admins.find(u => u.id === id && u.pass === pass);
    currentRole = 'admin';
  } else {
    user = db.members.find(u => u.id === id && u.pass === pass);
    currentRole = 'member';
  }

  if (user) {
    currentUser = user;
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'flex';
    
    // UI Setup
    document.getElementById('userNameDisplay').innerText = user.name;
    document.getElementById('userRoleBadge').innerText = currentRole.toUpperCase();
    
    renderSidebar();
    
    if (currentRole === 'admin') {
      go('dashboard');
      logActivity("Admin Login", `Admin ${user.id} logged in`);
    } else {
      go('member_dash');
      logActivity("Member Login", `Member ${user.id} logged in`);
    }
    
    toast("Welcome", "Login Successful");
  } else {
    toast("Login Failed", "Invalid Credentials");
  }
}

function logout() {
  if(currentUser) logActivity("Logout", `${currentUser.id} logged out`);
  currentUser = null;
  currentRole = null;
  location.reload();
}

/* ----------------------------------------------------
   6. NAVIGATION & SIDEBAR
   ---------------------------------------------------- */
function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  let html = '';
  
  if (currentRole === 'admin') {
    html = `
      <button onclick="go('dashboard')" class="navItem">📊 Dashboard</button>
      <button onclick="go('admin_members')" class="navItem">👥 Members</button>
      <button onclick="go('admin_investments')" class="navItem">💰 Investments</button>
      <button onclick="go('admin_expenses')" class="navItem">💸 Expenses</button>
      <button onclick="go('admin_reports')" class="navItem">📑 Reports</button>
      <button onclick="go('admin_logs')" class="navItem">🛡 Activity Logs</button>
      <button onclick="go('company_info')" class="navItem">🏢 Mission & Vision</button>
    `;
  } else {
    html = `
      <button onclick="go('member_dash')" class="navItem">🏠 My Dashboard</button>
      <button onclick="go('member_profile')" class="navItem">👤 My Profile</button>
      <button onclick="go('member_history')" class="navItem">📜 History</button>
      <button onclick="go('company_info')" class="navItem">🏢 Company Info</button>
    `;
  }
  nav.innerHTML = html;
}

window.go = function(page) {
  currentPage = page;
  const content = document.getElementById('pageContent');
  const title = document.getElementById('pageTitle');
  
  title.innerText = page.replace('_', ' ').toUpperCase();
  
  // Reset content
  content.innerHTML = '';

  // Routing
  if (page === 'dashboard') renderDashboard();
  if (page === 'admin_members') renderAdminMembers();
  if (page === 'admin_investments') renderAdminInvestments();
  if (page === 'admin_expenses') renderAdminExpenses();
  if (page === 'admin_reports') renderReports();
  if (page === 'admin_logs') renderLogs();
  
  if (page === 'member_dash') renderMemberDash();
  if (page === 'member_profile') renderMemberProfile();
  if (page === 'company_info') renderCompanyInfo();
};

/* ----------------------------------------------------
   7. DASHBOARD & ANALYTICS
   ---------------------------------------------------- */
function renderDashboard() {
  const mCount = db.members.length;
  const totalInv = db.investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExp = db.expenses.reduce((sum, i) => sum + Number(i.amount), 0);
  const netBalance = totalInv - totalExp;

  const html = `
    <div class="grid-3 fade-in">
      <div class="card">
        <h3>Total Capital</h3>
        <div class="bigNum" style="color:#22c55e">${totalInv.toLocaleString()} ৳</div>
        <p>Total Investments Collected</p>
      </div>
      <div class="card">
        <h3>Total Expenses</h3>
        <div class="bigNum" style="color:#ef4444">${totalExp.toLocaleString()} ৳</div>
        <p>Operational Costs</p>
      </div>
      <div class="card">
        <h3>Net Balance</h3>
        <div class="bigNum" style="color:#3b82f6">${netBalance.toLocaleString()} ৳</div>
        <p>Available Funds</p>
      </div>
      <div class="card">
        <h3>Total Members</h3>
        <div class="bigNum">${mCount}</div>
      </div>
    </div>

    <div class="panel" style="margin-top:20px">
      <div class="panelHeader"><h3>Recent Activities</h3></div>
      <table class="table">
        <tr><th>Time</th><th>Action</th><th>Details</th></tr>
        ${db.activityLogs.slice(0, 5).map(l => `
          <tr>
            <td>${new Date(l.at).toLocaleTimeString()}</td>
            <td>${l.action}</td>
            <td>${l.details}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
  document.getElementById('pageContent').innerHTML = html;
}

/* ----------------------------------------------------
   8. MEMBER MANAGEMENT
   ---------------------------------------------------- */
function renderAdminMembers() {
  const html = `
    <div class="panel fade-in">
      <div class="panelHeader">
        <h3>All Members</h3>
        <button class="btn btn-primary" onclick="addMemberPrompt()">+ New Member</button>
      </div>
      <table class="table">
        <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${db.members.map(m => `
            <tr>
              <td>${m.id}</td>
              <td><b>${m.name}</b></td>
              <td>${m.phone}</td>
              <td><span class="badge ${m.status==='ACTIVE'?'bg-success':'bg-danger'}">${m.status}</span></td>
              <td>
                <button onclick="deleteMember('${m.id}')" class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('pageContent').innerHTML = html;
}

window.addMemberPrompt = function() {
  const name = prompt("Member Name:");
  const phone = prompt("Phone Number:");
  if(name && phone) {
    const newId = "FM-" + String(db.members.length + 1).padStart(3, '0');
    db.members.push({
      id: newId,
      name: name,
      phone: phone,
      pass: "1234",
      status: "ACTIVE",
      joinedAt: new Date().toISOString()
    });
    saveDB(db);
    logActivity("Add Member", `Added new member ${newId}`);
    renderAdminMembers();
    toast("Success", "Member Added Successfully");
  }
};

window.deleteMember = function(id) {
  if(confirm("Are you sure? This will remove all data for this member!")) {
    db.members = db.members.filter(m => m.id !== id);
    saveDB(db);
    logActivity("Delete Member", `Deleted member ${id}`);
    renderAdminMembers();
  }
};

/* ----------------------------------------------------
   9. INVESTMENT SYSTEM
   ---------------------------------------------------- */
function renderAdminInvestments() {
  const html = `
    <div class="panel fade-in">
      <div class="panelHeader">
        <h3>Investment Records</h3>
        <button class="btn btn-primary" onclick="addInvestmentPrompt()">+ Add Investment</button>
      </div>
      <table class="table">
        <thead><tr><th>MR ID</th><th>Member</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          ${db.investments.map(i => `
            <tr>
              <td>${i.mrId}</td>
              <td>${i.memberName} (${i.memberId})</td>
              <td>${Number(i.amount).toLocaleString()} ৳</td>
              <td>${new Date(i.date).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('pageContent').innerHTML = html;
}

window.addInvestmentPrompt = function() {
  const id = prompt("Enter Member ID (e.g. FM-001):");
  const member = db.members.find(m => m.id === id);
  
  if(!member) return toast("Error", "Member not found!");
  
  const amount = prompt("Enter Investment Amount:");
  if(amount) {
    const mrId = "MR-" + Date.now().toString().slice(-6);
    db.investments.push({
      id: Date.now(),
      mrId: mrId,
      memberId: member.id,
      memberName: member.name,
      amount: Number(amount),
      date: new Date().toISOString()
    });
    saveDB(db);
    logActivity("Investment", `Received ${amount} from ${member.id}`);
    renderAdminInvestments();
    toast("Success", `Investment Added. MR ID: ${mrId}`);
  }
};

/* ----------------------------------------------------
   10. EXPENSE SYSTEM
   ---------------------------------------------------- */
function renderAdminExpenses() {
  const html = `
    <div class="panel fade-in">
      <div class="panelHeader">
        <h3>Expense Vouchers</h3>
        <button class="btn btn-danger" onclick="addExpensePrompt()">+ New Expense</button>
      </div>
      <table class="table">
        <thead><tr><th>Voucher ID</th><th>Details</th><th>Amount</th><th>By</th></tr></thead>
        <tbody>
          ${db.expenses.map(e => `
            <tr>
              <td>${e.voucherId}</td>
              <td>${e.reason}</td>
              <td>${Number(e.amount).toLocaleString()} ৳</td>
              <td>${e.by}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('pageContent').innerHTML = html;
}

window.addExpensePrompt = function() {
  const reason = prompt("Expense Reason:");
  const amount = prompt("Amount:");
  if(reason && amount) {
    const vId = "V-" + Date.now().toString().slice(-6);
    db.expenses.push({
      voucherId: vId,
      reason: reason,
      amount: Number(amount),
      date: new Date().toISOString(),
      by: currentUser.name
    });
    saveDB(db);
    logActivity("Expense", `Expense of ${amount} for ${reason}`);
    renderAdminExpenses();
  }
};

/* ----------------------------------------------------
   11. ACTIVITY LOGS (Admin Only)
   ---------------------------------------------------- */
function renderLogs() {
  const html = `
    <div class="panel fade-in">
      <div class="panelHeader">
        <h3>System Activity Logs</h3>
        <button class="btn btn-danger" onclick="clearLogs()">Clear Logs</button>
      </div>
      <table class="table">
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
        <tbody>
          ${db.activityLogs.map(l => `
            <tr>
              <td>${new Date(l.at).toLocaleString()}</td>
              <td>${l.byId} (${l.byRole})</td>
              <td><b>${l.action}</b></td>
              <td>${l.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('pageContent').innerHTML = html;
}

window.clearLogs = function() {
  if(confirm("Clear all system logs? This cannot be undone.")) {
    db.activityLogs = [];
    saveDB(db);
    renderLogs();
    toast("Cleared", "All logs have been erased.");
  }
};

/* ----------------------------------------------------
   12. MISSION & VISION
   ---------------------------------------------------- */
function renderCompanyInfo() {
  const html = `
    <div class="panel fade-in" style="max-width:800px; margin:0 auto;">
      <div class="panelHeader">
        <h2>Company Vision & Mission</h2>
      </div>
      <div style="padding:20px; line-height:1.8;">
        <h3 style="color:#22c55e">Our Vision</h3>
        <p>To become the leading investment management company in the region, providing innovative financial solutions and creating sustainable value.</p>
        
        <h3 style="color:#3b82f6; margin-top:20px">Our Mission</h3>
        <ul>
          <li>Provide secure and profitable investment opportunities.</li>
          <li>Maintain 100% transparency in all transactions.</li>
          <li>Ensure timely profit distribution.</li>
        </ul>
        
        <h3 style="color:#f59e0b; margin-top:20px">Core Values</h3>
        <p>Transparency, Integrity, Innovation, and Responsibility.</p>
      </div>
    </div>
  `;
  document.getElementById('pageContent').innerHTML = html;
}

/* ----------------------------------------------------
   13. UTILITIES (Toast, etc.)
   ---------------------------------------------------- */
function toast(title, msg) {
  const container = document.getElementById('toastWrap');
  if(!container) return;
  
  const t = document.createElement('div');
  t.className = 'toast show';
  t.innerHTML = `<b>${title}</b><p>${msg}</p>`;
  container.appendChild(t);
  
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}
