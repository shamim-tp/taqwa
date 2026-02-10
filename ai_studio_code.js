/* ============================================================
   IMS ERP V5.1 FINAL - FIREBASE EDITION
   Cloud-based real-time ERP system
   ============================================================ */

// আপনার Firebase কনফিগারেশন এখানে পেস্ট করুন
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase শুরু করুন
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Helper Functions ---
function showLoader() { document.getElementById('loadingSpinner').classList.add('show'); }
function hideLoader() { document.getElementById('loadingSpinner').classList.remove('show'); }

/* 
   বিবরণ: LocalStorage-এর পরিবর্তে আমরা এখন Firebase Database রেফারেন্স ব্যবহার করব।
   db.ref('path/to/data') ব্যবহার করে ডাটাবেসের বিভিন্ন নোড (যেমন: 'members', 'admins') অ্যাক্সেস করা হবে।
   ডেটা এখন আর ব্রাউজারে নয়, ক্লাউডে সংরক্ষিত থাকবে।
*/

// --- Database Operations (Firebase Implementation) ---

// সম্পূর্ণ ডেটাবেস একবার লোড করার ফাংশন
async function loadInitialData() {
  showLoader();
  try {
    const snapshot = await db.ref('/').once('value');
    const data = snapshot.val();
    if (!data) {
      // যদি ডাটাবেস খালি থাকে, তাহলে ডেমো ডেটা দিয়ে শুরু করুন
      await seedDB();
      const newSnapshot = await db.ref('/').once('value');
      return newSnapshot.val();
    }
    return data;
  } catch (error) {
    console.error("Firebase data load failed:", error);
    toast("Error", "Failed to load data from the cloud.");
    return {};
  } finally {
    hideLoader();
  }
}

// ডেমো ডেটা দিয়ে ডাটাবেস তৈরি (Seed) করার ফাংশন
async function seedDB() {
  const seedData = {
    // আপনার আগের seedDB ফাংশনের অবজেক্টটি এখানে থাকবে
    // যেমন: meta, admins, members ইত্যাদি।
  };
  await db.ref('/').set(seedData);
  console.log("Database seeded with demo data.");
}

// Activity Log সেভ করার নতুন ফাংশন
async function logActivity(action, details) {
    const log = {
        id: "LOG-" + Date.now(),
        action,
        details,
        byId: SESSION.user?.id || "SYSTEM",
        byRole: SESSION.user?.role || "SYSTEM",
        at: new Date().toISOString()
    };
    // নতুন লগ ডেটা প্রথমে যুক্ত করার জন্য push ব্যবহার করা হচ্ছে
    await db.ref('activityLogs').push(log);
}


/* =========================================================================
   এডমিন এবং ইউজার প্যানেলের জন্য পৃথক কোড
   =========================================================================*/
/* 
    বিবরণ: অ্যাপ্লিকেশনটি এখন `startApp` ফাংশনে প্রথমে পুরো ডাটাবেস লোড করবে।
    এডমিন প্যানেল এবং মেম্বার প্যানেলের জন্য আলাদা ফাংশন (যেমন `renderAdminDashboard` এবং `renderMemberDashboard`)
    তাদের নিজ নিজ ডেটা (`DB` অবজেক্ট থেকে) রেন্ডার করবে।
    
    এডমিন কন্ট্রোল: এডমিন ফাংশনগুলো (যেমন `approveMember`, `adminAddMember`) সরাসরি Firebase-এর 
    `/members`, `/deposits` ইত্যাদি নোডে ডেটা লেখা, আপডেট বা ডিলিট করার ক্ষমতা রাখে। 
    এর মাধ্যমে এডমিনরা ইউজার প্যানেলের সব কিছু নিয়ন্ত্রণ করতে পারে।
*/

// গ্লোবাল ভ্যারিয়েবল যা সম্পূর্ণ ডেটা ধারণ করবে
let DB = {}; 

// --- App Start ---
async function startApp() {
  DB = await loadInitialData();
  
  if (!DB.admins) {
      toast("Error", "Database seems empty or invalid.");
      return;
  }

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("appPage").style.display = "grid";

  // বাকি কোড একই থাকবে
  document.getElementById("currentUserName").innerText = SESSION.user.name;
  //... ইত্যাদি

  buildSidebar();
  go(SESSION.user.type === "ADMIN" ? "admin_dashboard" : "member_dashboard");

  // রিয়েল-টাইম আপডেটের জন্য Listener সেট করা
  listenForUpdates();
}

