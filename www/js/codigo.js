window.addEventListener("load", inicio);

const menu = get("menu");
const ruteo = get("ruteo");
let hayUsuarioLogueado = false;
let latitud;
let longitud;
let map;
navigator.geolocation.getCurrentPosition(guardarUbicacion, evaluarError);

function inicio() {
    if (localStorage.getItem("token") && localStorage.getItem("token").length != 0) {
        hayUsuarioLogueado = true;
        mostrar("inicio");
        ocultar("login");
        ocultar("registro");
        ocultar("btnRegistro");
        ocultar("btnLogin");
        mostrar("formEvento");
        ocultar("contenedorInformeEventos");
        mostrar("btnCerrarSesion");
        mostrar("btnInicio");
        mostrar("btnInformeEventos");
        ocultar("mapa");
        ruteo.push("/inicio");
    } else {
        hayUsuarioLogueado = false;
        mostrar("login");
        ocultar("registro");
        ocultar("inicio");
        ocultar("contenedorInformeEventos");
        ocultar("btnCerrarSesion");
        ocultar("btnInicio");
        ocultar("btnInformeEventos");
        ocultar("btnMapa");
        ocultar("mapa");
    }
    cargarDepartamentos();
    get("formRegistro").addEventListener("submit", registrarUsuario);
    get("formLogin").addEventListener("submit", login);
    get("btnInicio").addEventListener("click", mostrarOcultar);
    ruteo.addEventListener("ionRouteWillChange", mostrarOcultar);
    get("departamento").addEventListener("ionChange", cargarCiudades);
    get("btnMostrarFormEvento").addEventListener("click", formEvento);
    get("formEvento").addEventListener("submit", agregarEvento);
    cargarCategorias();
    get("btnMostrarEventosDeUsuario").addEventListener("click", function(){obtenerEventos(mostrarEventos)});
    get("btnInformeEventos").addEventListener("click", mostrarContadorEventos);
    get("btnMapa").addEventListener("click", mostrarOcultar)
    establecerFechaHoraMaxima();
}

function establecerFechaHoraMaxima() {
    const fechaHoraInput = document.getElementById('fechaHora');
    const hoy = new Date().toISOString();
    fechaHoraInput.setAttribute('max', hoy);
}

function cerrarMenu() {
    menu.close();
}

function get(id) {
    return document.querySelector("#" + id)
}

function ocultar(id) {
    get(id).style.display = "none";
}

function mostrar(id) {
    get(id).style.display = "block"
}

function mostrarOcultar(event) {
    let ruta = event.detail.to;
    if (ruta == "/login") {
        mostrar("login");
        ocultar("registro");
        ocultar("inicio");
        ocultar("contenedorInformeEventos");
        ocultar("mapa");
        ocultar("btnMapa");
        cerrarMenu();
    }
    if (ruta == "/registro") {
        mostrar("registro");
        ocultar("login");
        ocultar("inicio");
        ocultar("contenedorInformeEventos");
        ocultar("mapa");
        ocultar("btnMapa");
        cerrarMenu();
    }
    if (ruta == "/inicio") {
        mostrar("inicio");
        ocultar("formEvento");
        mostrar("btnMapa");
        mostrar("btnInformeEventos");
        ocultar("mapa");
        ocultar("eventosDelUsuario");
        ocultar("contenedorInformeEventos");
        cerrarMenu();
    }
    if (ruta == "/cerrarSesion") {
        mostrar("login");
        ocultar("registro");
        ocultar("inicio");
        ocultar("btnCerrarSesion");
        ocultar("btnInicio");
        mostrar("btnRegistro");
        mostrar("btnLogin");
        ocultar("btnInformeEventos");
        ocultar("contenedorInformeEventos");
        ocultar("mapa");
        cerrarSesion();
        ruteo.push("/login");
    }
    if(ruta == "/contenedorInformeEventos"){
        mostrar("contenedorInformeEventos");
        mostrar("informeEventos");
        ocultar("mapa");
        cerrarMenu();
    }
    if(ruta == "/mapa"){
        setTimeout(()=>{
            mostrarMapa();
        }, 1000)
        mostrar("mapa");
        cerrarMenu();
    }

}

