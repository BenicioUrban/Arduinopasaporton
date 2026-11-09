import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get, update, query, orderByChild, startAt, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const graficoCanvas = document.getElementById('grafico');
const graficoPeriodos = document.getElementById('grafico-periodos');
const graficoEstado = document.getElementById('grafico-estado');
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
    console.log("sensor_dht recibido:", d);   // para depurar: F12 > Consola
    if (!d) return;

    const temp = Number(d.temperatura);
    if (Number.isNaN(temp)) return;

    const hum = Number(d.humedad);
    const nivel = nivelTemperatura(temp);
    tempValue.innerText = temp.toFixed(1);
    tempValue.className = "text-6xl font-extrabold " + nivel.clase;
    tempNivel.innerText = nivel.texto;
    tempNivel.className = "text-sm font-semibold " + nivel.clase;
    humValue.innerText = Number.isNaN(hum) ? "--" : hum.toFixed(0);
    ultimaActualizacion = d.actualizado ?? null;
}, (error) => {
    console.error("Error leyendo sensor_dht:", error.message);
    tempUpdate.innerText = "⚠️ No se pueden leer los datos de temperatura (revisá las reglas)";
    tempUpdate.className = "text-xs text-red-400 mt-1";
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

// ---------- Gráfico histórico (personas, temperatura y humedad) ----------
// El ESP32 guarda un punto por minuto en Firebase (/historial). Por eso el gráfico se ve
// igual desde cualquier dispositivo y no depende de que esta página estuviera abierta.
const PERIODOS = [
    { etiqueta: "30 min",   ms: 30 * 60 * 1000 },
    { etiqueta: "1 h",      ms: 60 * 60 * 1000 },
    { etiqueta: "2 h",      ms: 2 * 60 * 60 * 1000 },
    { etiqueta: "6 h",      ms: 6 * 60 * 60 * 1000 },
    { etiqueta: "12 h",     ms: 12 * 60 * 60 * 1000 },
    { etiqueta: "1 día",    ms: 24 * 60 * 60 * 1000 },
    { etiqueta: "3 días",   ms: 3 * 24 * 60 * 60 * 1000 },
    { etiqueta: "1 semana", ms: 7 * 24 * 60 * 60 * 1000 }
];

const COLOR_PERSONAS = "#22d3ee";               // cian, como el contador
const COLOR_TEMP = "hsl(32, 95%, 55%)";         // naranja
const COLOR_HUM = "hsla(32, 30%, 62%, 0.6)";    // mismo tono, menos saturado y transparente
const COLOR_HUM_TEXTO = "hsl(32, 30%, 62%)";    // igual pero sin transparencia (números del eje)

let periodoActual = PERIODOS[1];   // arranca en 1 hora
let ventanaCargadaMs = 0;          // cuánta historia hay descargada
let registros = [];
let detenerHistorial = null;
let grafico = null;
let renderPendiente = null;

function crearGrafico() {
    try {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.12)';
        Chart.defaults.font.family = "Outfit, sans-serif";
        return new Chart(graficoCanvas, {
            type: 'line',
            data: {
                datasets: [
                    { label: 'Personas dentro', yAxisID: 'yPersonas', data: [],
                      borderColor: COLOR_PERSONAS, backgroundColor: 'rgba(34, 211, 238, 0.12)',
                      fill: true, stepped: 'after', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                    { label: 'Temperatura (°C)', yAxisID: 'yTemp', data: [],
                      borderColor: COLOR_TEMP, backgroundColor: COLOR_TEMP,
                      borderWidth: 2.5, tension: 0.35, pointRadius: 0, pointHoverRadius: 4 },
                    { label: 'Humedad (%)', yAxisID: 'yHum', data: [],
                      borderColor: COLOR_HUM, backgroundColor: COLOR_HUM,
                      borderWidth: 2, borderDash: [6, 5], tension: 0.35, pointRadius: 0, pointHoverRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { boxWidth: 28, boxHeight: 3 } },
                    tooltip: { filter: (item) => item.parsed.y !== null }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { tooltipFormat: 'dd/MM HH:mm', displayFormats: { minute: 'HH:mm', hour: 'HH:mm', day: 'dd/MM' } },
                        ticks: { maxRotation: 0, autoSkipPadding: 24 }
                    },
                    yPersonas: { position: 'left', beginAtZero: true, suggestedMax: 4,
                                 ticks: { precision: 0, color: COLOR_PERSONAS } },
                    yTemp: { position: 'right', grid: { drawOnChartArea: false },
                             ticks: { color: COLOR_TEMP, callback: (v) => v + ' °C' } },
                    yHum: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false },
                            ticks: { color: COLOR_HUM_TEXTO, callback: (v) => v + ' %' } }
                }
            }
        });
    } catch (e) {
        console.error("Gráfico:", e);
        graficoEstado.innerText = "No se pudo cargar la librería del gráfico (¿hay internet?).";
        return null;
    }
}

