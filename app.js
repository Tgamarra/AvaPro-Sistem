let listaProductos = [];
let logoActualComercio = "https://via.placeholder.com/80?text=RB";
let fotoComprobanteAdjunto = null;

const CONFIG_COMERCIO = {
    envioEmailAuto: true,       
    envioWsAuto: false,          
    impresoraConectada: true,
    nombreComercio: "RB_ONLINE_STORE",
    rucComercio: "80082578-0",
    timbrado: "18229905",
    direccionComercio: "Paraguarí - Paraguay",
    telefonoComercio: "+595 981 000000"
};

// Moderación suave de lenguaje
const PALABRAS_NO_PERMITIDAS = [
    "puto", "puta", "mierda", "carajo", "pendejo", "pendeja", "boludo", "boluda",
    "imbecil", "estupido", "estupida", "concha", "tetas", "pene", "vagina", "chota"
];

function contienePalabrasObscenas(texto) {
    if (!texto) return false;
    const textoLimpio = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return PALABRAS_NO_PERMITIDAS.some(palabra => {
        const palabraLimpia = palabra.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const regex = new RegExp(`\\b${palabraLimpia}\\b`, 'i');
        return regex.test(textoLimpio);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarDatosComercio();

    const inputPrecio = document.getElementById('itemPrecio');
    if (inputPrecio) {
        inputPrecio.addEventListener('input', function() {
            let raw = this.value.replace(/\D/g, "");
            if (raw) {
                this.value = parseInt(raw, 10).toLocaleString('es-PY');
            }
        });
    }

    const selectMetodoPago = document.getElementById('metodoPago');
    if (selectMetodoPago) {
        selectMetodoPago.addEventListener('change', actualizarVisibilidadCamposPago);
        actualizarVisibilidadCamposPago();
    }

    actualizarEstadoRed();
    window.addEventListener('online', actualizarEstadoRed);
    window.addEventListener('offline', actualizarEstadoRed);
});

function inicializarDatosComercio() {
    const lblNombre = document.getElementById('lblNombreComercio');
    const lblRuc = document.getElementById('lblRucComercio');
    const lblDireccion = document.getElementById('lblDireccionComercio');
    const lblTel = document.getElementById('lblTelComercio');

    if (lblNombre) lblNombre.textContent = CONFIG_COMERCIO.nombreComercio;
    if (lblRuc) lblRuc.textContent = CONFIG_COMERCIO.rucComercio;
    if (lblDireccion) lblDireccion.textContent = CONFIG_COMERCIO.direccionComercio;
    if (lblTel) lblTel.textContent = CONFIG_COMERCIO.telefonoComercio;
}

function actualizarVisibilidadCamposPago() {
    const selectMetodoPago = document.getElementById('metodoPago');
    const voucherSection = document.getElementById('voucherSection');
    const qrCobroSection = document.getElementById('qrCobroSection');
    const chequeSection = document.getElementById('chequeSection');

    if (!selectMetodoPago) return;

    fotoComprobanteAdjunto = null;
    
    if (voucherSection) voucherSection.style.display = 'none';
    if (qrCobroSection) qrCobroSection.style.display = 'none';
    if (chequeSection) chequeSection.style.display = 'none';

    const val = selectMetodoPago.value;
    if (val === 'DEBITO_QR' || val === 'CREDITO_QR') {
        if (voucherSection) voucherSection.style.display = 'block';
    } else if (val === 'TRANSFERENCIA') {
        if (qrCobroSection) qrCobroSection.style.display = 'block';
    } else if (val === 'CHEQUE') {
        if (chequeSection) chequeSection.style.display = 'block';
    }
}

function cargarLogo(event) {
    const archivo = event.target.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = function(e) {
            logoActualComercio = e.target.result;
            const imgLogo = document.getElementById('imgLogoComercio');
            if (imgLogo) {
                imgLogo.src = logoActualComercio;
            }
        };
        lector.readAsDataURL(archivo);
    }
}

