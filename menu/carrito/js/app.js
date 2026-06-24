// ============================================================================
// CONFIGURACIÓN GLOBAL DE CONFIGURACIÓN DE SUPABASE
// ============================================================================
// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO REAL CREADO EN SUPABASE
const SUPABASE_URL = "https://yhjdgyqptwlzhatkfsjl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RVYYUA9HYbZkRTnyspUvcQ_Viopnrfc";

// Inicialización del SDK cliente-servidor de Supabase Cloud
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable que mantiene el estado visible del carrito y modo del formulario
let carritoVisible = false;
let modoRegistro = false;

// Espera a que el documento cargue completamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

function ready() {
    // 1) Botones “Eliminar” iniciales de tu código base
    actualizarListenersEliminar();

    // 2) Botones “+” y “–” de tu código base
    document.querySelectorAll('.sumar-cantidad')
        .forEach(btn => btn.addEventListener('click', sumarCantidad));
    document.querySelectorAll('.restar-cantidad')
        .forEach(btn => btn.addEventListener('click', restarCantidad));

    // 3) Botones “Agregar al carrito” de tu código base
    document.querySelectorAll('.boton-item')
        .forEach(btn => btn.addEventListener('click', agregarAlCarritoClicked));

    // 4) INTERCEPTOR DE SEGURIDAD EN EL BOTÓN "PAGAR" (RNF01 - Control de Accesos)
    document.querySelector('.btn-pagar')
        .addEventListener('click', pagarClicked);

    // 5) Botón “Quitar seleccionados” de tu código base
    document.querySelector('.btn-quitar-seleccionados')
        .addEventListener('click', quitarSeleccionados);

    // 6) Efecto hover en imágenes de tu código base
    document.querySelectorAll('.img-item').forEach(img => {
        const original = img.src;
        const hoverSrc = img.dataset.hover;
        if (!hoverSrc) return;
        img.addEventListener('mouseover', () => img.src = hoverSrc);
        img.addEventListener('mouseout', () => img.src = original);
    });

    // ========================================================================
    // MANEJADORES DE EVENTOS PARA EL MODAL DE AUTENTICACIÓN (NUEVOS REQUERIMIENTOS)
    // ========================================================================
    const modal = document.getElementById('modal-login');

    document.getElementById('btn-mostrar-login').addEventListener('click', () => {
        setModoAuth(false); // Inicia por defecto en modo Iniciar Sesión
        modal.style.display = 'flex';
    });

    document.getElementById('btn-cancelar-login').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Cambiar la vista de la tarjeta entre Login y Registro (Usabilidad)
    document.getElementById('enlace-alternar').addEventListener('click', (e) => {
        e.preventDefault();
        setModoAuth(!modoRegistro);
    });

    // Ejecutores de peticiones hacia Supabase
    document.getElementById('btn-auth-principal').addEventListener('click', ejecutarAutenticacionReal);
    document.getElementById('btn-cerrar-sesion').addEventListener('click', ejecutarCerrarSesion);

    // Monitoreo reactivo de la persistencia de usuarios
    monitorearEstadoSesion();
}

// (Re)asocia listeners a TODOS los .btn-eliminar
function actualizarListenersEliminar() {
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.removeEventListener('click', eliminarItemCarrito);
        btn.addEventListener('click', eliminarItemCarrito);
    });
}

function agregarAlCarritoClicked(event) {
    const button = event.target;
    const item = button.parentElement;
    const titulo = item.querySelector('.titulo-item').innerText;
    const precio = item.querySelector('.precio-item').innerText;
    const imagenSrc = item.querySelector('.img-item').src;

    agregarItemAlCarrito(titulo, precio, imagenSrc);
    hacerVisibleElCarrito();
}

function hacerVisibleElCarrito() {
    if (!carritoVisible) {
        const carrito = document.querySelector('.carrito');
        carrito.style.marginRight = '0';
        carrito.style.opacity = '1';
        document.querySelector('.contenedor-items').style.width = '60%';
        carritoVisible = true;
    }
}

function agregarItemAlCarrito(titulo, precio, imagenSrc) {
    const itemsCarrito = document.querySelector('.carrito-items');

    // Si existe, solo aumentamos la cantidad
    for (let t of itemsCarrito.getElementsByClassName('carrito-item-titulo')) {
        if (t.innerText === titulo) {
            const input = t.closest('.carrito-item')
                .querySelector('.carrito-item-cantidad');
            input.value = parseInt(input.value) + 1;
            actualizarTotalCarrito();
            return;
        }
    }

    // Creamos el nuevo bloque con checkbox
    const item = document.createElement('div');
    item.classList.add('carrito-item');
    item.innerHTML = `
      <input type="checkbox" class="carrito-item-select">
      <img src="${imagenSrc}" width="80px" alt="">
      <div class="carrito-item-detalles">
        <span class="carrito-item-titulo">${titulo}</span>
        <div class="selector-cantidad">
          <i class="fa-solid fa-minus restar-cantidad"></i>
          <input type="text" value="1" class="carrito-item-cantidad" disabled>
          <i class="fa-solid fa-plus sumar-cantidad"></i>
        </div>
        <span class="carrito-item-precio">${precio}</span>
      </div>
      <span class="btn-eliminar"><i class="fa-solid fa-trash"></i></span>
    `;
    itemsCarrito.append(item);

    // Asociamos listeners al nuevo ítem
    item.querySelector('.restar-cantidad')
        .addEventListener('click', restarCantidad);
    item.querySelector('.sumar-cantidad')
        .addEventListener('click', sumarCantidad);
    item.querySelector('.btn-eliminar')
        .addEventListener('click', eliminarItemCarrito);

    actualizarTotalCarrito();
}

