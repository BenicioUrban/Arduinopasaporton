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

// ---------- Apariencia de la tarjeta según el estado ----------
const ESTADOS = {
    reposo: {
        card: "bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-500",
        icon: "w-24 h-24 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 mb-6 text-4xl transition-all duration-300",
        emoji: "🏢",
        texto: "Monitoreando...",
        textoClase: "text-3xl font-bold tracking-wide text-slate-200"
    },
    entrada: {
        card: "bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-500",
        icon: "w-24 h-24 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 mb-6 text-4xl transition-all duration-300 animate-bounce",
        emoji: "➡️",
        texto: "¡Alguien Entró!",
        textoClase: "text-3xl font-bold tracking-wide text-emerald-400"
    },
    salida: {
        card: "bg-slate-900 border border-orange-500/50 rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-500",
        icon: "w-24 h-24 rounded-full flex items-center justify-center bg-orange-500/20 text-orange-400 mb-6 text-4xl transition-all duration-300 animate-bounce",
        emoji: "⬅️",
        texto: "¡Alguien Salió!",
        textoClase: "text-3xl font-bold tracking-wide text-orange-400"
    }
};

function mostrarEstado(nombre) {
    const e = ESTADOS[nombre];
    statusCard.className = e.card;
    statusIcon.className = e.icon;
    statusIcon.innerHTML = e.emoji;
    statusText.innerText = e.texto;
    statusText.className = e.textoClase;
}

// ---------- Un único listener: contador + estado de la tarjeta ----------
onValue(ref(db, 'sensor_pir'), (snapshot) => {
    const datos = snapshot.val() || {};

    counterValue.innerText = datos.personas_dentro ?? 0;

    if (datos.detectado_entrada === true) mostrarEstado('entrada');
    else if (datos.detectado_salida === true) mostrarEstado('salida');
    else mostrarEstado('reposo');   // antes faltaba esto: volver a "Monitoreando..."
}, (error) => {
    // Pasa, por ejemplo, si las reglas de la base rechazan la lectura
    console.error("Error de Firebase:", error.message);
    statusText.innerText = "Sin conexión con la base";
});

// ---------- Simulador manual (botones de la página) ----------
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
