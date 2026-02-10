// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChoKGQzwMlLTw3d__sk3amo6Nh8RMGCX4",
  authDomain: "taqwa-property-bd.firebaseapp.com",
  databaseURL: "https://taqwa-property-bd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "taqwa-property-bd",
  storageBucket: "taqwa-property-bd.firebasestorage.app",
  messagingSenderId: "266724049111",
  appId: "1:266724049111:web:c4861c1f654539d1bdb092",
  measurementId: "G-90D8VDC6X2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
/* ============================================================
   IMS ERP V6.0 - FIREBASE EDITION
   ============================================================ */

/* -----------------------------
   DOM Elements & Event Listeners
------------------------------*/
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  checkAuthState();

  // Login elements - Fixed IDs to match HTML
  document.getElementById('btnTabAdmin').addEventListener('click', () => switchLoginTab('admin'));
  document.getElementById('btnTabMember').addEventListener('click', () => switchLoginTab('member'));
  document.getElementById('btnLogin').addEventListener('click', doLogin);

  // Logout
  document.getElementById('btnLogout').addEventListener('click', logout);

  // Mobile menu
  document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);

  // Modal close buttons
  document.getElementById('closeModal').addEventListener('click', () => closeModal('customModal'));
  
  // System tools
  document.querySelectorAll('[onclick^="closeModal"]').forEach(btn => {
    const match = btn.getAttribute('onclick').match(/closeModal\('([^']+)'\)/);
    if (match) {
      btn.addEventListener('click', () => closeModal(match[1]));
    }
  });

  // Initialize
  switchLoginTab('admin');
});

/* -----------------------------
   Global Session
------------------------------*/
let SESSION = {
  mode: "admin",
  user: null,
  page: null,
  db: null
};

/* -----------------------------
   Firebase Database Functions
------------------------------*/
const db = {
  ref: (path) => database.ref(path),
  set: (path, data) => database.ref(path).set(data),
  get: (path) => database.ref(path).once('value'),
  update: (path, data) => database.ref(path).update(data),
  remove: (path) => database.ref(path).remove(),
  push: (path, data) => database.ref(path).push(data),
  onValue: (path, callback) => database.ref(path).on('value', callback)
};

async function getDB() {
  try {
    const snapshot = await db.get('/');
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error getting database:', error);
    return null;
  }
}

async function saveDB(data) {
  try {
    await db.set('/', data);
    return true;
  } catch (error) {
    console.error('Error saving database:', error);
    return false;
  }
}

async function updateDB(path, data) {
  try {
    await db.update(path, data);
    return true;
  } catch (error) {
    console.error('Error updating database:', error);
    return false;
  }
}

async function seedDB() {
  const currentYear = new Date().getFullYear();
  const initialData = {
    meta: {
      version: "V6.0 Firebase Edition",
      createdAt: nowISO(),
      monthlyShareAmount: 10000,
      companyName: "IMS Investment Ltd.",
      companyAddress: "Dhaka, Bangladesh",
      companyPhone: "+8801234567890",
      companyEmail: "info@imsinvestment.com",
      whatsappNumber: "+8801234567890"
    },
    admins: {
      "ADM-001": {
        id: "ADM-001",
        name: "Super Admin",
        role: "SUPER_ADMIN",
        email: "admin@ims.com",
        pass: "admin123",
        active: true,
        createdAt: nowISO()
      }
    },
    members: {
      "FM-001": {
        id: "FM-001",
        name: "Demo Founder Member",
        memberType: "FOUNDER",
        fatherName: "Father Name",
        motherName: "Mother Name",
        dob: "1990-01-01",
        phone: "+8801712345678",
        email: "demo@gmail.com",
        pass: "1234",
        shares: 1,
        status: "ACTIVE",
        joinDate: `${currentYear}-01-01`,
        address: "Dhaka, Bangladesh",
        photo: "",
        nidNo: "1234567890",
        nidFront: "",
        nidBack: "",
        nomineeName: "Nominee Demo",
        nomineeRelation: "Father",
        nomineeNid: "9876543210",
        nomineePhone: "+8801812345678",
        nomineePhoto: "",
        createdAt: nowISO(),
        updatedAt: nowISO(),
        approved: true
      }
    },
    deposits: {},
    investments: {},
    expenses: {},
    sales: {},
    profitDistributions: {},
    notices: {},
    resignations: {},
    activityLogs: {}
  };

  await saveDB(initialData);
  return initialData;
}

async function ensureDB() {
  let data = await getDB();
  if (!data) {
    data = await seedDB();
  }
  return data;
}

/* -----------------------------
   Firebase Authentication
------------------------------*/
async function checkAuthState() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("User is logged in:", user);
      // For demo, we'll use the local login system
    } else {
      console.log("No user logged in");
    }
  });
}

