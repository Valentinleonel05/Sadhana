const SHEET_ID = '1oMXi6b8Xa69eBElY31yDtQO-Pj-oFuDAADVrJ8BSnqk';
const SHEET_NAME = 'Hoja 1';
const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

document.addEventListener('DOMContentLoaded', () => {
  fetch(API_URL)
    .then(res => res.text())
    .then(text => {
      try {
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const productos = json.table.rows.map(row => {
          const c = row.c;
          return {
            Nombre: c[0]?.v || '',
            Precio: c[1]?.v || '',
            Descripcion: c[2]?.v || '',
            Imagen: c[3]?.v || '',
            Stock: c[4]?.v || '',
            Categoria: c[5]?.v || ''
          };
        });
        mostrarCategorias(productos);
        renderizarProductos(productos);
      } catch (err) {
        mostrarErrorCarga();
      }
    })
    .catch(err => {
      mostrarErrorCarga();
    });

  function mostrarErrorCarga() {
    const grid = document.querySelector('.menu-grid');
    if (grid) {
      grid.innerHTML = '<div style="color:red;text-align:center;font-size:1.2rem;margin:2em 0;">No se pudieron cargar los productos. Intenta más tarde.</div>';
    }
    const categorias = document.getElementById('categorias-btns');
    if (categorias) {
      categorias.innerHTML = '';
    }
  }
});