function listenForUpdates() {
    // উদাহরণ: পেন্ডিং ডিপোজিট রিয়েল-টাইমে আপডেট হবে
    const pendingDepositsRef = db.ref('deposits').orderByChild('status').equalTo('PENDING');
    
    pendingDepositsRef.on('value', (snapshot) => {
        const pendingDeposits = [];
        snapshot.forEach(childSnapshot => {
            pendingDeposits.push({ key: childSnapshot.key, ...childSnapshot.val() });
        });

        // যদি সাইডবার বা ড্যাশবোর্ডে কাউন্ট দেখানোর ব্যবস্থা থাকে, তবে তা আপডেট করুন
        const pendingCount = pendingDeposits.length;
        // console.log(`Real-time update: ${pendingCount} pending deposits.`);
        buildSidebar(); // সাইডবার রি-বিল্ড করুন নতুন কাউন্ট দিয়ে

        // যদি বর্তমানে ডিপোজিট পেজে থাকেন, তবে টেবিলটি রিফ্রেশ করুন
        if (SESSION.page === 'admin_deposits') {
            renderAdminDeposits();
        }
    });
}

// Login ফাংশন (এখন DB ভ্যারিয়েবল ব্যবহার করবে)
function doLogin() {
    const id = document.getElementById("loginId").value.trim();
    const pass = document.getElementById("loginPass").value.trim();
    // এখানে DB সরাসরি ব্যবহার করা হচ্ছে, কারণ এটি startApp এ লোড হয়ে গেছে
    const admins = Object.values(DB.admins || {});
    const members = Object.values(DB.members || {});

    // ... আপনার বাকি লগিন লজিক ...
    // ... LocalStorage এর পরিবর্তে DB ভ্যারিয়েবল থেকে ডেটা চেক করবে ...

    // লগিন সফল হলে startApp কল হবে, যা এখন async
    if (login_successful) {
        startApp();
    }
}


// --- ফাংশন যা ডেটাবেসে পরিবর্তন আনে (উদাহরণ) ---

// মেম্বার যোগ করার ফাংশন (Firebase ভার্সন)
async function adminAddMember() {
  showLoader();
  try {
    const newMember = {
        // ফর্ম থেকে ডেটা নিন
    };
    
    // Firebase-এ নতুন মেম্বার যোগ করা হচ্ছে
    const newMemberRef = db.ref('members').push();
    await newMemberRef.set(newMember);

    await logActivity("ADD_MEMBER", `Added member: ${newMember.id}`);
    toast("Member Added", `${newMember.name} saved successfully.`);
    
    // নতুন ডেটা রি-লোড করে UI আপডেট করুন
    DB = await loadInitialData();
    renderAdminMembersTable();
    
  } catch(error) {
      console.error("Failed to add member:", error);
      toast("Error", "Could not add member to the database.");
  } finally {
      hideLoader();
  }
}

// মেম্বার অনুমোদন করার ফাংশন (Firebase ভার্সন)
async function approveMember(memberKey) { // key ব্যবহার করা হচ্ছে
  showLoader();
  try {
    // Firebase থেকে குறிப்பிட்ட মেম্বারের ডেটা আপডেট করা হচ্ছে
    await db.ref(`members/${memberKey}`).update({
        approved: true,
        status: "ACTIVE",
        updatedAt: new Date().toISOString()
    });
    
    await logActivity("APPROVE_MEMBER", `Member approved: ${memberKey}`);
    toast("Member Approved", `Member has been approved successfully.`);
    
    DB = await loadInitialData(); // ডেটা রিফ্রেশ করুন
    renderAdminMembersTable(); // টেবিল রি-রেন্ডার করুন

  } catch(error) {
      console.error("Failed to approve member:", error);
      toast("Error", "Could not approve member.");
  } finally {
      hideLoader();
  }
}


/* ===================================================
   পুরোনো সব ফাংশন এর আপডেট ভার্সন
   =================================================== */

/* 
   বিবরণ: আপনার পুরোনো script.js ফাইলের সব ফাংশনকেই `async/await` ব্যবহার করে পরিবর্তন করতে হবে 
   এবং `localStorage` এর পরিবর্তে `db.ref(...)` ব্যবহার করতে হবে।

   উদাহরণ:
   `renderAdminMembers` ফাংশনের ভেতরে টেবিল তৈরি করার সময় `DB.members` ব্যবহার করবে।
   `db.members` এখন আর একটি array নয়, বরং Firebase থেকে পাওয়া একটি অবজেক্ট হবে। তাই `Object.values(DB.members || {})` 
   ব্যবহার করে এটিকে array-তে রূপান্তর করতে হবে।
*/

// নিচে শুধুমাত্র একটি উদাহরণ দেওয়া হলো:
function renderAdminMembersTable() {
    const membersArray = Object.entries(DB.members || {}).map(([key, value]) => ({ key, ...value }));

    // ... এখন `membersArray` ব্যবহার করে টেবিলের HTML তৈরি করুন ...
    // approveMember(m.key) এভাবে key পাস করুন।
}


// ... আপনার পুরোনো script.js এর বাকি সব ফাংশনকে একইভাবে Firebase-এর জন্য আপডেট করতে হবে ...
// প্রতিটি ডেটা পরিবর্তন (add, update, delete) করার পর UI রিফ্রেশ করার জন্য
// হয় নির্দিষ্ট অংশ রি-রেন্ডার করুন অথবা পুরো `DB` আবার লোড করুন।