import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAZzTkaGXdrCMPdxyIPfw51UW-mOckATsE",
    authDomain: "proyectoporton-71256.firebaseapp.com",
    databaseURL: "https://proyectoporton-71256-default-rtdb.firebaseio.com",
    projectId: "proyectoporton-71256",
    storageBucket: "proyectoporton-71256.firebasestorage.app",
    messagingSenderId: "7141665225",
    appId: "1:7141665225:web:1cc3b2668896c247e4e018",
    measurementId: "G-C6DRTDSPS3"
    };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const statusCard = document.getElementById('status-card');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const counterValue = document.getElementById('counter-value');
const btnSimularEntrada = document.getElementById('btn-simular-entrada');
const btnSimularSalida = document.getElementById('btn-simular-salida');

onValue(ref(db, 'sensor_pir/personas_dentro'), (snapshot) => {
const total = snapshot.val();
counterValue.innerText = total !== null ? total : 0;
});

onValue(ref(db, 'sensor_pir/detectado_entrada'), (snapshot) => {
if (snapshot.val() === true) {
statusCard.className = "bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-500";
statusIcon.className = "w-24 h-24 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 mb-6 text-4xl transition-all duration-300 animate-bounce";
statusIcon.innerHTML = "➡️";
statusText.innerText = "¡Alguien Entró!";
statusText.className = "text-3xl font-bold tracking-wide text-emerald-400";
}
});

onValue(ref(db, 'sensor_pir/detectado_salida'), (snapshot) => {
if (snapshot.val() === true) {
statusCard.className = "bg-slate-900 border border-orange-500/50 rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-500";
statusIcon.className = "w-24 h-24 rounded-full flex items-center justify-center bg-orange-500/20 text-orange-400 mb-6 text-4xl transition-all duration-300 animate-bounce";
statusIcon.innerHTML = "⬅️";
statusText.innerText = "¡Alguien Salió!";
statusText.className = "text-3xl font-bold tracking-wide text-orange-400";
}
});

async function simularMovimiento(tipo) {
const dbRef = ref(db, 'sensor_pir');
const snapshot = await get(dbRef);
let datos = snapshot.val() || { personas_dentro: 0 };
let actuales = parseInt(datos.personas_dentro) || 0;

if (tipo === 'entrada') {
actuales += 1;
await update(dbRef, {
personas_dentro: actuales,
detectado_entrada: true,
detectado_salida: false
});
setTimeout(() => set(ref(db, 'sensor_pir/detectado_entrada'), false), 2000);
}
else if (tipo === 'salida') {
if (actuales > 0) actuales -= 1;
await update(dbRef, {
personas_dentro: actuales,
detectado_entrada: false,
detectado_salida: true
});
setTimeout(() => set(ref(db, 'sensor_pir/detectado_salida'), false), 2000);
}
}

btnSimularEntrada.addEventListener('click', () => simularMovimiento('entrada'));
btnSimularSalida.addEventListener('click', () => simularMovimiento('salida'));
