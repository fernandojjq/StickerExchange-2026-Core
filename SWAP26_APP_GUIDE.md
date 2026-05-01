# Swap-26: Guía Completa para Creadores de Contenido

## Descripción General del Proyecto

**Swap-26** es una aplicación web progresista (PWA) diseñada para gestionar y facilitar el intercambio de stickers físicos del álbum oficial del **Copa Mundial de la FIFA 2026**. La app permite a los usuarios:

- **Inventariar sus stickers** (qué tienen repetido, cuáles les faltan)
- **Generar códigos QR** con su colección para compartir con otros usuarios
- **Escanear códigos QR** de otros usuarios para encontrar coincidencias de intercambio
- **Realizar intercambios** de forma offline (usando códigos QR) o en vivo (sincronización en tiempo real mediante Firebase)

---

## El Álbum: Números y Estructura

### Total de Stickers

El álbum del Copa Mundial 2026 contiene un total de **980 stickers** en su versión base, distribuidos de la siguiente manera:

| Sección | Cantidad | Descripción |
|---------|----------|-------------|
| **Stickers Especiales FWC** | 20 | Logos, estadios, mascota e historia del torneo |
| **Stickers de Selecciones** | 960 | 48 selecciones × 20 stickers cada una |
| **TOTAL ÁLBUM BASE** | **980** | Estrictos para completar el álbum |

### Colecciones Adicionales (No cuentan para completar el álbum)

| Colección | Cantidad | Descripción |
|-----------|----------|-------------|
| **EXTRAS** | 20 | Stickers premium numerados E1-E20 |
| **PROMO (Partner)** | 14 | Stickers promocionales numerados C1-C14 |
| **TOTAL EXTRAS + PROMO** | **34** | No requieren para completar el álbum |

### Total Completo del Producto Físico

- **Álbum Base**: 980 stickers
- **Colecciones Adicionales**: 34 stickers
- **TOTAL IMPRESO**: **1.014 stickers** (1012 en algunas regiones)

> ⚠️ **NOTA IMPORTANTE**: Los stickers promocionales (PROMO) y EXTRAS **NO cuentan** para el progreso de completación del álbum base. Dependiendo de la región o país, la cantidad total impresa puede variar entre 1012 y 1014 stickers.

---

## Estructura Detallada del Álbum

### 1. Stickers Especiales del Torneo (FWC)

Esta sección contiene **20 stickers** con contenido institucional:

| Rango de Números | Cantidad | Tipo |
|------------------|----------|------|
| 00 | 1 | Logo Conmemorativo |
| 01-05 | 5 | Emblema del Torneo |
| 06-08 | 3 | Ciudades Sede |
| 09-19 | 11 | Historia y Mascota |

### 2. Selecciones Nacionales (48 Equipos)

Cada selección nacional contiene exactamente **20 stickers**:

| Rango de Números | Cantidad | Tipo |
|------------------|----------|------|
| 01 | 1 | Escudo/Badge del Equipo |
| 02-12 | 11 | Jugadores (plantilla principal) |
| 13 | 1 | Foto de Equipo |
| 14-20 | 7 | Jugadores adicionales |

**Total por selección**: 20 stickers  
**Total 48 selecciones**: 48 × 20 = **960 stickers**

### 3. Organización en Grupos

Los 48 equipos están organizados en **12 grupos** (A, B, C, D, E, F, G, H, I, J, K, L), con **4 equipos por grupo**.

---

## Secciones de la Aplicación

### Sección 1: Álbum (Inventario)

La sección principal donde los usuarios gestionan su colección personal:

**Funcionalidades:**
- **Buscar stickers** por número o nombre de país
- **Filtrar** por estado:
  - TODOS: Ver todos los stickers
  - FALTANTES: Solo los que no tiene
  - REPETIDAS: Los que tiene en duplicate
- **Filtrar por tipo**:
  - TODOS
  - ESCUDOS: Solo badges/logos de equipos
  - PROMO: Stickers promocionales (C1-C14)
  - EXTRAS: Stickers premium (E1-E20)
  - JUGADORES: Todos los jugadores
- **Contador de inventario**: Muestra estadísticas
  - Total de stickers únicos
  - Cantidad de repetidas
  - Progreso de completación

**Gestión de Stickers:**
- Tocar **+** para añadir repetidas (incrementa contador)
- Tocar **-** para quitar repetidas (decrementa contador)
- Mantener presionado para marcar como urgente (prioridad)

### Sección 2: Intercambio (Swap Center)

Centro de intercambio con dos modos de operación:

#### Modo Offline (QR Codes)
- Genera un código QR que representa tu colección de repetidas
- Otros usuarios escanean tu QR para ver qué pueden cambiarte
- No requiere conexión a internet
- Escaneo de QR mediante cámara o subiendo imagen

#### Modo En Vivo (Firebase Realtime Database)
- Crear sala de intercambio con código único
- Unirse a sala mediante código o escaneando QR
- Sincronización en tiempo real
- Ambos usuarios deben confirmar el intercambio
- Requiere conexión a internet

**Flujo de Intercambio:**
1. Escanear QR del amigo → Ver coincidencias
2. Seleccionar stickers que quieres recibir
3. Seleccionar stickers que vas a entregar
4. Tu amigo hace lo mismo en su teléfono
5. Ambos confirman
6. Se actualizan los inventarios automáticamente

### Sección 3: Mi Perfil (Mi ID)

Gestión del perfil de usuario:

- **Nombre personalizado**: Para identificarte en los intercambios
- **Código QR personal**: Tu identificación única
- **Estadísticas personales**:
  - Stickers totales
  - Stickers únicos obtenidos
  - Total de intercambios realizados
- **Historial de intercambios**: Registro de cambios hechos

---

