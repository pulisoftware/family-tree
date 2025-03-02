# Árbol Genealógico

Aplicación web para visualizar árboles genealógicos familiares con las siguientes características:

- Visualización interactiva del árbol familiar
- Calendario de cumpleaños
- Soporte para múltiples familias
- Tooltips informativos
- Diseño responsive

## Uso

La aplicación permite visualizar diferentes árboles genealógicos usando el parámetro `family` en la URL:

- Para ver la familia Pulido: `https://[tu-usuario].github.io/family-tree/?family=pulido`
- Para ver la familia García: `https://[tu-usuario].github.io/family-tree/?family=garcia`

## Estructura del Proyecto

```
/family-tree
  /families
    /pulido
      /data
        - family-pulido.json
      /images
        - default-avatar-male.png
        - default-avatar-female.png
    /garcia
      /data
        - family-garcia.json
      /images
        - default-avatar-male.png
        - default-avatar-female.png
  /js
    - main.js
  /css
    - styles.css
  - index.html
```

## Tecnologías Utilizadas

- D3.js para la visualización del árbol
- JavaScript vanilla para la lógica de la aplicación
- HTML5 y CSS3 para la estructura y estilos 