const margin = { top: 0, right: 0, bottom: 0, left: 0 };
const width = 1000 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

// Crear el contenedor SVG
const svg = d3.select("#tree-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", height + margin.top + margin.bottom);

// Crear el grupo principal que será arrastrable
const mainGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Añadir comportamiento de zoom y arrastre
const zoom = d3.zoom()
    .scaleExtent([0.5, 2]) // Limitar el zoom entre 0.5x y 2x
    .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
    });

// Aplicar zoom al SVG
svg.call(zoom);



// Crear el layout del árbol
const tree = d3.tree()
    .nodeSize([120, 160])
    .separation((a, b) => a.data.isRelationship && b.data.isRelationship ? 2.5 : 2);

// Variable global para almacenar los datos
let familyData;
let root; // Variable para mantener la jerarquía de datos

// Crear el div para el tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Variables para el calendario
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Función para formatear la fecha
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date).toLocaleDateString('es-ES', options);
}

// Función para obtener la edad
function getAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Función para actualizar el tooltip
function updateTooltip(d) {
    if (d.data.isRelationship) {
        // Para nodos de relación, mostrar los nombres y la fecha de celebración
        const [persona1, persona2] = d.data.name.split(" y ");
        return `<strong>Relación entre:</strong><br>
                ${persona1}<br>
                ${persona2}<br>
                <span class="celebration-date">Celebración: ${formatDate(d.data.celebrationDate)}</span>`;
    } else {
        // Para nodos de persona, mantener el formato original
        const age = getAge(d.data.birthDate);
        return `<strong>${d.data.name}</strong><br>
                <span class="birth-date">Nacimiento: ${formatDate(d.data.birthDate)}<br>
                Edad: ${age} años</span>`;
    }
}

// Función para obtener todos los cumpleaños
function getAllBirthdays() {
    const birthdays = [];
    
    // Solo obtener cumpleaños de nodos persona
    familyData.nodes.forEach(node => {
        if (node.birthDate) {
            const date = new Date(node.birthDate);
            birthdays.push({
                name: node.name,
                month: date.getMonth(),
                day: date.getDate()
            });
        }
    });
    
    return birthdays;
}