## Sistema de Identificación de Stickers

### Formato de IDs

Cada sticker tiene un identificador único con formato:

```
[PREFIX]-[NUMBER]
```

### Prefijos Utilizados

| Prefijo | Significado | Ejemplo |
|---------|-------------|---------|
| **FWC** | FIFA World Cup (Especiales) | FWC-01, FWC-15 |
| **[ISO-3]** | Código país de 3 letras | ARG, BRA, MEX, USA |
| **EXT** | Extra Stickers | EXT-01, EXT-20 |
| **CC** | Coca-Cola Promo | CC-01, CC-14 |

### Ejemplos de Identificadores

- `FWC-00`: Logo conmemorativo
- `ARG-01`: Escudo de Argentina
- `ARG-07`: Jugador número 7 de Argentina
- `BRA-13`: Foto de equipo de Brasil
- `EXT-05`: Sticker Extra número 5
- `CC-12`: Sticker promocional número 12

---

## Preguntas Frecuentes para Contenido SEO

### ¿Cuántos stickers tiene el álbum del Mundial 2026?

El álbum base contiene **980 stickers** (20 especiales + 960 de 48 selecciones). Con las colecciones adicionales, el total impreso es de **1.014 stickers** (algunas regiones 1.012).

### ¿Cuántos equipos/chromos tiene el álbum?

El álbum incluye **48 selecciones nacionales**, cada una con 20 stickers, organizadas en 12 grupos (A-L) de 4 equipos cada uno.

### ¿Cuáles son los stickers más difíciles de conseguir?

Generalmente:
- Los stickers especiales del torneo (FWC)
- Los escudos de equipos (01 de cada selección)
- Los stickers EXTRAS y PROMO (no cuentan para completar)

### ¿Cómo funciona el intercambio?

1. Ambos usuarios registran sus repetidas en la app
2. Generan/scanean códigos QR
3. La app calcula coincidencias automáticamente
4. Seleccionan qué intercambiar
5. Confirman y se actualizan los inventarios

### ¿Cuántos stickers necesito para completar el álbum?

Para completar el álbum base necesitas **980 stickers únicos** (todos los FWC + todos los de las 48 selecciones).

---

## Glosario de Términos

| Término | Definición |
|---------|------------|
| **Sticker/FIFA Sticker** | Imagen adhesiva del álbum, puede ser jugador, escudo, logo o estadio |
| **Álbum** | Libro coleccionable donde se pegan los stickers |
| **Repeated/Repetida** | Sticker que tienes más de una copia |
| **Missing/Faltante** | Sticker que aún no tienes |
| **Swap/Intercambio** | Acción de cambiar stickers con otro coleccionista |
| **QR Code** | Código de barras bidimensional para compartir información |
| **PWA** | Progressive Web App - aplicación web instalable |
| **Inventory/Inventario** | Tu colección registrada en la app |
| **Album Base** | Los 980 stickers estándar del álbum |
| **Extras** | 20 stickers premium adicionales |
| **Promo/PROMO** | 14 stickers promocionales del socio |
| **Full Album** | Álbum base + Extras + Promo = 1.014 stickers |

---

## Notas Técnicas Importantes para Creadores

### ⚠️ Errores Comunes a Evitar

1. **NO confundir** los números de stickers:
   - FWC: 00, 01-05, 06-08, 09-19 (20 total)
   - Equipos: 01-20 cada uno (20 por selección)
   - EXTRAS: E1-E20 (20 total)
   - PROMO: C1-C14 (14 total)

2. **NO decir** que los EXTRAS o PROMO cuentan para completar:
   - Son coleccionables adicionales
   - No afectan el progreso del álbum base
   - Son opcionales

3. **NO inventar** números de stickers:
   - Los jugadores NO tienen nombres en la app
   - Solo números (01-20 por equipo)
   - Los stickers especiales tienen prefijos (FWC-, EXT-, CC-)

4. **NO confundir** el total:
   - 980 = álbum base
   - 1.014 = total completo impreso
   - 48 = número de selecciones
   - 12 = número de grupos
   - 4 = equipos por grupo

### ✅ Información Verificada

- **URL oficial**: swap26.pages.dev
- **Nombre de la app**: Swap-26 o SWAP-26
- **Plataforma**: PWA (Progressive Web App)
- **Tecnologías**: React, Vite, Firebase (para modo en vivo)
- **Idiomas**: Español e Inglés (soporte multilenguaje)
- **Métodos de intercambio**: QR offline + Firebase Realtime

---

## Datos para SEO

### Palabras Clave Principales
- swap 26
- álbum mundial 2026
- intercambio stickers fifa 2026
- album panini 2026
- stickers mundial méxico
- cómo completar álbum mundial

### Palabras Clave de Larga Cola
- app para intercambiar stickers mundial
- calcular cuántas repetidas tengo álbum 2026
- mejor método para completar álbum panini
- truco para conseguir stickers raros mundial

### Meta Descripción Sugerida

> "Swap-26 es la herramienta definitiva para manage your FIFA World Cup 2026 sticker collection. Scan QR codes, find swap matches instantly, and complete your album faster. Free PWA app."

---

## Resumen Ejecutivo

**Swap-26** es una aplicación web que facilita el intercambio de stickers del álbum del Copa Mundial FIFA 2026. El álbum contiene **980 stickers base** (20 especiales + 960 de 48 selecciones en 12 grupos), más **34 stickers adicionales** (20 EXTRAS + 14 PROMO) para un total de **1.014 stickers**. La app permite gestionar tu inventario, generar códigos QR para compartir repetidas, y realizar intercambios tanto offline como en tiempo real.

---

*Documento creado: Mayo 2026*  
*Versión del manifest: V6.3*  
*Total stickers verificados: 1.014 (álbum completo)*
