import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// 1. Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDGgdIcFgnWcUAzWuw8Erqhf046LJmMALY",
    authDomain: "gameaccmanager-6087b.firebaseapp.com",
    databaseURL: "https://gameaccmanager-6087b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gameaccmanager-6087b",
    storageBucket: "gameaccmanager-6087b.firebasestorage.app",
    messagingSenderId: "223133174959",
    appId: "1:223133174959:web:eb47b60793e8786530d85a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const accountsRef = ref(db, 'accounts');

// BIẾN TOÀN CỤC (Để lưu dữ liệu IP dùng chung)
let accounts = [];
let currentIPInfo = { ip: "Đang quét...", loc: "Đang quét...", net: "Đang quét..." };

// 2. HỆ THỐNG QUÉT IP (Dùng lại link ipinfo.io bạn muốn)
fetch('https://ipinfo.io/json')
    .then(res => res.json())
    .then(data => {
        // Cập nhật dữ liệu thật lấy được từ ipinfo
        currentIPInfo = {
            ip: data.ip,
            loc: data.city + ", " + data.region,
            net: data.org
        };
        // Hiện lên bảng xanh ngay lập tức
        document.getElementById('ip-info').innerHTML = `📡 <b>Truy cập từ:</b> ${currentIPInfo.loc} | <b>IP:</b> ${currentIPInfo.ip} | <b>Mạng:</b> ${currentIPInfo.net}`;
        
        // Lưu lịch sử vào Firebase
        push(ref(db, 'access_history'), {
            ip: currentIPInfo.ip,
            location: currentIPInfo.loc,
            network: currentIPInfo.net,
            time: new Date().toLocaleString('vi-VN')
        });
    })
    .catch(err => {
        console.log("Lỗi quét IP:", err);
        document.getElementById('ip-info').innerHTML = `📡 <b>Truy cập từ:</b> Lỗi quét dữ liệu`;
    });

// 3. LẮNG NGHE DỮ LIỆU TỪ FIREBASE
onValue(accountsRef, (snapshot) => {
    accounts = [];
    snapshot.forEach((child) => {
        accounts.push({ id: child.key, ...child.val() });
    });
    renderTable(); 
});

// 4. VẼ BẢNG
function renderTable() {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = ""; 
    accounts.forEach(acc => {
        const isAvail = acc.status === "AVAILABLE";
        const statusClass = isAvail ? "status-available" : "status-in-use";
        const displayUser = acc.currentUser === "" ? 
            `<span style='color: #bdc3c7; font-style: italic; text-shadow: 1px 1px 2px #000;'>Trống</span>` : 
            `<span style='color: #00ffff; font-weight: bold; font-size: 16px; text-shadow: 1px 1px 3px #000;'>${acc.currentUser}</span>`;
        
        let passHtml = isAvail ? 
            `<span style="color: #bdc3c7; font-style: italic; font-size: 13px; text-shadow: 1px 1px 2px #000;">🔒 Ấn Dùng để xem</span>` :
            `<span class="pwd-hidden" style="color: #ecf0f1; text-shadow: 1px 1px 2px #000;">******</span>
             <span class="pwd-show" style="display:none; color:#f1c40f; font-weight:bold; text-shadow: 1px 1px 2px #000;">${acc.pass}</span>
             <button type="button" class="btn-show" onclick="window.togglePass(this)">👁️ Hiện</button>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${acc.game}</b></td>
            <td>${acc.user}</td>
            <td>${passHtml}</td>
            <td>
                <input type="text" id="rank-${acc.id}" value="${acc.rank}" style="width: 80px;"/>
                <button class="btn-save" onclick="window.updateRank('${acc.id}')">Lưu</button>
            </td>
            <td class="${statusClass}">${acc.status}</td>
            <td>${displayUser}</td>
            <td>
                <input type="text" id="use-name-${acc.id}" placeholder="Tên bạn..." style="width: 80px;" />
                <button class="btn-use" onclick="window.useAccount('${acc.id}')">Dùng</button>
                <button class="btn-release" onclick="window.releaseAccount('${acc.id}')">Trả</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. CÁC HÀM TƯƠNG TÁC
window.togglePass = function(btn) {
    let td = btn.parentElement;
    let hidden = td.querySelector('.pwd-hidden');
    let show = td.querySelector('.pwd-show');
    if (hidden.style.display === 'none') {
        hidden.style.display = 'inline'; show.style.display = 'none'; btn.innerHTML = "👁️ Hiện";
    } else {
        hidden.style.display = 'none'; show.style.display = 'inline'; btn.innerHTML = "🙈 Ẩn";
    }
}

// HÀM GỬI EMAIL (Phải dùng chung dữ liệu với biến currentIPInfo ở trên)
function sendEmailLog(accData, useName) {
    emailjs.init("waVlQYTBYZhIFfblD"); 
    const params = {
        game_acc: accData.game + " (" + accData.user + ")",
        user_name: useName,
        time: new Date().toLocaleString('vi-VN'),
        ip: currentIPInfo.ip,
        location: currentIPInfo.loc,
        network: currentIPInfo.net
    };
    emailjs.send("service_s6py8rb", "template_98h2zhk", params)
        .then(() => console.log("Mail đã gửi!"))
        .catch(e => console.log("Lỗi gửi mail!", e));
}

window.useAccount = function(id) {
    let userName = document.getElementById(`use-name-${id}`).value;
    if (userName.trim() === "") { alert("Vui lòng nhập tên!"); return; }
    
    let acc = accounts.find(a => a.id === id);
    update(ref(db, 'accounts/' + id), { status: "IN_USE", currentUser: userName })
    .then(() => {
        sendEmailLog(acc, userName);
    });
}

window.releaseAccount = function(id) {
    update(ref(db, 'accounts/' + id), { status: "AVAILABLE", currentUser: "" });
}

window.updateRank = function(id) {
    let newRank = document.getElementById(`rank-${id}`).value;
    update(ref(db, 'accounts/' + id), { rank: newRank }).then(() => alert("Đã cập nhật!"));
}

document.getElementById("add-form").addEventListener("submit", function(e) {
    e.preventDefault();
    set(ref(db, 'accounts/acc_' + Date.now()), {
        game: document.getElementById("add-game").value,
        user: document.getElementById("add-user").value,
        pass: document.getElementById("add-pass").value,
        rank: document.getElementById("add-rank").value || "Chưa rõ",
        status: "AVAILABLE",
        currentUser: ""
    });
    this.reset();
});