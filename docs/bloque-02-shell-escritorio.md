# Bloque 2 - Shell profesional de escritorio

## Objetivo

Convertir la base visual de AutoVideoJeff en una app pensada para PC/escritorio, usando todo el espacio disponible y manteniendo una distribución más parecida a software profesional de edición.

Este bloque no cambia todavía el flujo funcional por etapas. Prepara el espacio visual donde luego se montarán Nuevo Proyecto limpio, Entendimiento, Plan de edición, Producción, Adaptación y Resultado.

## Cambios aplicados

### 1. Ventana Electron más profesional

La ventana principal pasa a abrirse con mayor tamaño base, mínimos más cómodos y maximización automática.

Configuración esperada:

```text
width: 1600
height: 940
minWidth: 1180
minHeight: 720
autoHideMenuBar: true
maximize al mostrar la ventana
```

### 2. CSS de escritorio separado

Se crea:

```text
app/desktop-shell.css
```

Este archivo contiene las reglas principales de escritorio:

```text
layout a pantalla completa
menú lateral fijo
zona central amplia
scroll interno por pantalla
tarjetas compactas
grilla de dos columnas en Nuevo Proyecto
comparación antes/después en dos columnas
producción preparada para timeline profesional
```

### 3. Carga automática del shell

El archivo:

```text
app/navegacion/navegacion-bootstrap.js
```

ahora inyecta `desktop-shell.css` al iniciar la navegación. Esto permite que el shell de escritorio se cargue después de los estilos antiguos y pueda sobrescribirlos sin eliminar la base actual.

### 4. Base visual que se conserva

Se conserva:

```text
navegación actual
pantallas existentes
nuevo proyecto actual
producción actual
resultado actual
biblioteca
historial
ajustes
diagnóstico
```

La diferencia es que ahora quedan dentro de una distribución de escritorio más amplia y compacta.

## Qué no cambia todavía

Este bloque todavía no cambia:

```text
flujo de procesado
rutas API
Nuevo Proyecto limpio
Entendimiento independiente
Plan de edición
Adaptación a plataformas
```

Eso se hará en los siguientes bloques.

## Criterio de aceptación

El bloque queda correcto si:

```text
app/desktop-shell.css existe
navegacion-bootstrap.js carga desktop-shell.css
main.js usa ventana grande y maximizada
package.json contiene check:bloque02-redisenio
scripts/verificar-bloque-02-shell-escritorio.js valida el bloque
```

## Estado

```text
bloque: 2
nombre: Shell profesional de escritorio
estado: implementado
cambia_funcionamiento: no
siguiente_bloque: Estado de proyecto por etapas
```