function actualizarGrafico() {
    if (!grafico) return;
    const ahora = Date.now() + offsetServidor;
    const desde = ahora - periodoActual.ms;
    registros = registros.filter((r) => r.ts >= ahora - ventanaCargadaMs);

    // Para períodos largos se agrupan los puntos (promedio de temperatura y humedad,
    // máximo de personas) y así el gráfico queda liviano.
    const bucketMs = Math.max(60 * 1000, periodoActual.ms / 400);
    const gapMs = Math.max(bucketMs * 3, 4 * 60 * 1000);   // más que esto sin datos = ESP32 apagado

    const grupos = new Map();
    let cantidad = 0;
    for (const r of registros) {
        if (r.ts < desde) continue;
        cantidad++;
        const k = Math.floor(r.ts / bucketMs);
        const g = grupos.get(k) || { n: 0, ts: 0, temp: 0, hum: 0, pers: 0 };
        g.n++;
        g.ts += r.ts;
        g.temp += r.temp;
        g.hum += r.hum;
        g.pers = Math.max(g.pers, r.pers);
        grupos.set(k, g);
    }

    const pers = [], temp = [], hum = [];
    let xPrev = null;
    for (const k of [...grupos.keys()].sort((a, b) => a - b)) {
        const g = grupos.get(k);
        const x = g.ts / g.n;
        if (xPrev !== null && x - xPrev > gapMs) {          // hueco: se corta la línea
            pers.push({ x: xPrev + 1, y: null });
            temp.push({ x: xPrev + 1, y: null });
            hum.push({ x: xPrev + 1, y: null });
        }
        pers.push({ x, y: g.pers });
        temp.push({ x, y: Math.round(g.temp / g.n * 10) / 10 });
        hum.push({ x, y: Math.round(g.hum / g.n * 10) / 10 });
        xPrev = x;
    }

    grafico.data.datasets[0].data = pers;
    grafico.data.datasets[1].data = temp;
    grafico.data.datasets[2].data = hum;
    grafico.options.scales.x.min = desde;
    grafico.options.scales.x.max = ahora;
    grafico.update();

    graficoEstado.innerText = cantidad > 0
        ? cantidad + " registros en este período · se actualiza solo"
        : "Todavía no hay datos en este período (el ESP32 guarda un punto por minuto).";
}

function pedirRender() {
    clearTimeout(renderPendiente);
    renderPendiente = setTimeout(actualizarGrafico, 200);
}

// Descarga el historial del período y se queda escuchando los puntos nuevos
function suscribir() {
    if (detenerHistorial) detenerHistorial();
    registros = [];
    graficoEstado.innerText = "Cargando historial...";
    const desde = Date.now() + offsetServidor - ventanaCargadaMs;
    const consulta = query(ref(db, 'historial'), orderByChild('ts'), startAt(desde));
    detenerHistorial = onChildAdded(consulta, (snap) => {
        const r = snap.val();
        if (r && Number.isFinite(r.ts) && Number.isFinite(r.temp)) {
            registros.push({
                ts: r.ts,
                temp: r.temp,
                hum: Number.isFinite(r.hum) ? r.hum : 0,
                pers: Number.isFinite(r.pers) ? r.pers : 0
            });
            pedirRender();
        }
    }, (error) => {
        console.error("Error leyendo historial:", error.message);
        graficoEstado.innerText = "⚠️ No se puede leer el historial (revisá las reglas de Firebase).";
    });
}

function elegirPeriodo(p) {
    periodoActual = p;
    marcarBotones();
    if (p.ms > ventanaCargadaMs) {      // hace falta bajar más historia
        ventanaCargadaMs = p.ms;
        suscribir();
    } else {                            // ya está descargada: solo se redibuja
        actualizarGrafico();
    }
}

const ESTILO_BOTON = "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ";
const ESTILO_ACTIVO = "bg-cyan-600 text-white";
const ESTILO_INACTIVO = "bg-slate-800 text-slate-400 hover:bg-slate-700";

function marcarBotones() {
    graficoPeriodos.querySelectorAll('button').forEach((b) => {
        b.className = ESTILO_BOTON + (Number(b.dataset.ms) === periodoActual.ms ? ESTILO_ACTIVO : ESTILO_INACTIVO);
    });
}

PERIODOS.forEach((p) => {
    const b = document.createElement('button');
    b.textContent = p.etiqueta;
    b.dataset.ms = p.ms;
    b.addEventListener('click', () => elegirPeriodo(p));
    graficoPeriodos.appendChild(b);
});
marcarBotones();

grafico = crearGrafico();

// Arranca cuando ya se conoce la diferencia de reloj con Firebase
let graficoIniciado = false;
onValue(ref(db, '.info/serverTimeOffset'), () => {
    if (!graficoIniciado && grafico) {
        graficoIniciado = true;
        elegirPeriodo(periodoActual);
    }
});

setInterval(actualizarGrafico, 30000);   // hace avanzar la ventana de tiempo

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