function cargarFotoComprobante(event, elementPreviewId){
    const archivo = event.target.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = function(e) {
            fotoComprobanteAdjunto = e.target.result;
            const contenedorPreview = document.getElementById(elementPreviewId);
            if (contenedorPreview) {
                contenedorPreview.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 6px;">
                        <span style="font-size: 0.8rem; color: #334155; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📎 ${archivo.name}</span>
                        <button type="button" onclick="eliminarFotoComprobante('${event.target.id}', '${elementPreviewId}')" style="background-color: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">
                            🗑️ Eliminar
                        </button>
                    </div>
                `;
            }
        };
        lector.readAsDataURL(archivo);
    }
}

function eliminarFotoComprobante(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    fotoComprobanteAdjunto = null;
    if (input) input.value = '';
    if (container) container.innerHTML = '';
}


function agregarItem() {
    const cantInput = document.getElementById('itemCant');
    const descInput = document.getElementById('itemDesc');
    const precioInput = document.getElementById('itemPrecio');

    const cant = parseInt(cantInput?.value, 10) || 1;
    const desc = descInput?.value.trim() || '';
    const precioRaw = (precioInput?.value || '').replace(/\D/g, "");
    const precioU = parseInt(precioRaw, 10) || 0;

    if (!desc || precioU <= 0) {
        alert("⚠️ Ingresa una descripción del trabajo/servicio y un precio válido.");
        return;
    }

    if (contienePalabrasObscenas(desc)) {
        alert("⚠️ La descripción ingresada contiene palabras o términos no permitidos. Por favor, utiliza un lenguaje profesional.");
        if (descInput) descInput.focus();
        return;
    }

    const subtotal = cant * precioU;

    listaProductos.push({
        codigo: 'SERV-' + (listaProductos.length + 1),
        cantidad: cant,
        descripcion: desc,
        precioUnitario: precioU,
        subtotal: subtotal
    });

    if (cantInput) cantInput.value = '1';
    if (descInput) descInput.value = '';
    if (precioInput) precioInput.value = '';

    renderizarTablaItems();
}

function eliminarItem(index) {
    listaProductos.splice(index, 1);
    renderizarTablaItems();
}

function renderizarTablaItems() {
    const tbody = document.getElementById('bodyItems');
    const vatInfo = document.getElementById('vatInfo');
    if (!tbody) return;

    tbody.innerHTML = '';
    let totalGeneral = 0;

    listaProductos.forEach((p, index) => {
        totalGeneral += p.subtotal;
        tbody.innerHTML += `
            <tr>
                <td>${p.cantidad}</td>
                <td>${p.descripcion}</td>
                <td>Gs. ${p.precioUnitario.toLocaleString('es-PY')}</td>
                <td>Gs. ${p.subtotal.toLocaleString('es-PY')}</td>
                <td><button type="button" onclick="eliminarItem(${index})" style="color:red; border:none; background:none; font-weight:bold; cursor:pointer;">X</button></td>
            </tr>
        `;
    });

    let liquidacionIva10 = Math.round(totalGeneral / 11);
    if (vatInfo) {
        vatInfo.textContent = `📊 Total Factura: Gs. ${totalGeneral.toLocaleString('es-PY')} (IVA 10%: Gs. ${liquidacionIva10.toLocaleString('es-PY')})`;
    }
}
function consultarDNIT() {
    const inputRuc = document.getElementById('clienteRuc');
    const inputNombre = document.getElementById('clienteNombre');
    const inputDireccion = document.getElementById('clienteDireccion');
    const inputCorreo = document.getElementById('clienteCorreo');
    const dnitStatus = document.getElementById('dnitStatus');
    const btnBuscar = document.getElementById('btnBuscarDnit');
    const btnLimpiar = document.getElementById('btnLimpiarCliente');

    if (!navigator.onLine) {
        if (dnitStatus) {
            dnitStatus.textContent = "⚠️ Sin conexión DNIT: ingresa el RUC y Razón Social manualmente.";
            dnitStatus.style.color = "#d97706";
        }
        if (inputRuc) inputRuc.readOnly = false;
        if (inputNombre) {
            inputNombre.readOnly = false;
            inputNombre.focus();
        }
        return;
    }

    let query = inputRuc ? inputRuc.value.trim() : "";
    if (!query) {
        alert("⚠️ Por favor ingresa un RUC o Cédula antes de buscar.");
        return;
    }

    if (!query.includes('-') && query.length > 5 && query !== "44444401") {
        alert("ℹ️ Atención: Ingresaste un número de Cédula. Podés ingresar el Nombre / Razón Social manualmente.");
    }

    if (dnitStatus) {
        dnitStatus.textContent = "Consultando en DNIT...";
        dnitStatus.style.color = "#2563eb";
    }

    setTimeout(() => {
        if (query === "44444401-7" || query === "44444401") {
            if (dnitStatus) {
                dnitStatus.textContent = "✓ Factura sin nombre (Consumidor Final)";
                dnitStatus.style.color = "#16a34a";
            }
            if (inputNombre) {
                inputNombre.value = "SIN NOMBRE / CONSUMIDOR FINAL";
                inputNombre.readOnly = false;
            }
        } else if (query === "5205204-4" || query === "5205204") {
            if (dnitStatus) {
                dnitStatus.textContent = "✓ Contribuyente verificado en DNIT";
                dnitStatus.style.color = "#16a34a";
            }
            if (inputRuc && !query.includes('-')) {
                inputRuc.value = query + "-4";
            }
            if (inputNombre) {
                inputNombre.value = "TOMAS GAMARRA";
                inputNombre.readOnly = true; 
            }
            if (inputRuc) inputRuc.readOnly = true;
            if (inputDireccion && !inputDireccion.value) inputDireccion.value = "Paraguarí - Centro"; 
            if (inputCorreo && !inputCorreo.value) inputCorreo.value = "tomas.gamarra@gmail.com"; 

            if (btnBuscar) btnBuscar.style.display = 'none';
            if (btnLimpiar) btnLimpiar.style.display = 'inline-block';
        } else {
            alert("⚠️ Atención: RUC incorrecto o no registrado en la DNIT. Podés continuar ingresando el Nombre manualmente.");
            if (dnitStatus) {
                dnitStatus.textContent = "⚠️ Documento no registrado en DNIT. Habilitado para ingreso manual.";
                dnitStatus.style.color = "#d97706";
            }
            if (inputNombre) {
                inputNombre.readOnly = false;
                inputNombre.value = "";
                inputNombre.focus();
            }
            if (inputRuc) inputRuc.readOnly = false;
        }
    }, 600);
}

function limpiarDatosCliente() {
    const inputRuc = document.getElementById('clienteRuc');
    const inputNombre = document.getElementById('clienteNombre');
    const inputDireccion = document.getElementById('clienteDireccion');
    const inputCorreo = document.getElementById('clienteCorreo');
    const dnitStatus = document.getElementById('dnitStatus');
    const btnBuscar = document.getElementById('btnBuscarDnit');
    const btnLimpiar = document.getElementById('btnLimpiarCliente');

    if (inputRuc) {
        inputRuc.value = '44444401-7';
        inputRuc.readOnly = false;
    }
    if (inputNombre) {
        inputNombre.value = 'SIN NOMBRE / CONSUMIDOR FINAL';
        inputNombre.readOnly = false;
    }
    if (inputDireccion) inputDireccion.value = 'Paraguarí - Paraguay';
    if (inputCorreo) inputCorreo.value = '';

    if (dnitStatus) {
        dnitStatus.textContent = "Factura predeterminada sin nombre (Consumidor Final)";
        dnitStatus.style.color = "#64748b";
    }

    if (btnBuscar) btnBuscar.style.display = 'inline-block';
    if (btnLimpiar) btnLimpiar.style.display = 'none';
}

function generarCDC() {
    let cdc = "018008257800040090003938220261018";
    for (let i = 0; i < 11; i++) {
        cdc += Math.floor(Math.random() * 10);
    }
    return cdc;
}

function emitirComprobante(e) {
    e.preventDefault();

    if (listaProductos.length === 0) {
        alert("⚠️ Agrega al menos un producto o servicio antes de emitir la factura.");
        return;
    }

    let totalGeneral = listaProductos.reduce((acc, p) => acc + p.subtotal, 0);

    const confirmar = confirm(`📋 ¿Estás seguro de emitir la Factura Electrónica por un monto total de Gs. ${totalGeneral.toLocaleString('es-PY')}?`);
    if (!confirmar) return;

    const inputRuc = document.getElementById('clienteRuc')?.value || '44444401-7';
    const inputNombre = document.getElementById('clienteNombre')?.value || 'SIN NOMBRE / CONSUMIDOR FINAL';
    const inputDireccion = document.getElementById('clienteDireccion')?.value || 'N/A';
    const inputCorreo = document.getElementById('clienteCorreo')?.value || 'N/A';
    const preview = document.getElementById('ticketPreview');

    const metodoVal = document.getElementById('metodoPago')?.value || 'EFECTIVO';
    let textoMetodo = "EFECTIVO";
    if (metodoVal === 'DEBITO_QR') textoMetodo = "TARJETA DE DÉBITO / QR DÉBITO";
    if (metodoVal === 'CREDITO_QR') textoMetodo = "TARJETA DE CRÉDITO / QR CRÉDITO";
    if (metodoVal === 'TRANSFERENCIA') textoMetodo = "TRANSFERENCIA BANCARIA";
    if (metodoVal === 'CHEQUE') textoMetodo = "CHEQUE BANCARIO";

    const codAuth = document.getElementById('codAutorizacion')?.value || '';
    const nroVoucher = document.getElementById('nroVoucher')?.value || '';
    const nroTransf = document.getElementById('nroTransf')?.value || '';
    const bancoCheque = document.getElementById('bancoCheque')?.value || '';
    const nroCheque = document.getElementById('nroCheque')?.value || '';

    let refPagoHtml = '';
        if (metodoVal === 'DEBITO_QR' || metodoVal === 'CREDITO_QR' || metodoVal === 'TRANSFERENCIA') {
        if (codAuth) refPagoHtml += `<strong>Cód. Autorización:</strong> ${codAuth}<br>`;
        if (nroVoucher) refPagoHtml += `<strong>N° Comprobante:</strong> ${nroVoucher}<br>`;
        if (nroTransf) refPagoHtml += `<strong>N° Transacción Banco:</strong> ${nroTransf}<br>`;
    } else if (metodoVal === 'CHEQUE') {
        if (bancoCheque) refPagoHtml += `<strong>Banco Emisor:</strong> ${bancoCheque}<br>`;
        if (nroCheque) refPagoHtml += `<strong>N° Cheque:</strong> ${nroCheque}<br>`;
    }

    const nombreComercio = CONFIG_COMERCIO.nombreComercio;
    const rucComercio = CONFIG_COMERCIO.rucComercio;
    const timbradoComercio = CONFIG_COMERCIO.timbrado;
    const direccionComercio = CONFIG_COMERCIO.direccionComercio;
    const telComercio = CONFIG_COMERCIO.telefonoComercio;
    const condicionVenta = document.getElementById('condicionVenta')?.value || 'CONTADO';
    
    let liquidacionIva10 = Math.round(totalGeneral / 11);

    const cdcDnit = generarCDC();
    const urlConsultaDnit = `https://ekuatia.set.gov.py/consultas/qr?nKuatia=${cdcDnit}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(urlConsultaDnit)}`;

    let filasItemsHtml = '';
    listaProductos.forEach(p => {
        filasItemsHtml += `
            <tr>
                <td style="padding: 2px 4px 2px 0; vertical-align: top; width: 10%;">${p.cantidad}</td>
                <td style="padding: 2px 4px; vertical-align: top; width: 50%; word-break: break-word;">${p.descripcion}</td>
                <td style="padding: 2px 4px; vertical-align: top; text-align: right; width: 20%;">${p.precioUnitario.toLocaleString('es-PY')}</td>
                <td style="padding: 2px 0 2px 4px; vertical-align: top; text-align: right; width: 20%;">${p.subtotal.toLocaleString('es-PY')}</td>
            </tr>
        `;
    });

    let mensajeEnvioAuto = "";
    if (CONFIG_COMERCIO.envioEmailAuto && inputCorreo && inputCorreo !== 'N/A') {
        mensajeEnvioAuto += `✉️ Enviado a: ${inputCorreo}<br>`;
    }
    if (CONFIG_COMERCIO.impresoraConectada) {
        mensajeEnvioAuto += `🖨️ Enviado a Impresora Térmica POS...<br>`;
    }

    const lineaDivisora = `<div style="border-top: 1px dashed #cbd5e1; margin: 6px 0;"></div>`;

    if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = `
            ${mensajeEnvioAuto ? `<div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; padding:6px; border-radius:4px; margin-bottom:8px; font-size:0.7rem; text-align:center;">${mensajeEnvioAuto}</div>` : ''}
            
            <div class="ticket-kude-header" style="text-align: center; padding-bottom: 6px;">
                <img src="${logoActualComercio}" alt="Logo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-bottom: 4px;"><br>
                <strong>KuDE de Factura Electrónica</strong><br>
                <strong>${nombreComercio}</strong><br>
                RUC: ${rucComercio}<br>
                Timbrado N°: ${timbradoComercio} (Vigencia: 31/12/2026)<br>
                ${direccionComercio}<br>
                Tel: ${telComercio}<br>
                <strong>FACTURA ELECTRÓNICA</strong><br>
                N°: 004-009-${Math.floor(1000000 + Math.random() * 9000000)}
            </div>

            ${lineaDivisora}

            <strong>Fecha Emisión:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>RUC / CI:</strong> ${inputRuc}<br>
            <strong>Nombre / Razón Social:</strong> ${inputNombre}<br>
            <strong>Dirección:</strong> ${inputDireccion}<br>
            <strong>Condición de Venta:</strong> ${condicionVenta}<br>
            <strong>Moneda:</strong> GUARANIES<br>

            ${lineaDivisora}

            <table class="tabla-kude" style="width: 100%; border-collapse: collapse; font-size: 0.72rem;">
                <thead>
                    <tr style="border-bottom: 1px dashed #cbd5e1;">
                        <th style="text-align: left; padding-bottom: 4px; width: 10%;">Cant</th>
                        <th style="text-align: left; padding-bottom: 4px; width: 50%;">Descripción</th>
                        <th style="text-align: right; padding-bottom: 4px; width: 20%;">P.U.</th>
                        <th style="text-align: right; padding-bottom: 4px; width: 20%;">Grav. 10%</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasItemsHtml}
                </tbody>
            </table>

            ${lineaDivisora}

            <div style="display: flex; justify-content: space-between;">
                <strong>SUBTOTAL:</strong> <span>Gs. ${totalGeneral.toLocaleString('es-PY')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 2px;">
                <strong>TOTAL A PAGAR:</strong> <strong>Gs. ${totalGeneral.toLocaleString('es-PY')}</strong>
            </div>

            ${lineaDivisora}

            <small style="display: block;">LIQUIDACIÓN DEL IVA: (5%): 0 | (10%): Gs. ${liquidacionIva10.toLocaleString('es-PY')}</small>
            <small style="display: block;"><strong>TOTAL IVA:</strong> Gs. ${liquidacionIva10.toLocaleString('es-PY')}</small>

                                ${lineaDivisora}

                    <strong>Método Pago:</strong> ${textoMetodo}<br>
                    ${refPagoHtml}

                    <div style="text-align:center; margin-top:10px; margin-bottom:8px;">
                        <img src="${qrApiUrl}" alt="QR DNIT" style="width:100px; height:100px;"><br>
                        <small style="font-size:0.58rem; word-break:break-all; display:block; margin-top:4px; color:#475569;">
                            <strong>CDC:</strong> ${cdcDnit}
                        </small>
                    </div>

                    ${lineaDivisora}


            <!-- Mensaje Final de Agradecimiento -->
            <div style="text-align:center; font-weight:bold; font-size:0.75rem; color:#1e293b; margin:6px 0;">
                ¡Gracias por su preferencia y confianza!
            </div>

            <div style="font-size:0.6rem; text-align:center; color:#475569; line-height:1.2;">
                Consulte la validez de esta Factura Electrónica con el número de CDC impreso arriba en https://ekuatia.set.gov.py/consultas
            </div>

            <div class="ticket-actions">
                <button type="button" class="btn-ws" onclick="alert('Enviando copia KuDE por WhatsApp...')">📲 WhatsApp</button>
                <button type="button" class="btn-print" onclick="window.print()">🖨️ Imprimir Ticket</button>
            </div>
        `;
        
        preview.scrollIntoView({ behavior: 'smooth' });
    }
}

function actualizarEstadoRed() {
    const systemStatusBar = document.getElementById('systemStatusBar');
    const statusText = document.getElementById('statusText');
    const statusSub = document.getElementById('statusSub');
    const statusAlertMsg = document.getElementById('statusAlertMsg');

    if (!systemStatusBar) return;

    if (!navigator.onLine) {
        systemStatusBar.className = 'system-status-bar contingency';
        if (statusText) statusText.textContent = "⚠️ Servidor DNIT sin conexión";
        if (statusSub) statusSub.textContent = "Ingreso manual activo";
        if (statusAlertMsg) statusAlertMsg.textContent = "Sin red. Ingresa RUC y Nombre manualmente para continuar facturando.";
    } else {
        systemStatusBar.className = 'system-status-bar';
        if (statusText) statusText.textContent = "🟢 En línea con la DNIT";
        if (statusSub) statusSub.textContent = "e-Kuatia Activo";
        if (statusAlertMsg) statusAlertMsg.textContent = "Conexión estable con el servidor fiscal.";
    }
}
// --- FUNCIONES DE AUTOCOMPLETADO Y CLIENTES (AvaPro-Sistem) ---

// 1. Obtener la lista de clientes guardados
function obtenerClientes() {
    return JSON.parse(localStorage.getItem('avaPro_clientes')) || {};
}

// 2. Buscar y rellenar el nombre si el cliente ya existe
function buscarClienteExistente() {
    let rucInput = document.getElementById('clienteRuc').value.trim();
    let nameInput = document.getElementById('clientName'); // Ajusta el ID si tu campo de nombre tiene otro ID en el HTML
    let clientes = obtenerClientes();

    if (nameInput && clientes[rucInput]) {
        nameInput.value = clientes[rucInput];
    }
}

// 3. Actualizar la lista de sugerencias en pantalla
function actualizarSugerencias() {
    let datalist = document.getElementById('clientSuggestions');
    if (!datalist) return;
    
    let clientes = obtenerClientes();
    datalist.innerHTML = '';
    
    Object.keys(clientes).forEach(ruc => {
        let option = document.createElement('option');
        option.value = ruc;
        option.label = `${ruc} - ${clientes[ruc]}`;
        datalist.appendChild(option);
    });
}

// Cargar sugerencias al abrir la aplicación
document.addEventListener('DOMContentLoaded', actualizarSugerencias);

// ==========================================
// FUNCIÓN PARA LIMPIAR Y INICIAR NUEVA VENTA
// ==========================================
function nuevaVenta() {
    // 1. Limpiar carrito de productos
    itemsVenta = [];
    actualizarTablaItems();

    // 2. Resetear datos del cliente a valores por defecto
    const rucInput = document.getElementById('rucCliente');
    const nombreInput = document.getElementById('nombreCliente');
    const direccionInput = document.getElementById('direccionCliente');
    const emailInput = document.getElementById('emailCliente');

    if (rucInput) rucInput.value = '';
    if (nombreInput) nombreInput.value = 'SIN NOMBRE / CONSUMIDOR FINAL';
    if (direccionInput) direccionInput.value = 'Paraguarí - Paraguay';
    if (emailInput) emailInput.value = 'cliente@gmail.com';

    // 3. Resetear método de pago y ocultar secciones
    const metodoPagoSelect = document.getElementById('metodoPago');
    if (metodoPagoSelect) {
        metodoPagoSelect.value = 'EFECTIVO';
        actualizarVisibilidadCamposPago();
    }

    // 4. Limpiar foto de comprobante
    eliminarFotoComprobante('subirVoucherFoto', 'previewVoucherFoto');

    // 5. Limpiar campos de referencia de pago
    const codAut = document.getElementById('codAutorizacion');
    const nroVouch = document.getElementById('nroVoucher');
    if (codAut) codAut.value = '';
    if (nroVouch) nroVouch.value = '';

    // 6. Ocultar ticket previo y hacer scroll arriba
    const ticketDiv = document.getElementById('ticketPreview');
    if (ticketDiv) ticketDiv.innerHTML = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// PARCHE v2.1.0 - FUNCIONES DE CRÉDITO Y VOUCHER
// ==========================================

// 1. Mostrar/Ocultar campos de Crédito
function actualizarVisibilidadCredito() {
    const condicion = document.getElementById('condicionVenta')?.value;
    const seccionCredito = document.getElementById('seccionCredito');
    if (seccionCredito) {
        seccionCredito.style.display = (condicion === 'CREDITO') ? 'block' : 'none';
    }
}

// 2. Cargar Vista Previa de la Captura del Voucher
function cargarFotoVoucher(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('previewVoucherFoto');
    const btnEliminar = document.getElementById('btnEliminarVoucherFoto');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 5px;">`;
            }
            if (btnEliminar) btnEliminar.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
}

// 3. Eliminar Captura del Voucher
function eliminarFotoVoucher() {
    const inputFoto = document.getElementById('subirVoucherFoto');
    const preview = document.getElementById('previewVoucherFoto');
    const btnEliminar = document.getElementById('btnEliminarVoucherFoto');
    
    if (inputFoto) inputFoto.value = '';
    if (preview) preview.innerHTML = '';
    if (btnEliminar) btnEliminar.style.display = 'none';
}

// 4. Resetear Formulario / Nueva Venta
function nuevaVenta() {
    const form = document.getElementById('formFactura');
    if (form) form.reset();

    const btnEmitir = document.getElementById('btnEmitir');
    if (btnEmitir) {
        btnEmitir.disabled = false;
        btnEmitir.innerText = "Emitir Factura Electrónica (KuDE)";
    }

    eliminarFotoVoucher();
    actualizarVisibilidadCamposPago();
    actualizarVisibilidadCredito();
        }