function validarRegistro() {
    let valido = true;
    let usuario = get("usuario").value;
    let password = get("password").value;
    let idDepartamento = get("departamento").value;
    let idCiudad = get("ciudad").value;
    try {
        if (usuario.trim().length == 0) {
            valido = false;
            throw new Error("Ingrese un nombre de usuario")
        }
        if (password.trim().length == 0) {
            valido = false;
            throw new Error("Ingrese una contraseña valida")
        }
        if (!idDepartamento || idDepartamento === "0") {
            valido = false;

            throw new Error("Seleccione un departamento")
        }
        if (!idCiudad || idCiudad === "0") {
            valido = false;
            throw new Error("Seleccione una ciudad")
        }
    } catch (error) {
        mostrarError(error.message);
        valido = false;
    }
    return valido
}

function registrarUsuario(event) {
    event.preventDefault();
    if (validarRegistro()) {
        let usuario = {
            usuario: get("usuario").value,
            password: get("password").value,
            idDepartamento: get("departamento").value,
            idCiudad: get("ciudad").value
        };

        fetch('https://babytracker.develotion.com/usuarios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuario)
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (data.codigo === 409) {
                    throw new Error(data.mensaje);
                }
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userId', data.idUsuario);
                    mostrar("login");
                    ocultar("registro");
                    ruteo.push("/login");
                    get("formRegistro").reset();
                } else {
                    mostrarError(data.error);
                }
            })
            .catch(function (error) {
                mostrarError(error.message);
            })
    }
}

function cargarDepartamentos() {
    fetch('https://babytracker.develotion.com/departamentos.php')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            let selectDepartamento = get("departamento");
            data.departamentos.forEach(function (departamento) {
                let option = document.createElement('ion-select-option');
                option.value = departamento.id;
                option.textContent = departamento.nombre;
                selectDepartamento.appendChild(option);
            });
        })
        .catch(function (error) {
            console.log('Error cargando departamentos:', error);
        })
}

function cargarCiudades() {
    let idDepartamento = document.getElementById("departamento").value;
    fetch('https://babytracker.develotion.com/ciudades.php?idDepartamento=' + idDepartamento, {
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            let selectCiudades = get("ciudad");
            selectCiudades.innerHTML = "";
            data.ciudades.forEach(function (ciudad) {
                let option = document.createElement('ion-select-option');
                option.value = ciudad.id;
                option.textContent = ciudad.nombre;
                selectCiudades.appendChild(option);
            })
        })
        .catch(function (error) {
            console.log("Error cargando ciudades", error);
        })
}

function validarLogin() {
    let valido = true;
    let usuario = get("usuarioLogin").value;
    let password = get("passwordLogin").value;
    // pLogin.innerHTML = "";
    try {
        if (usuario.trim().length == 0 || password.trim().length == 0) {
            valido = false;
            throw new Error("Usuario o password incorrectos");
        }
    }
    catch (error) {
        mostrarError(error.message);
    }
    return valido;
}