let productosGlobal = [];
let carrito = [];
function mostrarCategorias(productos) {
  productosGlobal = productos;
  const contenedor = document.getElementById('categorias-btns');
  if (!contenedor) return;
  // Obtener categorías únicas y no vacías
  const categorias = [...new Set(productos.map(p => p.Categoria).filter(Boolean))];
  contenedor.innerHTML = '';
  // Estado de selección
  let categoriaSeleccionada = null;
  // Botón para mostrar todos
  if (categorias.length > 1) {
    const btnTodos = document.createElement('button');
    btnTodos.textContent = 'Todas';
    btnTodos.className = 'categoria-btn active';
    btnTodos.onclick = () => {
      renderizarProductos(productosGlobal);
      setActive(btnTodos);
    };
    contenedor.appendChild(btnTodos);
    categoriaSeleccionada = btnTodos;
  }
  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className = 'categoria-btn';
    btn.onclick = () => {
      filtrarPorCategoria(cat);
      setActive(btn);
    };
    contenedor.appendChild(btn);
  });
  function setActive(btn) {
    contenedor.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

function filtrarPorCategoria(categoria) {
  const filtrados = productosGlobal.filter(p => p.Categoria === categoria);
  renderizarProductos(filtrados);
}
function renderizarProductos(productos) {
  const grid = document.querySelector('.menu-grid');
  grid.innerHTML = '';
  productos.forEach(producto => {
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `
      <img src="${producto.Imagen}" alt="${producto.Nombre}">
      <h3>${producto.Nombre}</h3>
      <p>${producto.Descripcion}</p>
      <span>$${producto.Precio}</span>
    `;
    item.style.cursor = 'pointer';
    item.onclick = () => mostrarModalProducto(producto);
    grid.appendChild(item);
  });
}


function mostrarModalProducto(producto) {
  const modal = document.getElementById('modal-producto');
  const modalInfo = document.getElementById('modal-info');
  if (!modal || !modalInfo) return;
  const numeroWsp = '5491140372365'; // <-- Número actualizado
  let cantidad = 1;
  function getMensaje() {
    return encodeURIComponent(`Hola, quiero encargar ${cantidad} unidad(es) del producto: ${producto.Nombre}`);
  }
  function getUrlWsp() {
    return `https://wa.me/${numeroWsp}?text=${getMensaje()}`;
  }
  modalInfo.innerHTML = `
    <img src="${producto.Imagen}" alt="${producto.Nombre}">
    <h2>${producto.Nombre}</h2>
    <p>${producto.Descripcion}</p>
    <div class="precio">$${producto.Precio}</div>
    <p><b>Stock:</b> ${producto.Stock}</p>
    <div><span class="categoria-label">${producto.Categoria}</span></div>
    <div style="display:flex;align-items:center;gap:10px;margin:18px 0;justify-content:center;">
      <button id="menos-cant" style="width:32px;height:32px;font-size:1.2rem;">-</button>
      <input id="input-cant" type="number" min="1" max="${producto.Stock || 99}" value="1" style="width:48px;text-align:center;font-size:1.1rem;">
      <button id="mas-cant" style="width:32px;height:32px;font-size:1.2rem;">+</button>
    </div>
    <div class="modal-btns">
      <a id="btn-wsp" href="${getUrlWsp()}" target="_blank">Encargar</a>
      <button id="btn-carrito">Agregar al carrito</button>
    </div>
  `;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Lógica cantidad
  const inputCant = document.getElementById('input-cant');
  const btnMenos = document.getElementById('menos-cant');
  const btnMas = document.getElementById('mas-cant');
  const btnWsp = document.getElementById('btn-wsp');
  const btnCarrito = document.getElementById('btn-carrito');
  btnMenos.onclick = () => {
    if (cantidad > 1) {
      cantidad--;
      inputCant.value = cantidad;
      btnWsp.href = getUrlWsp();
    }
  };
  btnMas.onclick = () => {
    if (!producto.Stock || cantidad < parseInt(producto.Stock)) {
      cantidad++;
      inputCant.value = cantidad;
      btnWsp.href = getUrlWsp();
    }
  };
  inputCant.oninput = () => {
    let val = parseInt(inputCant.value) || 1;
    if (producto.Stock) val = Math.min(val, parseInt(producto.Stock));
    cantidad = Math.max(1, val);
    inputCant.value = cantidad;
    btnWsp.href = getUrlWsp();
  };
  btnCarrito.onclick = () => {
    agregarAlCarrito(producto, cantidad);
    // El modal permanece abierto, el usuario lo cierra manualmente
  };
// Carrito: abrir/cerrar
document.getElementById('btn-abrir-carrito').onclick = mostrarModalCarrito;
document.getElementById('cerrar-modal-carrito').onclick = function() {
  document.getElementById('modal-carrito').style.display = 'none';
  document.body.style.overflow = '';
};

function agregarAlCarrito(producto, cantidad) {
  const idx = carrito.findIndex(p => p.Nombre === producto.Nombre);
  if (idx >= 0) {
    carrito[idx].cantidad += cantidad;
  } else {
    carrito.push({ ...producto, cantidad });
  }
  renderizarCarrito();
}

function mostrarModalCarrito() {
  renderizarCarrito();
  document.getElementById('modal-carrito').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function renderizarCarrito() {
  const lista = document.getElementById('carrito-lista');
  const acciones = document.getElementById('carrito-acciones');
  if (!lista || !acciones) return;
  if (carrito.length === 0) {
    lista.innerHTML = '<p style="text-align:center;color:#888;">El carrito está vacío.</p>';
    acciones.innerHTML = '';
    return;
  }
  let total = 0;
  lista.innerHTML = carrito.map((p, i) => {
    const precioNum = parseFloat((p.Precio + '').replace(/[^\d.]/g, '')) || 0;
    total += precioNum * p.cantidad;
    return `
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;justify-content:space-between;">
        <img src="${p.Imagen}" alt="${p.Nombre}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
        <div style="flex:1;">
          <div style="font-weight:bold;">${p.Nombre}</div>
          <div style="color:#444;">$${p.Precio} x <span id="cant-carr-${i}">${p.cantidad}</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button onclick="window.cambiarCantidadCarrito(${i},-1)">-</button>
          <button onclick="window.cambiarCantidadCarrito(${i},1)">+</button>
        </div>
        <button onclick="window.eliminarDelCarrito(${i})" style="background:#c0392b;color:#fff;padding:6px 12px;border-radius:6px;">Eliminar</button>
      </div>
    `;
  }).join('');
  lista.innerHTML += `<div style="text-align:right;font-size:1.2rem;font-weight:bold;margin-top:12px;">Total: $${total.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>`;
  acciones.innerHTML = `
    <button onclick="window.vaciarCarrito()" style="background:#888;">Vaciar carrito</button>
    <a href="${generarLinkWhatsappCarrito()}" target="_blank" style="background:#25d366;color:#111;">Encargar por WhatsApp</a>
  `;
}

window.cambiarCantidadCarrito = function(idx, delta) {
  if (carrito[idx]) {
    carrito[idx].cantidad = Math.max(1, carrito[idx].cantidad + delta);
    renderizarCarrito();
  }
}
window.eliminarDelCarrito = function(idx) {
  carrito.splice(idx, 1);
  renderizarCarrito();
}
window.vaciarCarrito = function() {
  carrito = [];
  renderizarCarrito();
}
function generarLinkWhatsappCarrito() {
  const numeroWsp = '5491140372365'; // <-- Número actualizado
  let mensaje = 'Hola, quiero encargar los siguientes productos:%0A';
  carrito.forEach(p => {
    mensaje += `- ${p.Nombre} x ${p.cantidad}%0A`;
  });
  return `https://wa.me/${numeroWsp}?text=${mensaje}`;
}
}

// Cerrar modal
document.addEventListener('click', function(e) {
  if (e.target && (e.target.id === 'cerrar-modal' || e.target.id === 'modal-producto')) {
    document.getElementById('modal-producto').style.display = 'none';
    document.body.style.overflow = '';
  }
});
