// Ruta a la carpeta que contiene el modelo exportado de Teachable Machine
const URL_MODELO = "./my_model/";

let model, webcam, maxPredictions;
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

// Carga del modelo e inicialización de la webcam (Lógica base de Teachable Machine)
async function iniciarEscaner() {
    const btn = document.querySelector('.btn-action');
    btn.innerText = "⏳ Cargando Inteligencia Artificial...";
    btn.disabled = true;

    const modelURL = URL_MODELO + "model.json";
    const metadataURL = URL_MODELO + "metadata.json";

    try {
        // Cargar modelo y metadatos con la librería de TensorFlow
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Configuración de la webcam (280x280 px, flip = true)
        const flip = true;
        webcam = new tmImage.Webcam(280, 280, flip);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Ocultar mensaje y activar vista de cámara y animación
        document.getElementById("placeholderText").style.display = "none";
        document.getElementById("scanOverlay").style.display = "block";
        document.getElementById("scanLine").style.display = "block";
        
        const box = document.getElementById("scannerBox");
        box.appendChild(webcam.canvas);

        btn.innerText = "✅ Escáner Activo";
    } catch (e) {
        // Modo demostración por si la carpeta ./my_model/ aún no contiene los archivos
        alert("No se encontró la carpeta './my_model/'. Modo demostración interactivo activado.");
        activarDemo();
        btn.innerText = "⚡ Activar Cámara IA";
        btn.disabled = false;
    }
}

// Bucle de animación continuo para actualizar el vídeo y la predicción
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// Envía los fotogramas de la cámara al modelo de red neuronal
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    renderizarResultados(prediction);
}

// Dibuja los porcentajes y barras de progreso en el HTML
function renderizarResultados(predicciones) {
    const container = document.getElementById("predictionsContainer");
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
            <div class="pred-bar-container">
                <div class="pred-info">
                    <span>📦 ${pred.className}</span>
                    <span><strong>${porcentaje}%</strong></span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill" style="width: ${porcentaje}%;"></div>
                </div>
            </div>
        `;
    });

    // Si la certeza de la IA supera el 70%, actualiza los datos de impacto ecológico
    if (mayorProbabilidad > 0.70) {
        actualizarImpacto(claseDetectada);
    }
}

// Actualiza el diagnóstico de impacto ambiental según la clase identificada
function actualizarImpacto(clase) {
    const infoBox = document.getElementById("ecoImpactInfo");
    
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

// Simulación para demostración en caso de no tener la cámara o el modelo conectado aún
function activarDemo() {
    renderizarResultados([
        { className: "Plástico (Botella PET)", probability: 0.95 },
        { className: "Papel / Cartón", probability: 0.03 },
        { className: "Orgánico (Yerba/Comida)", probability: 0.02 }
    ]);
    
    puntos += 10;
    document.getElementById("puntosValor").innerText = puntos;
}