function login(event) {
    event.preventDefault();
    if (validarLogin()) {
        try {
            let dataDeUsuario = {
                usuario: get("usuarioLogin").value,
                password: get("passwordLogin").value
            }
            fetch('https://babytracker.develotion.com/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataDeUsuario)
            })
                .then(function (response) {
                    if (!response.ok) {
                        if (response.status == 409) {
                            throw new Error('Credenciales Invalidas')
                        }
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(function (data) {
                    if (data.codigo === 200) {
                        localStorage.setItem('token', data.apiKey);
                        localStorage.setItem('idUsuario', data.id);
                        ruteo.push("/inicio");
                        cargarCategorias();
                        mostrar("inicio");
                        ocultar("registro");
                        ocultar("login");
                        mostrar("btnCerrarSesion");
                        mostrar("btnInicio");
                        ocultar("btnRegistro");
                        ocultar("btnLogin");
                        hayUsuarioLogueado = true;
                        get("formLogin").reset();
                    } else {
                        mostrarError(data.mensaje || 'Error desconocido');
                    }
                })
                .catch(function (error) {
                    console.log("error al realizar la peticion:", error);
                    mostrarError(error.message);
                });
        } catch (error) {
            mostrarError(error.message);
        }
    }
}

function mostrarError(texto) {
    let toast = document.createElement("ion-toast");
    toast.message = texto;
    toast.duration = 1700;
    toast.position = "bottom";
    document.body.appendChild(toast);
    toast.present();
}

function cerrarSesion() {
    localStorage.clear();
}

function formEvento() {
    let form = get("formEvento");
    if (form.style.display === "none") {
        mostrar("formEvento");
    } else {
        ocultar("formEvento");
    }
}

let arrayCategorias = {};
let arrayNombreCategorias = {};

function cargarCategorias() {
    fetch('https://babytracker.develotion.com/categorias.php', {
        headers: {
            'Content-Type': 'application/json',
            'apikey': localStorage.getItem('token'),
            'iduser': localStorage.getItem('idUsuario'),
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            let selectCategorias = get("selectCategoria");
            data.categorias.forEach(function (categoria) {
                let option = document.createElement('ion-select-option');
                option.value = categoria.id;
                option.textContent = categoria.tipo;
                selectCategorias.appendChild(option);
                arrayCategorias[categoria.id] = categoria.imagen;
                arrayNombreCategorias[categoria.id] = categoria.tipo;
            })
        })
}

function validarEvento() {
    let valido = true;
    let categoria = get("selectCategoria").value;
    let fechaHora = get("fechaHora").value;
    let detalles = get("detalles").value;

    try {
        if (categoria === "0" || !categoria) {
            valido = false;
            throw new Error("Seleccione una categoria");
        }
        if (fechaHora === "0" || !fechaHora) {
            valido = false;
            throw new Error("Indique fecha y hora validas");
        }
    } catch (error) {
        mostrarError(error.message)
    }
    return valido
}

function agregarEvento(event) {
    event.preventDefault();

    if (validarEvento()) {
        let evento = {
            idCategoria: get("selectCategoria").value,
            idUsuario: localStorage.getItem("idUsuario"),
            detalle: get("detalles").value,
            fecha: get("fechaHora").value
        };

        fetch('https://babytracker.develotion.com//eventos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': localStorage.getItem('token'),
                'iduser': localStorage.getItem('idUsuario')
            },
            body: JSON.stringify(evento),
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (data.codigo === 401) {
                    throw new Error(data.mensaje);
                }
                if (data.codigo === 200) {
                    mostrarMensajeExito(data.mensaje);
                    ocultar("formEvento");
                    get("formEvento").reset();
                }
            })

    }
}

function mostrarMensajeExito(texto) {
    let toast = document.createElement('ion-toast');
    toast.message = texto;
    toast.duration = 2000;
    toast.position = 'bottom';
    document.body.appendChild(toast);
    toast.present();
}

function obtenerEventos(callback) {
    let id = localStorage.getItem('idUsuario');
    fetch('https://babytracker.develotion.com/eventos.php?idUsuario=' + id, {
        headers: {
            'content-type': 'application/json',
            'apikey': localStorage.getItem('token'),
            'iduser': localStorage.getItem('idUsuario')
        }
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.codigo === 200) {

                let eventos = data.eventos;
                callback(eventos);
            } else {
                mostrarError(data.mensaje)
            }
        })
        .catch(function (error) {
            mostrarError("Error obteniendo eventos");
        })
}

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

function mostrarEventos(eventos) {
    let url = 'https://babytracker.develotion.com/imgs/';
    let eventosHoy = [];
    let eventosAnteriores = [];


    get("eventosDelDia").innerHTML = "<h2>Eventos del día</h2>";
    get("eventosDiasAnteriores").innerHTML = "<h2>Eventos de días anteriores</h2>";
    eventos.forEach(function (evento) {
        const fechaEvento = new Date(evento.fecha);
        fechaEvento.setHours(0, 0, 0, 0);
        let numeroImg = arrayCategorias[evento.idCategoria];
        let tipoCategoria = arrayNombreCategorias[evento.idCategoria];
        let imagenURL = `${url}${numeroImg}.png`;

        let cardEvento = `<ion-card class="cardEvento">
         <img src="${imagenURL}"/>
         <ion-card-header>
           <ion-card-title>${tipoCategoria}</ion-card-title>
           <ion-card-subtitle>${evento.fecha}</ion-card-subtitle>
         </ion-card-header>
       
         <ion-card-content>
           ${evento.detalle}
         </ion-card-content>
         <ion-button onclick="eliminarEvento(${evento.id})">Borrar</ion-button>
        </ion-card>`;

        if (fechaEvento.getTime() === hoy.getTime()) {
            eventosHoy.push(cardEvento)
        } else {
            eventosAnteriores.push(cardEvento)
        }
    });
    get("eventosDelDia").innerHTML += eventosHoy.join('');
    get("eventosDiasAnteriores").innerHTML += eventosAnteriores.join('');

    if (get("eventosDelUsuario").style.display === "none") {
        mostrar("eventosDelUsuario")
    } else {
        ocultar("eventosDelUsuario")
    }

}

