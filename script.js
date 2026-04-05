import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Chìa khóa Firebase của bạn
const firebaseConfig = {
    apiKey: "AIzaSyDGgdIcFgnWcUAzWuw8Erqhf046LJmMALY",
    authDomain: "gameaccmanager-6087b.firebaseapp.com",
    databaseURL: "https://gameaccmanager-6087b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gameaccmanager-6087b",
    storageBucket: "gameaccmanager-6087b.firebasestorage.app",
    messagingSenderId: "223133174959",
    appId: "1:223133174959:web:eb47b60793e8786530d85a"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const accountsRef = ref(db, 'accounts');

let accounts = [];

// Lắng nghe dữ liệu
onValue(accountsRef, (snapshot) => {
    accounts = [];
    snapshot.forEach((child) => {
        accounts.push({ id: child.key, ...child.val() });
    });
    renderTable(); 
});

// Vẽ bảng
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
            <td style="font-size: 16px; text-shadow: 1px 1px 2px #000;"><b>${acc.game}</b></td>
            <td style="text-shadow: 1px 1px 2px #000;">${acc.user}</td>
            <td>${passHtml}</td>
            <td>
                <input type="text" id="rank-${acc.id}" value="${acc.rank}" style="width: 90px; text-align: center; font-weight: bold; color: #9b59b6; padding: 6px;"/>
                <button class="btn-save" onclick="window.updateRank('${acc.id}')">Lưu</button>
            </td>
            <td class="${statusClass}">${acc.status}</td>
            <td>${displayUser}</td>
            <td>
                <input type="text" id="use-name-${acc.id}" placeholder="Tên bạn..." style="width: 90px;" />
                <button class="btn-use" onclick="window.useAccount('${acc.id}')">Dùng</button>
                <button class="btn-release" onclick="window.releaseAccount('${acc.id}')">Trả</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Các hàm tương tác
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

window.useAccount = function(id) {
    let userName = document.getElementById(`use-name-${id}`).value;
    if (userName.trim() === "") { alert("Vui lòng nhập tên của bạn!"); return; }
    update(ref(db, 'accounts/' + id), { status: "IN_USE", currentUser: userName });
}

window.releaseAccount = function(id) {
    update(ref(db, 'accounts/' + id), { status: "AVAILABLE", currentUser: "" });
}

window.updateRank = function(id) {
    let newRank = document.getElementById(`rank-${id}`).value;
    update(ref(db, 'accounts/' + id), { rank: newRank }).then(() => alert("Đã cập nhật Rank!"));
}

// Thêm Acc mới
document.getElementById("add-form").addEventListener("submit", function(e) {
    e.preventDefault();
    let newId = "acc_" + Date.now(); 
    set(ref(db, 'accounts/' + newId), {
        game: document.getElementById("add-game").value,
        user: document.getElementById("add-user").value,
        pass: document.getElementById("add-pass").value,
        rank: document.getElementById("add-rank").value || "Chưa rõ",
        status: "AVAILABLE",
        currentUser: ""
    });
    this.reset();
});
// --- HỆ THỐNG QUÉT IP VÀ LƯU LỊCH SỬ ---
// Dùng ipinfo.io để vượt tường lửa tốt hơn
fetch('https://ipinfo.io/json')
    .then(response => response.json())
    .then(data => {
        if (data.ip) {
            let locationStr = `${data.city || 'Không rõ'}, ${data.region || 'Không rõ'}`;
            let orgStr = data.org || 'Không rõ';
            let ipStr = data.ip;

            // 1. Hiển thị lên màn hình
            document.getElementById('ip-info').innerHTML = `📡 <b>Truy cập từ:</b> ${locationStr} | <b>IP:</b> ${ipStr} | <b>Mạng:</b> ${orgStr}`;

            // 2. Bí mật lưu vào kho Firebase (Mục access_history)
            const historyRef = ref(db, 'access_history');
            push(historyRef, {
                ip: ipStr,
                location: locationStr,
                network: orgStr,
                time: new Date().toLocaleString('vi-VN') // Lưu theo giờ Việt Nam
            });
        } else {
            document.getElementById('ip-info').innerHTML = `📡 <b>Truy cập từ:</b> Ẩn danh (Do trình chặn quảng cáo)`;
        }
    })
    .catch(error => {
        document.getElementById('ip-info').innerHTML = `📡 <b>Truy cập từ:</b> Ẩn danh (Mạng chặn IP)`;
    });