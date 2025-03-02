const margin = { top: 40, right: 120, bottom: 40, left: 120 };
const width = 1000 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

// Crear el contenedor SVG
const svg = d3.select("#tree-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Crear el layout del árbol
const tree = d3.tree()
    .nodeSize([80, 120])
    .separation((a, b) => a.data.isRelationship && b.data.isRelationship ? 2 : 1.5);

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
                const nextAge = getAge(person.birthDate) + 1;
                return `<strong>${person.name}</strong><br>
                        Cumplirá ${nextAge} años`;
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

// Función para obtener la ruta base
function getBasePath() {
    return window.location.hostname === 'localhost' ? '' : '/family-tree';
}

// Función para obtener la imagen por defecto según el sexo
function getDefaultImage(node) {
    const familyName = getFamilyNameFromPath();
    const basePath = getBasePath();
    if (!node.image) {
        return node.sex === 'M' ? 
            `${basePath}/families/${familyName}/images/default-avatar-male.png` : 
            `${basePath}/families/${familyName}/images/default-avatar-female.png`;
    }
    return `${basePath}/families/${familyName}/images/${node.image}`;
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
    
    // Actualizar el tamaño del SVG basado en el contenido
    const svgWidth = xMax - xMin + margin.left + margin.right;
    const svgHeight = yMax - yMin + margin.top + margin.bottom;
    
    // Actualizar el viewBox para centrar el árbol
    d3.select("#tree-container svg")
        .attr("viewBox", `${xMin - margin.left} ${-margin.top} ${svgWidth + margin.left} ${svgHeight + margin.top}`);

    // Limpiar el SVG antes de actualizar
    svg.selectAll("*").remove();

    // Crear elementos defs para los patrones de imagen
    const defs = svg.append("defs");

    // Crear patrones para todos los nodos
    nodes.forEach((d) => {
        if (d.data.isRelationship) {
            // Obtener los IDs de las dos personas en la relación
            const [persona1, persona2] = d.data.name.split(" y ");
            const persona1Node = familyData.nodes.find(n => n.name === persona1);
            const persona2Node = familyData.nodes.find(n => n.name === persona2);

            // Crear patrón para persona 1
            defs.append("pattern")
                .attr("id", `avatar-left-${d.data.id}`)
                .attr("height", 1)
                .attr("width", 1)
                .attr("patternUnits", "objectBoundingBox")
                .append("image")
                .attr("href", getDefaultImage(persona1Node))
                .attr("width", 40)
                .attr("height", 40)
                .attr("preserveAspectRatio", "xMidYMid slice");

            // Crear patrón para persona 2
            defs.append("pattern")
                .attr("id", `avatar-right-${d.data.id}`)
                .attr("height", 1)
                .attr("width", 1)
                .attr("patternUnits", "objectBoundingBox")
                .append("image")
                .attr("href", getDefaultImage(persona2Node))
                .attr("width", 40)
                .attr("height", 40)
                .attr("preserveAspectRatio", "xMidYMid slice");
        } else {
            // Patrón normal para nodos individuales
            defs.append("pattern")
                .attr("id", `avatar-${d.data.id}`)
                .attr("height", 1)
                .attr("width", 1)
                .attr("patternUnits", "objectBoundingBox")
                .append("image")
                .attr("href", getDefaultImage(d.data))
                .attr("width", 40)
                .attr("height", 40)
                .attr("preserveAspectRatio", "xMidYMid slice");
        }
    });

    // Primero dibujar todos los enlaces
    const link = svg.append("g")
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
    const nodesGroup = svg.append("g")
        .attr("class", "nodes-group");

    // Actualizar los nodos
    const node = nodesGroup.selectAll(".node")
        .data(nodes)
        .join("g")
        .attr("class", d => `node ${d.data.isRelationship ? 'relationship' : ''}`)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Agregar flechas para los enlaces que van hacia nodos de relación
    svg.selectAll(".arrow")
        .remove();

    // Agregar nodos de relación (dos círculos unidos)
    node.filter(d => d.data.isRelationship)
        .each(function(d) {
            const g = d3.select(this);
            
            // Añadir evento de clic al grupo
            g.style("cursor", "pointer")
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
                });
            
            // Círculo izquierdo
            g.append("circle")
                .attr("cx", -35)
                .attr("r", 20)
                .style("fill", `url(#avatar-left-${d.data.id})`)
                .style("stroke", "#1a73e8")
                .style("stroke-width", "3px")
                .style("z-index", 3)
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

            // Línea de unión
            g.append("line")
                .attr("x1", -15)
                .attr("y1", 0)
                .attr("x2", 15)
                .attr("y2", 0)
                .style("stroke", "#1a73e8")
                .style("stroke-width", "3px");

            // Icono de anillos en el centro
            const ringIcon = g.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("dy", "0.3em")
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("💍")
                .on("mouseover", function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    let tooltipContent = `<strong>Fecha de celebración:</strong><br>
                                        <span class="celebration-date">${formatDate(d.data.celebrationDate)}</span>`;
                    if (d.children || d._children) {
                        tooltipContent += '<br><span class="hint">(Click para expandir/colapsar)</span>';
                    }
                    tooltip.html(tooltipContent)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // Círculo derecho
            g.append("circle")
                .attr("cx", 35)
                .attr("r", 20)
                .style("fill", `url(#avatar-right-${d.data.id})`)
                .style("stroke", "#1a73e8")
                .style("stroke-width", "3px")
                .style("z-index", 3)
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
        });

    // Agregar círculos con imágenes a los nodos normales
    node.filter(d => !d.data.isRelationship)
        .append("circle")
        .attr("r", 20)
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

// Modificar el event listener para solo manejar el calendario
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando aplicación...');
    
    // Conectar los botones del calendario
    document.getElementById('prev-month')?.addEventListener('click', previousMonth);
    document.getElementById('next-month')?.addEventListener('click', nextMonth);
    
    // Cargar los datos
    loadFamilyData();
});

