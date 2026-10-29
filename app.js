// Dirección del modelo exportado desde Teachable Machine
const URL_MODELO = "./my_model/";

let model, webcam, maxPredictions;
let puntos = 120;

// Base de datos de objetos y elementos comunes en Paraguay
const guiaResiduo = {
    "Plastico": {
        nombreObjeto: "Botella / Envase Plástico (PET)",
        contenedor: "♻️ Contenedor de Reciclables (Plásticos limpios)",
        degradacion: "450 a 1,000 años",
        co2: "Evita la contaminación de arroyos urbanos en Asunción."
    },
    "Papel": {
        nombreObjeto: "Cartón / Papel de empaque",
        contenedor: "📦 Reciclaje de Papel y Cartón (Seco)",
        degradacion: "2 a 5 meses",
        co2: "Reduce la tala de árboles para la industria papelera."
    },
    "Vidrio": {
        nombreObjeto: "Botella o Frasco de Vidrio",
        contenedor: "🟩 Contenedor Verde (Vidrio reutilizable)",
        degradacion: "Más de 4,000 años",
        co2: "100% reciclable infinitas veces sin perder calidad."
    },
    "Organico": {
        nombreObjeto: "Residuo Orgánico (Yerba mate, restos de comida)",
        contenedor: "🌱 Compostaje domiciliario o abono para huertas",
        degradacion: "2 a 4 semanas",
        co2: "Excelente para nutrir la tierra y reducir la basura en Cateura."
    }
};

async function iniciarEscaner() {
    const btn = document.querySelector('.btn-action');
    btn.innerText = "⏳ Cargando Inteligencia Artificial...";
    btn.disabled = true;

    const modelURL = URL_MODELO + "model.json";
    const metadataURL = URL_MODELO + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        webcam = new tmImage.Webcam(280, 280, true);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);

        document.getElementById("placeholderText").style.display = "none";
        document.getElementById("scanOverlay").style.display = "block";
        document.getElementById("scanLine").style.display = "block";
        
        const box = document.getElementById("scannerBox");
        box.appendChild(webcam.canvas);

        btn.innerText = "✅ Escáner Activo";
    } catch (e) {
        alert("No se encontró el modelo local. Activando modo demostración con objetos de Paraguay.");
        activarDemo();
        btn.innerText = "⚡ Activar Cámara IA";
        btn.disabled = false;
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    renderizarResultados(prediction);
}

function renderizarResultados(predicciones) {
    const container = document.getElementById("predictionsContainer");
    container.innerHTML = "";

    let claseDetectada = "";
    let mayorProbabilidad = 0;

    predicciones.forEach(pred => {
        const porcentaje = (pred.probability * 100).toFixed(0);
        
        if(pred.probability > mayorProbabilidad) {
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

    if (mayorProbabilidad > 0.70) {
        actualizarImpacto(claseDetectada);
    }
}

function actualizarImpacto(clase) {
    const infoBox = document.getElementById("ecoImpactInfo");
    
    let clave = Object.keys(guiaResiduo).find(k => clase.toLowerCase().includes(k.toLowerCase())) || "Plastico";
    let datos = guiaResiduo[clave];

    infoBox.innerHTML = `
        <hr style="border-color: var(--border-color); margin-bottom: 15px;">
        <p><strong>Objeto detectado:</strong> ${datos.nombreObjeto}</p>
        <p><strong>Destino sugerido:</strong> ${datos.contenedor}</p>
        <p><strong>Degradación:</strong> ${datos.degradacion}</p>
        <p><strong>Impacto local:</strong> ${datos.co2}</p>
    `;
}

function activarDemo() {
    renderizarResultados([
        { className: "Plástico (Botella de Gaseosa)", probability: 0.95 },
        { className: "Papel / Cartón", probability: 0.03 },
        { className: "Orgánico (Yerba/Comida)", probability: 0.02 }
    ]);
    
    puntos += 10;
    document.getElementById("puntosValor").innerText = puntos;
}