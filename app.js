// La dirección del modelo exportado desde Teachable Machine
const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;
let puntos = 120;

// Base de datos de objetos y elementos comunes ajustada a Paraguay
const guiaResiduo = {
    "Plastico": {
        nombreObjeto: "Botella / Envase Plástico (PET)",
        contenedor: "♻️ Reciclables / Contenedor Limpio",
        degradacion: "450 a 1,000 años",
        co2: "0.05 kg de CO₂ evitado en Asunción"
    },
    "Papel": {
        nombreObjeto: "Cartón / Papel de empaque",
        contenedor: "📦 Papel y Cartón (Seco y limpio)",
        degradacion: "2 a 5 meses",
        co2: "0.02 kg de CO₂ evitado"
    },
    "Vidrio": {
        nombreObjeto: "Botella o Frasco de Vidrio",
        contenedor: "🍾 Vidrio (Reutilizable y limpio)",
        degradacion: "Más de 4,000 años",
        co2: "0.08 kg de CO₂ evitado"
    },
    "Organico": {
        nombreObjeto: "Residuo Orgánico (Yerba mate, restos de comida)",
        contenedor: "🌱 Compostaje domiciliario / Abono para huertas",
        degradacion: "2 a 4 semanas",
        co2: "Reduce la acumulación de basura en vertederos"
    }
};

// Función principal de inicialización (Conectada con el botón de la interfaz)
async function iniciarEscaner() {
    const btn = document.querySelector('.btn-action');
    if (btn) {
        btn.innerText = "⏳ Cargando Inteligencia Artificial...";
        btn.disabled = true;
    }

    // CORRECCIÓN CLAVE: Apuntar exactamente a los nombres de archivo sin espacios
    const modelURL = URL + "model_2.json";
    const metadataURL = URL + "metadata_2.json";

    try {
        // Cargar el modelo y metadatos de Teachable Machine
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Configuración de la webcam (ancho, alto, voltear)
        const flip = true; 
        webcam = new tmImage.Webcam(280, 280, flip);
        await webcam.setup(); // solicitar acceso a la cámara web
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Ocultar texto de espera y mostrar la cámara en el contenedor
        const placeholder = document.getElementById("placeholderText");
        if (placeholder) placeholder.style.display = "none";

        const scanOverlay = document.getElementById("scanOverlay");
        const scanLine = document.getElementById("scanLine");
        if (scanOverlay) scanOverlay.style.display = "block";
        if (scanLine) scanLine.style.display = "block";

        const webcamContainer = document.getElementById("scannerBox") || document.getElementById("webcam-container");
        if (webcamContainer) {
            webcamContainer.appendChild(webcam.canvas);
        }

        if (btn) btn.innerText = "✅ Escáner Activo";
    } catch (e) {
        console.error("Error al cargar el modelo:", e);
        alert("No se encontró el modelo local. Activando modo demostración interactivo.");
        activarDemo();
        if (btn) {
            btn.innerText = "⚡ Activar Cámara IA";
            btn.disabled = false;
        }
    }
}

// Bucle continuo de actualización de la cámara
async function loop() {
    webcam.update(); // actualizar fotograma de la webcam
    await predict();
    window.requestAnimationFrame(loop);
}

// Ejecutar la imagen de la cámara a través del modelo de imagen
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    // Renderizar resultados con las barras de progreso personalizadas
    renderizarResultadosPersonalizados(prediction);
}

// Renderizado con barras y diseño avanzado
function renderizarResultadosPersonalizados(predicciones) {
    const container = document.getElementById("predictionsContainer") || document.getElementById("label-container");
    if (!container) return;
    
    container.innerHTML = "";

    let claseDetectada = "";
    let mayorProbabilidad = 0;

    predicciones.forEach(pred => {
        const porcentaje = (pred.probability * 100).toFixed(0);
        
        if (pred.probability > mayorProbabilidad) {
            mayorProbabilidad = pred.probability;
            claseDetectada = pred.className;
        }

        container.innerHTML += `
            <div class="pred-bar-container" style="margin-bottom: 12px;">
                <div class="pred-info" style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px;">
                    <span>📦 ${pred.className}</span>
                    <span><strong>${porcentaje}%</strong></span>
                </div>
                <div class="bar-bg" style="width: 100%; height: 10px; background-color: #1a221e; border-radius: 10px; overflow: hidden;">
                    <div class="bar-fill" style="height: 100%; width: ${porcentaje}%; background: #00ff87; box-shadow: 0 0 10px #00ff87; border-radius: 10px; transition: width 0.4s ease;"></div>
                </div>
            </div>
        `;
    });

    if (mayorProbabilidad > 0.70) {
        actualizarImpacto(claseDetectada);
    }
}

// Actualizar los datos ecológicos según la clase detectada
function actualizarImpacto(clase) {
    const infoBox = document.getElementById("ecoImpactInfo");
    if (!infoBox) return;
    
    let clave = Object.keys(guiaResiduo).find(k => clase.toLowerCase().includes(k.toLowerCase())) || "Plastico";
    let datos = guiaResiduo[clave];

    infoBox.innerHTML = `
        <hr style="border-color: var(--border-color); margin-bottom: 15px;">
        <p><strong>Objeto detectado:</strong> ${datos.nombreObjeto}</p>
        <p><strong>Destino sugerido:</strong> ${datos.contenedor}</p>
        <p><strong>Tiempo de degradación:</strong> ${datos.degradacion}</p>
        <p><strong>Impacto local:</strong> ${datos.co2}</p>
    `;
}

// Modo demostración por si no se encuentra la carpeta local del modelo
function activarDemo() {
    const container = document.getElementById("predictionsContainer") || document.getElementById("label-container");
    if (!container) return;

    container.innerHTML = `
        <div class="pred-bar-container" style="margin-bottom: 12px;">
            <div class="pred-info" style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px;">
                <span>📦 Plástico (Botella de Gaseosa)</span>
                <span><strong>95%</strong></span>
            </div>
            <div class="bar-bg" style="width: 100%; height: 10px; background-color: #1a221e; border-radius: 10px; overflow: hidden;">
                <div class="bar-fill" style="height: 100%; width: 95%; background: #00ff87; box-shadow: 0 0 10px #00ff87; border-radius: 10px;"></div>
            </div>
        </div>
    `;
    
    puntos += 10;
    const badgePuntos = document.getElementById("puntosValor");
    if (badgePuntos) badgePuntos.innerText = puntos;

    actualizarImpacto("Plastico");
}

// Alias para mantener compatibilidad con el botón de inicio HTML (`init()`)
function init() {
    iniciarEscaner();
}