function eliminarEvento(id) {
    fetch('https://babytracker.develotion.com/eventos.php?idEvento=' + id, {
        method: 'DELETE',
        headers: {
            'content-type': 'application/json',
            'apikey': localStorage.getItem("token"),
            'iduser': localStorage.getItem("idUsuario")
        }
    })
        .then(function (response) {
            return response.json()
        })
        .then(function (data) {
            if (data.codigo === 200) {
                mostrarMensajeExito(data.mensaje);
                obtenerEventos(mostrarEventos);
            } else {
                mostrarError(data.mensaje)
            }
        })
}

function mostrarInformeEventos(biberones, panales) {
    let container = get("informeEventos");
    let lista = `<ion-list>
    <ion-item><ion-label>Total de Biberones del Dìa: ${biberones}
    </ion-item>
    <ion-item><ion-label>Total de Pañales del Dìa: ${panales}
    </ion-item></ion-list>`;
    container.innerHTML = lista;
}

function mostrarContadorEventos() {
    obtenerEventos(function (eventos) {
        let biberones = 0;
        let paniales = 0;
        let eventosDeHoy = eventos.filter(function (evento) {
            let fechaEvento = new Date(evento.fecha);
            return fechaEvento.toDateString() === new Date().toDateString();
        });
        eventosDeHoy.forEach(function(evento) {
            if (evento.idCategoria == "35") {
                biberones += 1;
            } else if (evento.idCategoria == "33") {
                paniales += 1;
            }
        });
        mostrarInformeEventos(biberones, paniales);
    })
}

function guardarUbicacion(position){
    latitud = position.coords.latitude;
    longitud = position.coords.longitude;
}

function evaluarError(error){
    switch(error.code){
        case 1:
            mostrarError("El usuario no permite obtener la ubicacion del dispositivo");
            break;
        case 2:
            mostrarError("La ubicacion del dispositivo no se puede obtener");
            break;
        case 3: 
            mostrarError("Expiro el tiempo para obtener la ubicacion");
            break;
    }
}

function mostrarMapa(){
    if(map!=null){
        map.remove();
    }
    map = L.map('map').setView([latitud, longitud], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.marker([latitud, longitud]).addTo(map);
    obtenerPlazas();
}


function obtenerPlazas(){
    fetch('https://babytracker.develotion.com/plazas.php',{
        headers:{
            'content-type': 'application/json',
            'apikey': localStorage.getItem("token"),
            'iduser': localStorage.getItem("idUsuario"),
        }
    })
    .then(function(response){
        return response.json();
    })
    .then(function(data){
        if(data.codigo == "200"){
            data.plazas.forEach(function(plaza){
                let latitud = plaza.latitud;
                let longitud = plaza.longitud;
                let accesible = "";
                let aceptaMascotas = "";
                if(plaza.accesible == "1"){
                    accesible = "Si"
                }else{
                    accesible = "No"
                }
                if(plaza.aceptaMascotas == "1"){
                    aceptaMascotas = "Si"
                }else{
                    aceptaMascotas = "No"
                }
                let mensaje = `Accesible: ${accesible}, Mascotas: ${aceptaMascotas}`;
                L.marker([latitud, longitud]).addTo(map).bindPopup(mensaje);
            });
            
            
        }else{
            mostrarError("No se pudo obtener las plazas");
        }
    })
}