async function getUserData(email, password) {
  try {
    // Check in admins
    const snapshot = await db.get('/admins');
    if (snapshot.exists()) {
      const admins = snapshot.val();
      const admin = Object.values(admins).find(a => a.email === email && a.pass === password && a.active);
      if (admin) {
        return { type: "ADMIN", ...admin };
      }
    }

    // Check in members
    const membersSnapshot = await db.get('/members');
    if (membersSnapshot.exists()) {
      const members = membersSnapshot.val();
      const member = Object.values(members).find(m => 
        m.email === email && 
        m.pass === password && 
        m.approved && 
        m.status === "ACTIVE"
      );
      if (member) {
        return { type: "MEMBER", ...member };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/* -----------------------------
   Utilities
------------------------------*/
function nowISO() {
  return new Date().toISOString();
}

function fmtMoney(n) {
  n = Number(n || 0);
  return "৳ " + n.toLocaleString("en-US");
}

function monthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function genId(prefix) {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${year}-${timestamp}-${random}`;
}

function showToast(message, type = 'info') {
  const toastBox = document.getElementById('toastBox');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 
                      type === 'error' ? 'exclamation-circle' : 
                      type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  toastBox.appendChild(toast);
  
  // Show toast
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add('show'), 10);
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = "none", 300);
  }
}

function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('show');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* -----------------------------
   Login System
------------------------------*/
function switchLoginTab(mode) {
  SESSION.mode = mode;
  const btnAdmin = document.getElementById('btnTabAdmin');
  const btnMember = document.getElementById('btnTabMember');
  
  btnAdmin.classList.toggle('active', mode === 'admin');
  btnMember.classList.toggle('active', mode === 'member');
  
  const loginId = document.getElementById('loginId');
  loginId.placeholder = mode === 'admin' ? 'Enter admin email' : 'Enter member email';
}

async function doLogin() {
  const email = document.getElementById('loginId').value.trim();
  const password = document.getElementById('loginPass').value.trim();

  if (!email || !password) {
    showToast('Please enter email and password', 'error');
    return;
  }

  // Show loading
  const loader = document.getElementById('loader');
  loader.style.display = 'flex';

  try {
    const userData = await getUserData(email, password);
    
    if (userData) {
      SESSION.user = userData;
      SESSION.db = await ensureDB();
      
      showToast(`Welcome ${userData.name}`, 'success');
      startApp();
    } else {
      showToast('Invalid credentials or account not approved', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Login failed. Please try again.', 'error');
  } finally {
    loader.style.display = 'none';
  }
}

function logout() {
  SESSION.user = null;
  SESSION.page = null;
  SESSION.db = null;
  
  // Hide app section, show login
  document.getElementById('appSection').style.display = 'none';
  document.getElementById('loginSection').style.display = 'flex';
  
  // Reset form
  document.getElementById('loginId').value = '';
  document.getElementById('loginPass').value = '';
  
  showToast('Logged out successfully', 'success');
}

/* -----------------------------
   App Start
------------------------------*/
async function startApp() {
  // Hide login, show app
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('appSection').style.display = 'grid';
  
  // Load database if not loaded
  if (!SESSION.db) {
    SESSION.db = await ensureDB();
  }
  
  // Update user info in sidebar
  document.getElementById('displayUserName').textContent = SESSION.user.name;
  document.getElementById('displayUserRole').textContent = SESSION.user.role || SESSION.user.type;
  document.getElementById('chipId').textContent = SESSION.user.id;
  document.getElementById('systemMode').textContent = SESSION.user.type;
  
  // Show/hide admin tools
  const fabContainer = document.getElementById('fabContainer');
  if (SESSION.user.type === 'ADMIN') {
    fabContainer.style.display = 'block';
    // Build admin sidebar
    buildSidebar([
      { id: 'admin_dashboard', name: 'Dashboard', icon: 'fas fa-chart-line' },
      { id: 'admin_members', name: 'Members', icon: 'fas fa-users' },
      { id: 'admin_deposits', name: 'Deposits', icon: 'fas fa-money-bill-wave' },
      { id: 'admin_investments', name: 'Investments', icon: 'fas fa-chart-bar' },
      { id: 'admin_expenses', name: 'Expenses', icon: 'fas fa-receipt' },
      { id: 'admin_notices', name: 'Notices', icon: 'fas fa-bullhorn' },
      { id: 'admin_reports', name: 'Reports', icon: 'fas fa-file-alt' },
      { id: 'company_info', name: 'Company Info', icon: 'fas fa-info-circle' }
    ]);
  } else {
    fabContainer.style.display = 'none';
    // Build member sidebar
    buildSidebar([
      { id: 'member_dashboard', name: 'Dashboard', icon: 'fas fa-chart-line' },
      { id: 'member_profile', name: 'My Profile', icon: 'fas fa-user' },
      { id: 'member_deposit', name: 'Submit Deposit', icon: 'fas fa-money-bill-wave' },
      { id: 'member_deposit_history', name: 'Deposit History', icon: 'fas fa-history' },
      { id: 'member_notices', name: 'Notices', icon: 'fas fa-bullhorn' },
      { id: 'company_info', name: 'Company Info', icon: 'fas fa-info-circle' }
    ]);
  }
  
  // Go to dashboard
  go(SESSION.user.type === 'ADMIN' ? 'admin_dashboard' : 'member_dashboard');
}

function buildSidebar(items) {
  const navMenu = document.getElementById('navMenu');
  navMenu.innerHTML = '';
  
  items.forEach(item => {
    const button = document.createElement('button');
    button.innerHTML = `
      <i class="${item.icon}"></i>
      <span>${item.name}</span>
    `;
    
    if (item.id === 'company_info') {
      button.addEventListener('click', () => openModal('modalCompanyInfo'));
    } else {
      button.addEventListener('click', () => go(item.id));
    }
    
    navMenu.appendChild(button);
  });
}

/* -----------------------------
   Navigation Router
------------------------------*/
function go(page) {
  SESSION.page = page;
  
  // Update active state in sidebar
  document.querySelectorAll('#navMenu button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Update page title
  const titles = {
    'admin_dashboard': 'Admin Dashboard',
    'admin_members': 'Member Management',
    'admin_deposits': 'Deposit Management',
    'admin_investments': 'Investment Management',
    'admin_expenses': 'Expense Management',
    'admin_notices': 'Notice Management',
    'admin_reports': 'Reports',
    'member_dashboard': 'Member Dashboard',
    'member_profile': 'My Profile',
    'member_deposit': 'Submit Deposit',
    'member_deposit_history': 'Deposit History',
    'member_notices': 'Notices'
  };
  
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
  document.getElementById('pageSubtitle').textContent = 'Real-time data from Firebase';
  
  // Load page content
  const pageMap = {
    'admin_dashboard': renderAdminDashboard,
    'admin_members': renderAdminMembers,
    'member_dashboard': renderMemberDashboard,
    'member_profile': renderMemberProfile,
    'member_deposit': renderMemberDeposit,
    'member_notices': renderMemberNotices,
    'company_info': () => openModal('modalCompanyInfo')
  };
  
  if (pageMap[page]) {
    pageMap[page]();
  } else {
    renderComingSoon();
  }
}

function renderComingSoon() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div style="text-align: center; padding: 50px;">
      <div style="font-size: 72px; margin-bottom: 20px;">🚧</div>
      <h2>Coming Soon</h2>
      <p>This feature is under development</p>
      <button class="btn-primary" onclick="go('${SESSION.user.type === 'ADMIN' ? 'admin_dashboard' : 'member_dashboard'}')" 
              style="margin-top: 20px; width: auto; padding: 10px 30px;">
        Back to Dashboard
      </button>
    </div>
  `;
}

/* -----------------------------
   Admin Dashboard
------------------------------*/
async function renderAdminDashboard() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="dashboard-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
      <div class="glass" style="padding: 20px; border-radius: 15px;">
        <h3 style="color: #4cc9f0; margin-bottom: 10px;">Total Members</h3>
        <h1 id="totalMembers">0</h1>
        <p>Active members in system</p>
      </div>
      
      <div class="glass" style="padding: 20px; border-radius: 15px;">
        <h3 style="color: #10b981; margin-bottom: 10px;">Total Deposits</h3>
        <h1 id="totalDeposits">৳ 0</h1>
        <p>Approved deposits</p>
      </div>
      
      <div class="glass" style="padding: 20px; border-radius: 15px;">
        <h3 style="color: #f59e0b; margin-bottom: 10px;">Pending Deposits</h3>
        <h1 id="pendingDeposits">0</h1>
        <p>Waiting for approval</p>
      </div>
      
      <div class="glass" style="padding: 20px; border-radius: 15px;">
        <h3 style="color: #ef4444; margin-bottom: 10px;">Total Expenses</h3>
        <h1 id="totalExpenses">৳ 0</h1>
        <p>All expenses</p>
      </div>
    </div>
    
    <div class="glass" style="padding: 20px; border-radius: 15px; margin-bottom: 20px;">
      <h3 style="margin-bottom: 15px;">Recent Activity</h3>
      <div id="recentActivity">
        <p>Loading activity...</p>
      </div>
    </div>
    
    <div class="glass" style="padding: 20px; border-radius: 15px;">
      <h3 style="margin-bottom: 15px;">Quick Actions</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
        <button class="btn-primary" onclick="go('admin_members')" style="padding: 12px;">
          <i class="fas fa-user-plus"></i> Add Member
        </button>
        <button class="btn-primary" onclick="openModal('modalQuickAdd')" style="padding: 12px;">
          <i class="fas fa-plus"></i> Quick Add
        </button>
        <button class="btn-primary" onclick="go('admin_deposits')" style="padding: 12px;">
          <i class="fas fa-check-circle"></i> Approve Deposits
        </button>
        <button class="btn-primary" onclick="openModal('modalSystemTools')" style="padding: 12px;">
          <i class="fas fa-tools"></i> System Tools
        </button>
      </div>
    </div>
  `;
  
  // Load real data
  loadAdminDashboardData();
}

async function loadAdminDashboardData() {
  try {
    const dbData = await getDB();
    if (!dbData) return;
    
    // Total members
    const members = dbData.members ? Object.values(dbData.members) : [];
    const totalMembers = members.filter(m => m.approved).length;
    document.getElementById('totalMembers').textContent = totalMembers;
    
    // Total deposits
    const deposits = dbData.deposits ? Object.values(dbData.deposits) : [];
    const totalDeposits = deposits.filter(d => d.status === 'APPROVED')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    document.getElementById('totalDeposits').textContent = fmtMoney(totalDeposits);
    
    // Pending deposits
    const pendingDeposits = deposits.filter(d => d.status === 'PENDING').length;
    document.getElementById('pendingDeposits').textContent = pendingDeposits;
    
    // Total expenses
    const expenses = dbData.expenses ? Object.values(dbData.expenses) : [];
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    document.getElementById('totalExpenses').textContent = fmtMoney(totalExpenses);
    
    // Recent activity
    const activities = dbData.activityLogs ? Object.values(dbData.activityLogs) : [];
    const recentActivity = document.getElementById('recentActivity');
    if (activities.length > 0) {
      recentActivity.innerHTML = activities.slice(-5).reverse().map(log => `
        <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; justify-content: space-between;">
            <span>${log.action || 'Activity'}</span>
            <small style="color: #6c757d;">${new Date(log.at).toLocaleDateString()}</small>
          </div>
          <small style="color: #6c757d;">${log.details || ''}</small>
        </div>
      `).join('');
    } else {
      recentActivity.innerHTML = '<p>No recent activity</p>';
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

/* -----------------------------
   Admin Members Management
------------------------------*/
async function renderAdminMembers() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div style="margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Member Management</h2>
        <button class="btn-primary" onclick="openAddMemberModal()" style="width: auto; padding: 10px 20px;">
          <i class="fas fa-user-plus"></i> Add New Member
        </button>
      </div>
      
      <div class="glass" style="padding: 20px; border-radius: 15px;">
        <div style="margin-bottom: 15px;">
          <input type="text" id="memberSearch" placeholder="Search members..." 
                 style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;"
                 oninput="searchMembers()">
        </div>
        
        <div id="membersList">
          <p>Loading members...</p>
        </div>
      </div>
    </div>
  `;
  
  loadMembers();
}

async function loadMembers() {
  try {
    const dbData = await getDB();
    const members = dbData.members ? Object.values(dbData.members) : [];
    
    const membersList = document.getElementById('membersList');
    if (members.length === 0) {
      membersList.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
          <h3>No Members Found</h3>
          <p>Add your first member to get started</p>
          <button class="btn-primary" onclick="openAddMemberModal()" style="margin-top: 20px;">
            Add New Member
          </button>
        </div>
      `;
      return;
    }
    
    membersList.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid rgba(255,255,255,0.1);">
            <th style="padding: 12px; text-align: left;">Member ID</th>
            <th style="padding: 12px; text-align: left;">Name</th>
            <th style="padding: 12px; text-align: left;">Phone</th>
            <th style="padding: 12px; text-align: left;">Status</th>
            <th style="padding: 12px; text-align: left;">Actions</th>
          </tr>
        </thead>
        <tbody id="membersTableBody">
          ${members.map(member => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 12px;">
                <div style="font-weight: bold;">${member.id}</div>
                <small style="color: #6c757d;">${member.memberType || 'N/A'}</small>
              </td>
              <td style="padding: 12px;">
                <div style="font-weight: bold;">${member.name}</div>
                <small style="color: #6c757d;">${member.email || 'No email'}</small>
              </td>
              <td style="padding: 12px;">${member.phone || 'N/A'}</td>
              <td style="padding: 12px;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; 
                      background: ${member.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 
                                  member.approved ? 'rgba(245, 158, 11, 0.2)' : 'rgba(107, 114, 128, 0.2)'}; 
                      color: ${member.status === 'ACTIVE' ? '#10b981' : 
                              member.approved ? '#f59e0b' : '#6b7280'}; 
                      border: 1px solid ${member.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 
                                         member.approved ? 'rgba(245, 158, 11, 0.3)' : 'rgba(107, 114, 128, 0.3)'};">
                  ${member.approved ? (member.status || 'ACTIVE') : 'PENDING'}
                </span>
              </td>
              <td style="padding: 12px;">
                <div style="display: flex; gap: 10px;">
                  <button onclick="viewMember('${member.id}')" style="background: rgba(67, 97, 238, 0.2); 
                         border: 1px solid rgba(67, 97, 238, 0.3); color: #4361ee; padding: 6px 12px; 
                         border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-eye"></i>
                  </button>
                  ${!member.approved ? `
                    <button onclick="approveMember('${member.id}')" style="background: rgba(16, 185, 129, 0.2); 
                           border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 6px 12px; 
                           border-radius: 6px; cursor: pointer;">
                      <i class="fas fa-check"></i>
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading members:', error);
    document.getElementById('membersList').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ef4444;">
        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
        <p>Error loading members. Please try again.</p>
      </div>
    `;
  }
}

function searchMembers() {
  const search = document.getElementById('memberSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#membersTableBody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

function openAddMemberModal() {
  document.getElementById('modalTitle').textContent = 'Add New Member';
  document.getElementById('modalBody').innerHTML = `
    <div style="display: grid; gap: 15px;">
      <div>
        <label style="display: block; margin-bottom: 5px; color: #6c757d;">Member Type</label>
        <select id="newMemberType" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
               border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
          <option value="FOUNDER">Founder Member</option>
          <option value="REFERENCE">Reference Member</option>
          <option value="REGULAR">Regular Member</option>
        </select>
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 5px; color: #6c757d;">Full Name *</label>
        <input type="text" id="newMemberName" placeholder="Enter full name" 
               style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
                      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 5px; color: #6c757d;">Email Address *</label>
        <input type="email" id="newMemberEmail" placeholder="Enter email" 
               style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
                      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 5px; color: #6c757d;">Phone Number *</label>
        <input type="tel" id="newMemberPhone" placeholder="Enter phone number" 
               style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
                      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 5px; color: #6c757d;">Password *</label>
        <input type="password" id="newMemberPassword" placeholder="Create password" 
               style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
                      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
      </div>
    </div>
  `;
  
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn-primary" onclick="closeModal('customModal')" 
            style="background: #6c757d; padding: 10px 20px;">
      Cancel
    </button>
    <button class="btn-primary" onclick="saveNewMember()" style="padding: 10px 20px;">
      Save Member
    </button>
  `;
  
  openModal('customModal');
}

async function saveNewMember() {
  const name = document.getElementById('newMemberName').value.trim();
  const email = document.getElementById('newMemberEmail').value.trim();
  const phone = document.getElementById('newMemberPhone').value.trim();
  const password = document.getElementById('newMemberPassword').value;
  const memberType = document.getElementById('newMemberType').value;
  
  if (!name || !email || !phone || !password) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  
  try {
    const dbData = await getDB();
    const members = dbData.members || {};
    
    // Generate member ID
    const prefix = memberType === 'FOUNDER' ? 'FM' : memberType === 'REFERENCE' ? 'RM' : 'MEM';
    const memberCount = Object.keys(members).filter(k => k.startsWith(prefix)).length;
    const memberId = `${prefix}-${String(memberCount + 1).padStart(3, '0')}`;
    
    // Create member object
    const memberData = {
      id: memberId,
      name,
      email,
      phone,
      pass: password,
      memberType,
      status: 'ACTIVE',
      approved: false,
      shares: 1,
      joinDate: new Date().toISOString().split('T')[0],
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    
    // Save to Firebase
    await updateDB(`members/${memberId}`, memberData);
    
    // Log activity
    await logActivity('ADD_MEMBER', `Added new member: ${name} (${memberId})`);
    
    showToast(`Member ${name} added successfully`, 'success');
    closeModal('customModal');
    renderAdminMembers();
    
  } catch (error) {
    console.error('Error saving member:', error);
    showToast('Failed to save member', 'error');
  }
}

async function viewMember(memberId) {
  try {
    const snapshot = await db.get(`members/${memberId}`);
    if (!snapshot.exists()) {
      showToast('Member not found', 'error');
      return;
    }
    
    const member = snapshot.val();
    
    document.getElementById('modalTitle').textContent = `Member: ${member.name}`;
    document.getElementById('modalBody').innerHTML = `
      <div style="display: grid; gap: 20px;">
        <div>
          <h4 style="color: #4cc9f0; margin-bottom: 10px;">Personal Information</h4>
          <div style="display: grid; gap: 10px;">
            <div>
              <strong>Member ID:</strong> ${member.id}
            </div>
            <div>
              <strong>Name:</strong> ${member.name}
            </div>
            <div>
              <strong>Email:</strong> ${member.email || 'N/A'}
            </div>
            <div>
              <strong>Phone:</strong> ${member.phone || 'N/A'}
            </div>
            <div>
              <strong>Type:</strong> ${member.memberType || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong> 
              <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; 
                    background: ${member.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 
                                member.approved ? 'rgba(245, 158, 11, 0.2)' : 'rgba(107, 114, 128, 0.2)'}; 
                    color: ${member.status === 'ACTIVE' ? '#10b981' : 
                            member.approved ? '#f59e0b' : '#6b7280'}; 
                    border: 1px solid ${member.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 
                                       member.approved ? 'rgba(245, 158, 11, 0.3)' : 'rgba(107, 114, 128, 0.3)'};">
                ${member.approved ? (member.status || 'ACTIVE') : 'PENDING'}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style="color: #4cc9f0; margin-bottom: 10px;">Account Information</h4>
          <div style="display: grid; gap: 10px;">
            <div>
              <strong>Join Date:</strong> ${member.joinDate || 'N/A'}
            </div>
            <div>
              <strong>Shares:</strong> ${member.shares || 1}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modalFooter').innerHTML = `
      <button class="btn-primary" onclick="closeModal('customModal')" style="padding: 10px 20px;">
        Close
      </button>
      ${!member.approved ? `
        <button class="btn-primary" onclick="approveMember('${memberId}')" 
                style="background: linear-gradient(135deg, #10b981, #059669); padding: 10px 20px;">
          Approve Member
        </button>
      ` : ''}
    `;
    
    openModal('customModal');
    
  } catch (error) {
    console.error('Error viewing member:', error);
    showToast('Failed to load member data', 'error');
  }
}

async function approveMember(memberId) {
  if (!confirm('Are you sure you want to approve this member?')) return;
  
  try {
    await updateDB(`members/${memberId}`, {
      approved: true,
      status: 'ACTIVE',
      updatedAt: nowISO()
    });
    
    // Get member data
    const snapshot = await db.get(`members/${memberId}`);
    const member = snapshot.val();
    
    // Log activity
    await logActivity('APPROVE_MEMBER', `Approved member: ${member.name} (${memberId})`);
    
    showToast(`Member ${member.name} approved successfully`, 'success');
    closeModal('customModal');
    renderAdminMembers();
    
  } catch (error) {
    console.error('Error approving member:', error);
    showToast('Failed to approve member', 'error');
  }
}

/* -----------------------------
   Member Dashboard
------------------------------*/
async function renderMemberDashboard() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div style="margin-bottom: 30px;">
      <div class="glass" style="padding: 20px; border-radius: 15px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #4361ee, #7209b7); 
               border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            ${SESSION.user.name.charAt(0)}
          </div>
          <div>
            <h2>Welcome, ${SESSION.user.name}!</h2>
            <p style="color: #6c757d;">Member ID: ${SESSION.user.id}</p>
          </div>
        </div>
      </div>
      
      <div class="glass" style="padding: 20px; border-radius: 15px;">
        <h3 style="margin-bottom: 15px;">Your Summary</h3>
        <div id="memberSummary">
          <p>Loading your data...</p>
        </div>
      </div>
    </div>
  `;
  
  loadMemberDashboardData();
}

async function loadMemberDashboardData() {
  try {
    const dbData = await getDB();
    const memberId = SESSION.user.id;
    
    // Get member deposits
    const deposits = dbData.deposits ? Object.values(dbData.deposits) : [];
    const memberDeposits = deposits.filter(d => d.memberId === memberId);
    const approvedDeposits = memberDeposits.filter(d => d.status === 'APPROVED');
    const totalDeposit = approvedDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    
    // Get current month status
    const currentMonth = monthKey();
    const thisMonthApproved = approvedDeposits.find(d => d.month === currentMonth);
    const thisMonthPending = memberDeposits.find(d => d.month === currentMonth && d.status === 'PENDING');
    const monthlyDue = SESSION.user.shares * (dbData.meta?.monthlyShareAmount || 10000);
    const due = thisMonthApproved ? 0 : monthlyDue;
    
    const memberSummary = document.getElementById('memberSummary');
    memberSummary.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
        <div style="background: rgba(67, 97, 238, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(67, 97, 238, 0.2);">
          <div style="font-size: 24px; margin-bottom: 5px;">${fmtMoney(totalDeposit)}</div>
          <div style="color: #6c757d; font-size: 14px;">Total Deposits</div>
        </div>
        
        <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.2);">
          <div style="font-size: 24px; margin-bottom: 5px;">${SESSION.user.shares || 1}</div>
          <div style="color: #6c757d; font-size: 14px;">Shares</div>
        </div>
        
        <div style="background: rgba(245, 158, 11, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.2);">
          <div style="font-size: 24px; margin-bottom: 5px;">${fmtMoney(due)}</div>
          <div style="color: #6c757d; font-size: 14px;">Current Due</div>
        </div>
      </div>
      
      <div style="background: ${thisMonthApproved ? 'rgba(16, 185, 129, 0.1)' : 
                           thisMonthPending ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; 
           padding: 20px; border-radius: 10px; border: 1px solid ${thisMonthApproved ? 'rgba(16, 185, 129, 0.2)' : 
                                                               thisMonthPending ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'};">
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
          <div style="font-size: 24px;">
            ${thisMonthApproved ? '✓' : thisMonthPending ? '⏳' : '⚠️'}
          </div>
          <div>
            <h4>${currentMonth} Status</h4>
            <p style="color: #6c757d;">
              ${thisMonthApproved ? 'Deposit approved' : 
                thisMonthPending ? 'Deposit pending approval' : 
                'Deposit not submitted'}
            </p>
          </div>
        </div>
        
        ${!thisMonthApproved && !thisMonthPending ? `
          <div>
            <p style="margin-bottom: 10px;">Monthly Due: <strong>${fmtMoney(monthlyDue)}</strong></p>
            <button class="btn-primary" onclick="go('member_deposit')" style="padding: 10px 20px;">
              Submit Deposit Now
            </button>
          </div>
        ` : ''}
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading member dashboard:', error);
    document.getElementById('memberSummary').innerHTML = `
      <div style="text-align: center; padding: 20px; color: #ef4444;">
        <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
        <p>Error loading your data</p>
      </div>
    `;
  }
}

/* -----------------------------
   Member Profile
------------------------------*/
async function renderMemberProfile() {
  const mainContent = document.getElementById('mainContent');
  
  const profileHTML = `
    <div class="glass" style="padding: 30px; border-radius: 15px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4361ee, #7209b7); 
             border-radius: 50%; display: flex; align-items: center; justify-content: center; 
             font-size: 32px; margin: 0 auto 15px;">
          ${SESSION.user.name.charAt(0)}
        </div>
        <h2>${SESSION.user.name}</h2>
        <p style="color: #6c757d;">${SESSION.user.memberType || 'Member'} • ID: ${SESSION.user.id}</p>
      </div>
      
      <div style="display: grid; gap: 20px;">
        <div>
          <h4 style="color: #4cc9f0; margin-bottom: 10px;">Personal Information</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div>
              <strong>Email:</strong>
              <p style="margin-top: 5px;">${SESSION.user.email || 'Not provided'}</p>
            </div>
            <div>
              <strong>Phone:</strong>
              <p style="margin-top: 5px;">${SESSION.user.phone || 'Not provided'}</p>
            </div>
            <div>
              <strong>Address:</strong>
              <p style="margin-top: 5px;">${SESSION.user.address || 'Not provided'}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style="color: #4cc9f0; margin-bottom: 10px;">Account Information</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div>
              <strong>Shares:</strong>
              <p style="margin-top: 5px;">${SESSION.user.shares || 1}</p>
            </div>
            <div>
              <strong>Join Date:</strong>
              <p style="margin-top: 5px;">${SESSION.user.joinDate || 'Not available'}</p>
            </div>
            <div>
              <strong>Status:</strong>
              <p style="margin-top: 5px;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; 
                      background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">
                  ACTIVE
                </span>
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style="color: #4cc9f0; margin-bottom: 10px;">Quick Actions</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <button class="btn-primary" onclick="go('member_deposit')" style="padding: 12px;">
              <i class="fas fa-money-bill-wave"></i> Submit Deposit
            </button>
            <button class="btn-primary" onclick="showChangePassword()" style="padding: 12px;">
              <i class="fas fa-key"></i> Change Password
            </button>
            <button class="btn-primary" onclick="openModal('modalCompanyInfo')" style="padding: 12px;">
              <i class="fas fa-building"></i> Company Info
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  mainContent.innerHTML = profileHTML;
}

function showChangePassword() {
  document.getElementById('modalTitle').textContent = 'Change Password';
  document.getElementById('modalBody').innerHTML = `
    <div style="display: grid; gap: 15px;">
      <div>
        <label style="display: block; margin-bottom: 5px; color: #6c757d;">Current Password</label>
        <input type="password" id="currentPassword" 
               style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
                      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 5px; color: #6c757d;">New Password</label>
        <input type="password" id="newPassword" 
               style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
                      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 5px; color: #6c757d;">Confirm New Password</label>
        <input type="password" id="confirmPassword" 
               style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); 
                      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
      </div>
    </div>
  `;
  
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn-primary" onclick="closeModal('customModal')" 
            style="background: #6c757d; padding: 10px 20px;">
      Cancel
    </button>
    <button class="btn-primary" onclick="changePassword()" style="padding: 10px 20px;">
      Update Password
    </button>
  `;
  
  openModal('customModal');
}

async function changePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('Please fill all fields', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }
  
  if (currentPassword !== SESSION.user.pass) {
    showToast('Current password is incorrect', 'error');
    return;
  }
  
  try {
    await updateDB(`members/${SESSION.user.id}`, {
      pass: newPassword,
      updatedAt: nowISO()
    });
    
    // Update session
    SESSION.user.pass = newPassword;
    
    showToast('Password updated successfully', 'success');
    closeModal('customModal');
    
  } catch (error) {
    console.error('Error changing password:', error);
    showToast('Failed to update password', 'error');
  }
}

/* -----------------------------
   Member Deposit Submission
------------------------------*/
async function renderMemberDeposit() {
  const mainContent = document.getElementById('mainContent');
  
  // Get member data
  const memberId = SESSION.user.id;
  const snapshot = await db.get(`members/${memberId}`);
  const member = snapshot.exists() ? snapshot.val() : SESSION.user;
  
  const monthlyDue = member.shares * (SESSION.db?.meta?.monthlyShareAmount || 10000);
  
  // Generate month options
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  let monthOptions = '';
  
  for (let year = 2024; year <= currentYear; year++) {
    const maxMonth = year === currentYear ? currentMonth : 12;
    for (let month = 1; month <= maxMonth; month++) {
      const monthStr = String(month).padStart(2, '0');
      const value = `${year}-${monthStr}`;
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      monthOptions += `<option value="${value}">${monthName} ${year}</option>`;
    }
  }
  
  mainContent.innerHTML = `
    <div class="glass" style="padding: 30px; border-radius: 15px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 15px;">💰</div>
        <h2>Submit Monthly Deposit</h2>
        <p style="color: #6c757d;">Complete your monthly deposit submission</p>
      </div>
      
      <div style="background: rgba(67, 97, 238, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
        <h4 style="color: #4cc9f0; margin-bottom: 15px;">Deposit Summary</h4>
        <div style="display: grid; gap: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Member Name:</span>
            <strong>${member.name}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Your Shares:</span>
            <strong>${member.shares}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Monthly Share Amount:</span>
            <strong>${fmtMoney(SESSION.db?.meta?.monthlyShareAmount || 10000)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
            <span>Total Amount Due:</span>
            <strong style="color: #4cc9f0; font-size: 18px;">${fmtMoney(monthlyDue)}</strong>
          </div>
        </div>
      </div>
      
      <div style="display: grid; gap: 20px;">
        <div>
          <label style="display: block; margin-bottom: 8px; color: #6c757d;">Select Month *</label>
          <select id="depositMonth" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); 
                 border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
            ${monthOptions}
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 8px; color: #6c757d;">Deposit Amount *</label>
          <input type="number" id="depositAmount" value="${monthlyDue}" readonly
                 style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 8px; color: #6c757d;">Payment Method *</label>
          <select id="depositMethod" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); 
                 border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
            <option value="BKASH">Bkash</option>
            <option value="ROCKET">Rocket</option>
            <option value="BANK">Bank Transfer</option>
            <option value="CASH">Cash</option>
          </select>
        </div>
        
        <div id="bankFields" style="display: none;">
          <label style="display: block; margin-bottom: 8px; color: #6c757d;">Bank Name</label>
          <select id="depositBank" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); 
                 border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
            <option value="Sonali Bank">Sonali Bank</option>
            <option value="Janata Bank">Janata Bank</option>
            <option value="Agrani Bank">Agrani Bank</option>
            <option value="Islami Bank">Islami Bank</option>
            <option value="BRAC Bank">BRAC Bank</option>
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 8px; color: #6c757d;">Transaction ID *</label>
          <input type="text" id="depositTrx" placeholder="Enter transaction ID"
                 style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 8px; color: #6c757d;">Deposit Date *</label>
          <input type="date" id="depositDate" value="${new Date().toISOString().split('T')[0]}"
                 style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 8px; color: #6c757d;">Notes (Optional)</label>
          <textarea id="depositNotes" rows="3" placeholder="Any additional notes..."
                 style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); 
                        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; resize: vertical;"></textarea>
        </div>
      </div>
      
      <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: flex-end;">
        <button class="btn-primary" onclick="go('member_dashboard')" 
                style="background: #6c757d; padding: 12px 24px;">
          Cancel
        </button>
        <button class="btn-primary" onclick="submitMemberDeposit()" style="padding: 12px 24px;">
          Submit Deposit
        </button>
      </div>
    </div>
  `;
  
  // Add event listener for payment method change
  document.getElementById('depositMethod').addEventListener('change', function() {
    const bankFields = document.getElementById('bankFields');
    bankFields.style.display = this.value === 'BANK' ? 'block' : 'none';
  });
}

async function submitMemberDeposit() {
  const month = document.getElementById('depositMonth').value;
  const amount = document.getElementById('depositAmount').value;
  const method = document.getElementById('depositMethod').value;
  const trxId = document.getElementById('depositTrx').value.trim();
  const date = document.getElementById('depositDate').value;
  const notes = document.getElementById('depositNotes').value.trim();
  const bank = method === 'BANK' ? document.getElementById('depositBank').value : '';
  
  if (!month || !amount || !method || !trxId || !date) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  
  // Check for duplicate deposit
  try {
    const depositsSnapshot = await db.get('deposits');
    const deposits = depositsSnapshot.exists() ? Object.values(depositsSnapshot.val()) : [];
    const existingDeposit = deposits.find(d => 
      d.memberId === SESSION.user.id && 
      d.month === month && 
      (d.status === 'PENDING' || d.status === 'APPROVED')
    );
    
    if (existingDeposit) {
      showToast(`You already have a ${existingDeposit.status.toLowerCase()} deposit for ${month}`, 'error');
      return;
    }
  } catch (error) {
    console.error('Error checking duplicate deposit:', error);
  }
  
  // Show confirmation
  const confirmMessage = `
    Please confirm your deposit details:
    
    Month: ${month}
    Amount: ${fmtMoney(amount)}
    Method: ${method}
    ${bank ? `Bank: ${bank}\n` : ''}
    Transaction ID: ${trxId}
    Date: ${date}
    
    After submission, your deposit will be pending until admin approval.
  `;
  
  if (confirm(confirmMessage)) {
    submitDeposit(month, amount, method, trxId, date, notes, bank);
  }
}

async function submitDeposit(month, amount, method, trxId, date, notes, bank) {
  try {
    // Generate deposit ID
    const depositId = `DP-${Date.now()}`;
    
    // Create deposit object
    const depositData = {
      id: depositId,
      memberId: SESSION.user.id,
      memberName: SESSION.user.name,
      month,
      amount: parseFloat(amount),
      paymentMethod: method,
      fromBank: bank,
      toBank: bank,
      trxId,
      note: notes,
      status: "PENDING",
      mrId: "",
      depositDate: date,
      submittedAt: nowISO(),
      approvedAt: "",
      approvedBy: ""
    };
    
    // Save to Firebase
    await db.set(`deposits/${depositId}`, depositData);
    
    // Log activity
    await logActivity('SUBMIT_DEPOSIT', `Member ${SESSION.user.name} submitted deposit for ${month}`);
    
    // Send notification to admins
    const adminsSnapshot = await db.get('admins');
    if (adminsSnapshot.exists()) {
      const admins = Object.values(adminsSnapshot.val()).filter(a => a.active);
      admins.forEach(admin => {
        // In real app, send WhatsApp notification here
        console.log('Notification to admin:', admin.name);
      });
    }
    
    // Show success
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
      <div class="glass" style="padding: 40px; border-radius: 15px; text-align: center;">
        <div style="font-size: 72px; margin-bottom: 20px;">✅</div>
        <h2>Deposit Submitted Successfully!</h2>
        <p style="color: #6c757d; margin-bottom: 30px;">
          Your deposit has been submitted for admin approval.
        </p>
        
        <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 10px; 
             max-width: 400px; margin: 0 auto 30px; text-align: left;">
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Deposit ID:</span>
              <strong>${depositId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Month:</span>
              <strong>${month}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Amount:</span>
              <strong>${fmtMoney(amount)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Status:</span>
              <strong style="color: #f59e0b;">PENDING</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Submitted:</span>
              <strong>${new Date().toLocaleDateString()}</strong>
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button class="btn-primary" onclick="go('member_deposit_history')" 
                  style="background: #6c757d; padding: 12px 24px;">
            View History
          </button>
          <button class="btn-primary" onclick="go('member_dashboard')" style="padding: 12px 24px;">
            Dashboard
          </button>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error submitting deposit:', error);
    showToast('Failed to submit deposit', 'error');
  }
}

/* -----------------------------
   Member Notices
------------------------------*/
async function renderMemberNotices() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="glass" style="padding: 30px; border-radius: 15px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 15px;">📢</div>
        <h2>Notices & Announcements</h2>
        <p style="color: #6c757d;">Stay updated with latest company announcements</p>
      </div>
      
      <div id="noticesList">
        <p>Loading notices...</p>
      </div>
    </div>
  `;
  
  loadMemberNotices();
}

async function loadMemberNotices() {
  try {
    const dbData = await getDB();
    const notices = dbData.notices ? Object.values(dbData.notices) : [];
    
    const noticesList = document.getElementById('noticesList');
    
    if (notices.length === 0) {
      noticesList.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
          <h3>No Notices Available</h3>
          <p style="color: #6c757d;">Check back later for updates</p>
        </div>
      `;
      return;
    }
    
    // Sort by date (newest first)
    notices.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    
    noticesList.innerHTML = notices.map(notice => `
      <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; 
           margin-bottom: 20px; border-left: 4px solid #4361ee;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <h4 style="margin: 0;">${notice.title || 'Notice'}</h4>
          <small style="color: #6c757d;">${new Date(notice.date || notice.createdAt).toLocaleDateString()}</small>
        </div>
        <p style="color: #e2e8f0; margin-bottom: 15px;">${notice.message || ''}</p>
        ${notice.attachment ? `
          <div style="margin-top: 10px;">
            <a href="${notice.attachment}" target="_blank" 
               style="color: #4cc9f0; text-decoration: none;">
              <i class="fas fa-paperclip"></i> View Attachment
            </a>
          </div>
        ` : ''}
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading notices:', error);
    document.getElementById('noticesList').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ef4444;">
        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
        <p>Error loading notices. Please try again.</p>
      </div>
    `;
  }
}

/* -----------------------------
   Helper Functions
------------------------------*/
async function logActivity(action, details) {
  try {
    const logId = `LOG-${Date.now()}`;
    await db.push('activityLogs', {
      id: logId,
      action,
      details,
      byId: SESSION.user?.id || 'SYSTEM',
      byRole: SESSION.user?.role || SESSION.user?.type || 'SYSTEM',
      at: nowISO()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Export functions for modals
function exportJSON() {
  showToast('Export feature coming soon!', 'info');
}

function importJSONPrompt() {
  showToast('Import feature coming soon!', 'info');
}

async function resetDemo() {
  if (confirm('Reset demo database? All current data will be lost.')) {
    try {
      await seedDB();
      showToast('Demo database reset successfully', 'success');
      if (SESSION.user) {
        startApp();
      }
    } catch (error) {
      console.error('Error resetting demo:', error);
      showToast('Failed to reset demo', 'error');
    }
  }
}

async function wipeAll() {
  if (confirm('⚠️ WARNING: Delete all ERP data permanently?')) {
    try {
      await db.remove('/');
      await seedDB();
      showToast('Database reset to demo', 'success');
      if (SESSION.user) {
        startApp();
      }
    } catch (error) {
      console.error('Error wiping data:', error);
      showToast('Failed to reset database', 'error');
    }
  }
}

// Initialize the app
console.log('IMS ERP V6.0 - Firebase Edition Loaded');

// Make functions available globally
window.openModal = openModal;
window.closeModal = closeModal;
window.go = go;
window.logout = logout;
window.exportJSON = exportJSON;
window.importJSONPrompt = importJSONPrompt;
window.resetDemo = resetDemo;
window.wipeAll = wipeAll;
[file content end]