// Función para actualizar el calendario
function updateCalendar() {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Actualizar título del calendario
    document.getElementById('calendar-title').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Obtener el primer día del mes
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    // Obtener cumpleaños del mes actual
    const birthdays = getAllBirthdays().filter(b => b.month === currentMonth);
    
    // Crear la cuadrícula del calendario
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    // Obtener los días del mes anterior
    const prevMonth = new Date(currentYear, currentMonth, 0);
    const prevMonthDays = prevMonth.getDate();
    
    // Agregar días del mes anterior
    for (let i = startingDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = prevMonthDays - i;
        calendarDays.appendChild(dayElement);
    }
    
    // Agregar los días del mes actual
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // Marcar el día actual
        if (currentYear === currentDate.getFullYear() && 
            currentMonth === currentDate.getMonth() && 
            day === currentDate.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Marcar cumpleaños
        const birthdaysToday = birthdays.filter(b => b.day === day);
        if (birthdaysToday.length > 0) {
            dayElement.classList.add('has-birthday');
            
            // Crear tooltip con información detallada
            const tooltipContent = birthdaysToday.map(b => {
                const person = familyData.nodes.find(n => n.name === b.name);
                const age = getAge(person.birthDate);
                
                // Determinar si el cumpleaños ya pasó este año
                const today = new Date();
                const birthDate = new Date(person.birthDate);
                const hasPassed = (currentYear < today.getFullYear()) || 
                                (currentYear === today.getFullYear() && 
                                 (currentMonth < today.getMonth() || 
                                  (currentMonth === today.getMonth() && day <= today.getDate())));
                
                return `<strong>${person.name}</strong><br>
                        ${hasPassed ? `Cumplió ${age} años` : `Cumplirá ${age + 1} años`}`;
            }).join('<br>');
            
            // Crear el tooltip una sola vez y reutilizarlo
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'birthday-tooltip';
            tooltipDiv.innerHTML = tooltipContent;
            tooltipDiv.style.position = 'fixed';
            tooltipDiv.style.display = 'none';
            tooltipDiv.style.backgroundColor = 'white';
            tooltipDiv.style.border = '1px solid #1a73e8';
            tooltipDiv.style.padding = '10px';
            tooltipDiv.style.borderRadius = '8px';
            tooltipDiv.style.zIndex = '9999';
            tooltipDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            tooltipDiv.style.color = '#333';
            tooltipDiv.style.fontSize = '14px';
            tooltipDiv.style.lineHeight = '1.4';
            tooltipDiv.style.maxWidth = '250px';
            document.body.appendChild(tooltipDiv);
            
            // Mostrar tooltip al pasar el mouse
            dayElement.addEventListener('mouseenter', (e) => {
                const rect = e.target.getBoundingClientRect();
                tooltipDiv.style.display = 'block';
                
                // Calcular posición para evitar que se salga de la pantalla
                let left = rect.left + window.scrollX + rect.width + 10;
                let top = rect.top + window.scrollY - tooltipDiv.offsetHeight / 2;
                
                // Ajustar si se sale por la derecha
                if (left + tooltipDiv.offsetWidth > window.innerWidth) {
                    left = rect.left - tooltipDiv.offsetWidth - 10;
                }
                
                // Ajustar si se sale por arriba o abajo
                if (top < 0) {
                    top = 0;
                } else if (top + tooltipDiv.offsetHeight > window.innerHeight) {
                    top = window.innerHeight - tooltipDiv.offsetHeight;
                }
                
                tooltipDiv.style.left = `${left}px`;
                tooltipDiv.style.top = `${top}px`;
            });
            
            // Ocultar tooltip al salir del día
            dayElement.addEventListener('mouseleave', () => {
                tooltipDiv.style.display = 'none';
            });
            
            // Limpiar el tooltip cuando se actualice el calendario
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.removedNodes.length > 0) {
                        tooltipDiv.remove();
                        observer.disconnect();
                    }
                });
            });
            
            observer.observe(dayElement, {
                childList: true,
                subtree: true
            });
        }
        
        calendarDays.appendChild(dayElement);
    }
    
    // Calcular días necesarios del siguiente mes
    const remainingDays = 42 - (startingDay + totalDays); // 42 = 6 filas * 7 días
    
    // Agregar días del siguiente mes
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        calendarDays.appendChild(dayElement);
    }
}

// Función para el mes anterior
function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateCalendar();
}

// Función para el mes siguiente
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateCalendar();
}

// Función para expandir/colapsar al hacer clic
function click(event, d) {
    event.stopPropagation(); // Evitar propagación del evento
    
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

// Función para procesar los datos y crear nodos de relación
function processRelationships(data) {
    const nodes = [];
    const links = [];
    const personasEnRelaciones = new Set();

    // Primero identificar todas las personas que están en relaciones
    data.nodes.forEach(node => {
        if (node.isRelationship) {
            const [persona1, persona2] = node.name.split(" y ");
            personasEnRelaciones.add(persona1);
            personasEnRelaciones.add(persona2);
        }
    });
    
    // Procesar todos los nodos
    data.nodes.forEach(node => {
        // Si es una relación o si es una persona que no está en una relación
        if (node.isRelationship || !personasEnRelaciones.has(node.name)) {
            nodes.push({
                id: node.id,
                name: node.name,
                image: node.image,
                birthDate: node.birthDate,
                celebrationDate: node.celebrationDate,
                isRelationship: node.isRelationship,
                type: node.type,
                sex: node.sex,
                parentId: node.parentId
            });
        }
    });

    // Crear enlaces para los hijos
    nodes.forEach(node => {
        if (node.parentId) {
            links.push({
                source: node.parentId,
                target: node.id
            });
        }
    });

    return { nodes, links };
}

// Función para obtener el nombre de la familia del query param
function getFamilyNameFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const familyName = urlParams.get('family');
    if (familyName) {
        return familyName.toLowerCase();
    }
    throw new Error('No se ha especificado el nombre de la familia en la URL (use ?family=nombreFamilia)');
}