function quitarSeleccionados() {
    document.querySelectorAll('.carrito-item-select:checked')
        .forEach(chk => chk.closest('.carrito-item').remove());
    actualizarTotalCarrito();
    if (document.querySelectorAll('.carrito-item').length === 0) {
        ocultarCarrito();
    }
}

function eliminarItemCarrito(event) {
    event.target.closest('.carrito-item').remove();
    actualizarTotalCarrito();
    if (document.querySelectorAll('.carrito-item').length === 0) {
        ocultarCarrito();
    }
}

function ocultarCarrito() {
    document.querySelector('.carrito').style.marginRight = '-100%';
    document.querySelector('.carrito').style.opacity = '0';
    document.querySelector('.contenedor-items').style.width = '100%';
    carritoVisible = false;
}

function sumarCantidad(event) {
    const input = event.target.parentElement
        .querySelector('.carrito-item-cantidad');
    input.value = parseInt(input.value) + 1;
    actualizarTotalCarrito();
}

function restarCantidad(event) {
    const input = event.target.parentElement
        .querySelector('.carrito-item-cantidad');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
        actualizarTotalCarrito();
    }
}

// ============================================================================
// FUNCIONES INTEGRADAS DE MANEJO DE CONTROL DE ACCESO - SUPABASE (RF04)
// ============================================================================

function setModoAuth(registrar) {
    modoRegistro = registrar;
    const titulo = document.getElementById('modal-titulo');
    const boton = document.getElementById('btn-auth-principal');
    const texto = document.getElementById('texto-alternar');
    const enlace = document.getElementById('enlace-alternar');

    if (modoRegistro) {
        titulo.innerText = "Crear Cuenta Nueva";
        boton.innerText = "Registrarme";
        boton.style.background = "#1d1df6";
        texto.innerText = "¿Ya tienes una cuenta?";
        enlace.innerText = "Inicia sesión";
    } else {
        titulo.innerText = "Ingresar a la Tienda";
        boton.innerText = "Iniciar Sesión";
        boton.style.background = "#27ae60";
        texto.innerText = "¿No tienes cuenta?";
        enlace.innerText = "Regístrate aquí";
    }
}

async function ejecutarAutenticacionReal() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        alert("⚠️ Usabilidad: Por favor, complete todos los campos requeridos.");
        return;
    }

    try {
        if (modoRegistro) {
            // Registro directo en los servidores de Supabase Cloud
            const { data, error } = await _supabase.auth.signUp({ email, password });
            if (error) throw error;
            alert("✨ ¡Cuenta creada! Verifica tu correo electrónico o inicia sesión si tu cuenta se auto-aprobó.");
            setModoAuth(false);
        } else {
            // Inicio de sesión real contra la base de datos PostgreSQL
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            alert("🔑 ¡Acceso concedido! Bienvenido a narbecode Tienda.");
            document.getElementById('modal-login').style.display = 'none';
        }
    } catch (err) {
        alert("❌ Error detectado por el Sistema: " + err.message);
    }
}

function monitorearEstadoSesion() {
    _supabase.auth.onAuthStateChange((event, session) => {
        const btnMostrar = document.getElementById('btn-mostrar-login');
        const perfilDiv = document.getElementById('usuario-perfil');
        const emailTxt = document.getElementById('usuario-email');

        if (session && session.user) {
            btnMostrar.style.display = 'none';
            perfilDiv.style.display = 'flex';
            emailTxt.innerText = `👤 ${session.user.email}`;
        } else {
            btnMostrar.style.display = 'block';
            perfilDiv.style.display = 'none';
        }
    });
}

async function ejecutarCerrarSesion() {
    await _supabase.auth.signOut();
    alert("🔒 Has cerrado sesión de forma segura.");
}

// ============================================================================
// INTERCEPTOR DE SEGURIDAD Y LOGICA DE DESCUENTO
// ============================================================================

function actualizarTotalCarrito() {
    let total = 0;
    document.querySelectorAll('.carrito-item').forEach(item => {
        const precioEl = item.querySelector('.carrito-item-precio').innerText;
        const precio = parseFloat(
            precioEl.replace('S/', '').replace(/\./g, '').replace(',', '.')
        );
        const cantidad = parseInt(item.querySelector('.carrito-item-cantidad').value);
        total += precio * cantidad;
    });

    // LOGICA DE DESCUENTO INTEGRADA DE LA EVIDENCIA 2 (Umbral S/ 5,000)
    if (total >= 5000) {
        total = total * 0.90; // Aplica el 10% de descuento automático
    }

    document.querySelector('.carrito-precio-total')
        .innerText = 'S/' + total.toFixed(2);
}

async function pagarClicked() {
    // Consulta sincrónica a los tokens activos del backend
    const { data: { session } } = await _supabase.auth.getSession();

    // RNF01 (Seguridad): Si el token es inexistente, se bloquea la transacción
    if (!session) {
        alert("🔒 Acción Bloqueada por Seguridad: Para procesar los elementos de tu carrito y autorizar el pago debes contar con una sesión activa.");
        setModoAuth(false);
        document.getElementById('modal-login').style.display = 'flex'; // Abre el Login automáticamente (Usabilidad)
        return;
    }

    // FLUJO DE PAGO EXITOSO CON USUARIO AUTENTICADO
    alert(`🛒 ¡Transacción Autorizada para ${session.user.email}! Gracias por tu compra.`);
    const carritoItems = document.querySelector('.carrito-items');
    while (carritoItems.firstChild) {
        carritoItems.removeChild(carritoItems.firstChild);
    }
    actualizarTotalCarrito();
    ocultarCarrito();
}