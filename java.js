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
const tempValue = document.getElementById('temp-value');
const tempNivel = document.getElementById('temp-nivel');
const humValue = document.getElementById('hum-value');
const tempUpdate = document.getElementById('temp-update');
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

// ---------- Temperatura y humedad (DHT22) ----------
function nivelTemperatura(t) {
    if (t < 10) return { texto: "Frío", clase: "text-sky-400" };
    if (t < 18) return { texto: "Fresco", clase: "text-cyan-400" };
    if (t < 27) return { texto: "Confortable", clase: "text-emerald-400" };
    if (t < 33) return { texto: "Cálido", clase: "text-amber-400" };
    return { texto: "Calor intenso", clase: "text-red-400" };
}

let offsetServidor = 0;          // diferencia entre el reloj de esta PC y el de Firebase
let ultimaActualizacion = null;  // hora (según Firebase) de la última medición

onValue(ref(db, '.info/serverTimeOffset'), (snap) => { offsetServidor = snap.val() || 0; });

onValue(ref(db, 'sensor_dht'), (snapshot) => {
    const d = snapshot.val();
    if (!d || typeof d.temperatura !== 'number') return;

    const nivel = nivelTemperatura(d.temperatura);
    tempValue.innerText = d.temperatura.toFixed(1);
    tempValue.className = "text-6xl font-extrabold " + nivel.clase;
    tempNivel.innerText = nivel.texto;
    tempNivel.className = "text-sm font-semibold " + nivel.clase;
    humValue.innerText = typeof d.humedad === 'number' ? d.humedad.toFixed(0) : "--";
    ultimaActualizacion = d.actualizado ?? null;
});

// Cada segundo: "hace X s" o aviso si el sensor dejó de enviar datos
setInterval(() => {
    if (ultimaActualizacion === null) return;
    const seg = Math.round((Date.now() + offsetServidor - ultimaActualizacion) / 1000);
    if (seg < 60) {
        tempUpdate.innerText = "🟢 En línea · actualizado hace " + Math.max(seg, 0) + " s";
        tempUpdate.className = "text-xs text-emerald-400 mt-1";
    } else {
        tempUpdate.innerText = "🔴 Sin señal del sensor hace " + Math.floor(seg / 60) + " min";
        tempUpdate.className = "text-xs text-red-400 mt-1";
    }
}, 1000);

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