// Función para obtener la ruta base
function getBasePath() {
    return window.location.hostname === 'localhost' ? '' : '/family-tree';
}

// Función para obtener la imagen por defecto según el sexo
async function getDefaultImage(node) {
    const basePath = getBasePath();
    const familyName = getFamilyNameFromUrl();
    const imageFormats = ['png', 'jpeg', 'jpg'];
    
    // Intentar cargar la imagen específica de la persona
    for (const format of imageFormats) {
        const imagePath = `${basePath}/families/${familyName}/images/${node.id}.${format}`;
        const exists = await checkImageExists(imagePath);
        if (exists) {
            return imagePath;
        }
    }

    // Si no se encuentra la imagen específica, usar la imagen por defecto según el sexo
    const defaultImage = node.sex === 'M' 
        ? `${basePath}/images/default-avatar-male.png`
        : `${basePath}/images/default-avatar-female.png`;
    
    return defaultImage;
}

// Función para verificar si una imagen existe
function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

// Función para actualizar el árbol
function update(source) {
    if (!root) {
        const processedData = processRelationships(familyData);
        root = d3.stratify()
            .id(d => d.id)
            .parentId(d => {
                if (d.parentId) return d.parentId;
                const link = processedData.links.find(l => l.target === d.id);
                return link ? link.source : null;
            })(processedData.nodes);
    }
    
    // Asignar posiciones a los nodos
    const treeData = tree(root);
    
    // Obtener nodos y enlaces
    const nodes = treeData.descendants();
    const links = treeData.links();

    // Calcular el ancho total del árbol
    const xMin = d3.min(nodes, d => d.x);
    const xMax = d3.max(nodes, d => d.x);
    const yMin = d3.min(nodes, d => d.y);
    const yMax = d3.max(nodes, d => d.y);
    
    // Calcular dimensiones totales
    const totalWidth = xMax - xMin;
    const totalHeight = yMax - yMin;
    
    // Actualizar el viewBox del SVG
    svg.attr("viewBox", `${xMin - 100} ${yMin - 100} ${totalWidth + 200} ${totalHeight + 200}`);

    // Limpiar el grupo principal antes de actualizar
    mainGroup.selectAll("*").remove();

    // Crear elementos defs para los patrones de imagen
    const defs = mainGroup.append("defs");

    // Crear patrones para todos los nodos
    const createPatterns = async () => {
        for (const d of nodes) {
            if (d.data.isRelationship) {
                // Obtener los IDs de las dos personas en la relación
                const [persona1, persona2] = d.data.name.split(" y ");
                const persona1Node = familyData.nodes.find(n => n.name === persona1);
                const persona2Node = familyData.nodes.find(n => n.name === persona2);

                // Crear patrón para persona 1
                const pattern1 = defs.append("pattern")
                    .attr("id", `avatar-left-${d.data.id}`)
                    .attr("height", 1)
                    .attr("width", 1)
                    .attr("patternUnits", "objectBoundingBox");
                
                const image1 = pattern1.append("image")
                    .attr("width", 60)
                    .attr("height", 60)
                    .attr("preserveAspectRatio", "xMidYMid slice");
                
                // Crear patrón para persona 2
                const pattern2 = defs.append("pattern")
                    .attr("id", `avatar-right-${d.data.id}`)
                    .attr("height", 1)
                    .attr("width", 1)
                    .attr("patternUnits", "objectBoundingBox");
                
                const image2 = pattern2.append("image")
                    .attr("width", 60)
                    .attr("height", 60)
                    .attr("preserveAspectRatio", "xMidYMid slice");

                // Obtener las rutas de las imágenes
                const img1Path = await getDefaultImage(persona1Node);
                const img2Path = await getDefaultImage(persona2Node);

                // Verificar si las imágenes existen y establecer las rutas correspondientes
                const [img1Exists, img2Exists] = await Promise.all([
                    checkImageExists(img1Path),
                    checkImageExists(img2Path)
                ]);

                image1.attr("href", img1Exists ? img1Path : 
                    `${basePath}/images/default-avatar-${persona1Node.sex === 'M' ? 'male' : 'female'}.png`);
                image2.attr("href", img2Exists ? img2Path : 
                    `${basePath}/images/default-avatar-${persona2Node.sex === 'M' ? 'male' : 'female'}.png`);
            } else {
                // Patrón normal para nodos individuales
                const pattern = defs.append("pattern")
                    .attr("id", `avatar-${d.data.id}`)
                    .attr("height", 1)
                    .attr("width", 1)
                    .attr("patternUnits", "objectBoundingBox");
                
                const image = pattern.append("image")
                    .attr("width", 60)
                    .attr("height", 60)
                    .attr("preserveAspectRatio", "xMidYMid slice");

                // Obtener la ruta de la imagen
                const imgPath = await getDefaultImage(d.data);
                
                // Verificar si la imagen existe
                const imgExists = await checkImageExists(imgPath);
                
                const familyName = getFamilyNameFromPath();
                const basePath = getBasePath();

                // Establecer la ruta correspondiente
                image.attr("href", imgExists ? imgPath : 
                    `${basePath}/families/${familyName}/images/default-avatar-${d.data.sex === 'M' ? 'male' : 'female'}.png`);
            }
        }
    };

    // Crear los patrones y luego continuar con el resto de la visualización
    createPatterns().then(() => {
        // Primero dibujar todos los enlaces
        const link = mainGroup.append("g")
            .attr("class", "links-group")
            .selectAll(".link")
            .data(links)
            .join("path")
            .attr("class", "link")
            .attr("d", d => {
                // Si el destino es un nodo de relación, dibuja una línea recta
                if (d.target.data.isRelationship) {
                    return `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`;
                }
                // Para los demás casos (conexiones con hijos), usa la línea vertical
                return d3.linkVertical()
                    .x(d => d.x)
                    .y(d => d.y)(d);
            })
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 2);

        // Después dibujar todos los nodos
        const nodesGroup = mainGroup.append("g")
            .attr("class", "nodes-group");

        // Actualizar los nodos
        const node = nodesGroup.selectAll(".node")
            .data(nodes)
            .join("g")
            .attr("class", d => `node ${d.data.isRelationship ? 'relationship' : ''}`)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // Agregar flechas para los enlaces que van hacia nodos de relación
        mainGroup.selectAll(".arrow")
            .remove();

        // Agregar nodos de relación (dos círculos unidos)
        node.filter(d => d.data.isRelationship)
            .each(function(d) {
                const g = d3.select(this);
                
                // Círculo izquierdo (solo visual)
                g.append("circle")
                    .attr("cx", -45)
                    .attr("r", 30)
                    .style("fill", `url(#avatar-left-${d.data.id})`)
                    .style("stroke", "#1a73e8")
                    .style("stroke-width", "3px")
                    .style("z-index", 3)
                    .style("pointer-events", "all")
                    .on("mouseover", function(event) {
                        const [persona1] = d.data.name.split(" y ");
                        const persona1Node = familyData.nodes.find(n => n.name === persona1);
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html(`<strong>${persona1Node.name}</strong><br>
                                    <span class="birth-date">Nacimiento: ${formatDate(persona1Node.birthDate)}<br>
                                    Edad: ${getAge(persona1Node.birthDate)} años</span>`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });

                // Línea de unión (solo visual)
                g.append("line")
                    .attr("x1", -15)
                    .attr("y1", 0)
                    .attr("x2", 15)
                    .attr("y2", 0)
                    .style("stroke", "#1a73e8")
                    .style("stroke-width", "3px")
                    .style("pointer-events", "none");

                // Círculo derecho (solo visual)
                g.append("circle")
                    .attr("cx", 45)
                    .attr("r", 30)
                    .style("fill", `url(#avatar-right-${d.data.id})`)
                    .style("stroke", "#1a73e8")
                    .style("stroke-width", "3px")
                    .style("z-index", 3)
                    .style("pointer-events", "all")
                    .on("mouseover", function(event) {
                        const [, persona2] = d.data.name.split(" y ");
                        const persona2Node = familyData.nodes.find(n => n.name === persona2);
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html(`<strong>${persona2Node.name}</strong><br>
                                    <span class="birth-date">Nacimiento: ${formatDate(persona2Node.birthDate)}<br>
                                    Edad: ${getAge(persona2Node.birthDate)} años</span>`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });

                // Icono de anillos en el centro (nodo interactivo)
                const ringIcon = g.append("text")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("dy", "0.3em")
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("cursor", "pointer")
                    .style("pointer-events", "all")
                    .text("💍")
                    .on("click", function(event) {
                        event.stopPropagation();
                        if (d.children) {
                            d._children = d.children;
                            d.children = null;
                        } else if (d._children) {
                            d.children = d._children;
                            d._children = null;
                        }
                        update(d);
                    })
                    .on("mouseover", function(event, d) {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        let tooltipContent = `<strong>Fecha de celebración:</strong><br>
                                            <span class="celebration-date">${formatDate(d.data.celebrationDate)}</span>`;
                        tooltip.html(tooltipContent)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
            });

        // Agregar círculos con imágenes a los nodos normales
        node.filter(d => !d.data.isRelationship)
            .append("circle")
            .attr("r", 30)
            .style("fill", d => `url(#avatar-${d.data.id})`)
            .style("stroke", d => (d.children || d._children) ? "#1a73e8" : "#ccc")
            .style("stroke-width", "3px")
            .style("cursor", "pointer")
            .style("z-index", 2)
            .on("click", click)
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(updateTooltip(d))
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Ocultar el spinner cuando todo esté cargado
        document.getElementById('loading-spinner').style.display = 'none';
    });

}

// Función para obtener el nombre de la familia del query param
function getFamilyNameFromPath() {
    const urlParams = new URLSearchParams(window.location.search);
    const familyName = urlParams.get('family');
    if (familyName) {
        return familyName.toLowerCase();
    }
    throw new Error('No se ha especificado el nombre de la familia en la URL (use ?family=nombreFamilia)');
}

// Función para cargar los datos desde el archivo JSON
async function loadFamilyData() {
    try {
        console.log('Intentando cargar datos del árbol genealógico...');
        const familyName = getFamilyNameFromPath();
        const basePath = getBasePath();
        
        // Actualizar el título con el nombre de la familia
        const familyTitle = document.getElementById('family-title');
        familyTitle.textContent = `Árbol Genealógico de la Familia ${familyName.charAt(0).toUpperCase() + familyName.slice(1)}`;
        document.title = familyTitle.textContent;
        
        const response = await fetch(`${basePath}/families/${familyName}/data/family-${familyName}.json`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Datos cargados:', data);

        // Validar la estructura de los datos
        if (!data.nodes || !Array.isArray(data.nodes)) {
            throw new Error('Estructura de datos inválida: se requiere un array de nodes');
        }

        familyData = data;
        root = null; // Resetear la raíz antes de la primera actualización
        
        console.log('Actualizando visualización...');
        update(familyData);
        updateCalendar();
        
        console.log('Datos cargados y visualización actualizada correctamente');
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        
        // Si no hay datos, crear una estructura inicial
        familyData = {
            nodes: []
        };
        
        // Mostrar un mensaje de error más descriptivo
        const errorMessage = `
            <div class="error-container">
                <p class="error">Error al cargar los datos del árbol genealógico:</p>
                <p class="error-details">${error.message}</p>
                <p class="error-details">Asegúrate de que la URL tenga el formato correcto: /?family=nombreFamilia</p>
            </div>
        `;
        
        document.getElementById('tree-container').innerHTML = errorMessage;
    }
}

// Función para expandir todo el árbol
function expandAll(node) {
    if (node._children) {
        node.children = node._children;
        node._children = null;
        node.children.forEach(expandAll);
    }
    if (node.children) {
        node.children.forEach(expandAll);
    }
}

// Función para colapsar todo el árbol
function collapseAll(node) {
    if (node.children) {
        node._children = node.children;
        node.children = null;
        node._children.forEach(collapseAll);
    }
    if (node._children) {
        node._children.forEach(collapseAll);
    }
}

// Modificar el event listener para manejar el calendario y el toggle
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando aplicación...');
    
    // Crear y añadir el spinner de carga
    const loadingSpinner = document.createElement('div');
    loadingSpinner.id = 'loading-spinner';
    loadingSpinner.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
            <div class="loading-text">Cargando árbol genealógico...</div>
        </div>
    `;
    loadingSpinner.style.position = 'fixed';
    loadingSpinner.style.top = '0';
    loadingSpinner.style.left = '0';
    loadingSpinner.style.width = '100%';
    loadingSpinner.style.height = '100%';
    loadingSpinner.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    loadingSpinner.style.display = 'flex';
    loadingSpinner.style.justifyContent = 'center';
    loadingSpinner.style.alignItems = 'center';
    loadingSpinner.style.zIndex = '9999';
    
    const spinnerStyles = document.createElement('style');
    spinnerStyles.textContent = `
        .spinner-container {
            text-align: center;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #1a73e8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        .loading-text {
            color: #1a73e8;
            font-size: 18px;
            font-family: Arial, sans-serif;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(spinnerStyles);
    document.body.appendChild(loadingSpinner);

    // Conectar los botones del calendario
    document.getElementById('prev-month')?.addEventListener('click', previousMonth);
    document.getElementById('next-month')?.addEventListener('click', nextMonth);
    
    // Función para exportar el árbol como imagen
    async function exportTreeAsImage() {
        const treeContainer = document.getElementById('tree-container');
        const exportButton = document.getElementById('export-tree');
        
        try {
            // Cambiar el texto del botón para indicar que está procesando
            exportButton.textContent = '⏳';
            exportButton.style.cursor = 'wait';
            
            // Crear una copia del SVG
            const svgElement = treeContainer.querySelector('svg');
            const svgClone = svgElement.cloneNode(true);
            
            // Obtener el viewBox actual y calcular dimensiones
            const viewBox = svgElement.getAttribute('viewBox').split(' ').map(Number);
            const width = Math.abs(viewBox[2]);
            const height = Math.abs(viewBox[3]);
            
            // Ajustar escala según el dispositivo
            const isMobile = window.innerWidth <= 768;
            const scale = isMobile ? 1 : 2;
            
            // Configurar el SVG clonado
            svgClone.setAttribute('width', width);
            svgClone.setAttribute('height', height);
            svgClone.style.background = 'white';
            
            // Asegurarse de que todos los elementos sean visibles
            const allElements = svgClone.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.style) {
                    el.style.display = '';
                    el.style.visibility = 'visible';
                }
            });
            
            // Convertir todos los patrones de imagen a imágenes embebidas
            const patterns = svgClone.querySelectorAll('pattern image');
            await Promise.all(Array.from(patterns).map(async (img) => {
                const imageUrl = img.getAttribute('href');
                try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    await new Promise((resolve, reject) => {
                        reader.onload = () => {
                            img.setAttribute('href', reader.result);
                            resolve();
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error('Error al cargar imagen:', error);
                }
            }));
            
            // Convertir SVG a string con estilos inline
            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(svgClone);
            
            // Asegurarse de que los estilos CSS estén incluidos
            const styleSheet = document.styleSheets[0];
            let cssText = '';
            for (let rule of styleSheet.cssRules) {
                cssText += rule.cssText;
            }
            svgString = svgString.replace('</defs>', `<style>${cssText}</style></defs>`);
            
            // Crear Blob y URL
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            // Crear imagen desde SVG
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = svgUrl;
            });
            
            // Crear canvas con dimensiones ajustadas
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            
            // Dibujar fondo blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Aplicar escala y dibujar imagen
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Crear nombre de archivo
            const familyName = getFamilyNameFromPath() || 'familia';
            const date = new Date().toISOString().split('T')[0];
            const fileName = `arbol-genealogico-${familyName}-${date}.png`;
            
            // Convertir a Blob con calidad ajustada según dispositivo
            canvas.toBlob(async (blob) => {
                try {
                    if (isMobile) {
                        // En móviles, abrir en nueva pestaña
                        const imageUrl = URL.createObjectURL(blob);
                        const newTab = window.open();
                        if (newTab) {
                            newTab.document.write(`
                                <html>
                                    <head>
                                        <title>${fileName}</title>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <style>
                                            body { margin: 0; padding: 16px; background: #f0f2f5; }
                                            .container { 
                                                max-width: 100%; 
                                                background: white;
                                                padding: 16px;
                                                border-radius: 8px;
                                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            }
                                            img { 
                                                max-width: 100%; 
                                                height: auto; 
                                                display: block;
                                                margin: 0 auto 16px;
                                            }
                                            .download-btn {
                                                display: block;
                                                width: 100%;
                                                padding: 12px;
                                                background: #1a73e8;
                                                color: white;
                                                border: none;
                                                border-radius: 4px;
                                                font-size: 16px;
                                                cursor: pointer;
                                                text-align: center;
                                                text-decoration: none;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="container">
                                            <img src="${imageUrl}" alt="Árbol Genealógico">
                                            <a href="${imageUrl}" download="${fileName}" class="download-btn">
                                                Descargar Imagen
                                            </a>
                                        </div>
                                    </body>
                                </html>
                            `);
                            newTab.document.close();
                        }
                    } else {
                        // En desktop, descarga directa
                        const link = document.createElement('a');
                        link.download = fileName;
                        link.href = URL.createObjectURL(blob);
                        link.click();
                        URL.revokeObjectURL(link.href);
                    }
                } catch (error) {
                    console.error('Error al procesar la imagen:', error);
                    alert('Hubo un error al procesar la imagen. Por favor, inténtalo de nuevo.');
                }
            }, 'image/png', isMobile ? 0.8 : 0.95);
            
            // Limpiar recursos
            URL.revokeObjectURL(svgUrl);
            
            // Restaurar el botón
            exportButton.textContent = '💾';
            exportButton.style.cursor = 'pointer';
        } catch (error) {
            console.error('Error al exportar el árbol:', error);
            exportButton.textContent = '❌';
            setTimeout(() => {
                exportButton.textContent = '💾';
                exportButton.style.cursor = 'pointer';
            }, 2000);
        }
    }
    
    // Añadir event listener para el botón de exportación
    document.getElementById('export-tree')?.addEventListener('click', exportTreeAsImage);
    
    // Manejar el toggle del calendario en móvil
    const toggleButton = document.getElementById('toggle-calendar');
    const calendarSection = document.querySelector('.calendar-section');
    
    toggleButton?.addEventListener('click', () => {
        calendarSection.classList.toggle('show');
    });
    
    // Cerrar el calendario al hacer click fuera de él en móvil
    document.addEventListener('click', (event) => {
        const isCalendarClick = calendarSection.contains(event.target);
        const isToggleClick = toggleButton.contains(event.target);
        
        if (!isCalendarClick && !isToggleClick && window.innerWidth <= 700) {
            calendarSection.classList.remove('show');
        }
    });

    // Manejar el toggle del árbol
    const toggleTreeButton = document.getElementById('toggle-tree');
    let isExpanded = true;

    toggleTreeButton?.addEventListener('click', () => {
        if (isExpanded) {
            collapseAll(root);
            toggleTreeButton.textContent = '⤡'; // Flechas hacia dentro
        } else {
            expandAll(root);
            toggleTreeButton.textContent = '⤢'; // Flechas hacia fuera
        }
        isExpanded = !isExpanded;
        update(root);
    });
    
    // Cargar los datos
    loadFamilyData();
});

