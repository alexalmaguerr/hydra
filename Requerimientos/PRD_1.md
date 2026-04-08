Aquí tienes el PRD **pasado a texto** (limpio y con el mismo contenido/estructura). 

---

# PRD – Draft – 2026-02-23

## Contexto

Sesiones del **23/02/2026** enfocadas en entender el estado actual de Aquasis y los sistemas satélite (recaudación, órdenes, GIS, SAP/contabilidad, trámites y portal de clientes), así como sus principales dolores operativos y contables. Participan principalmente **Jessica, Yessenia, Mitzael y Alejandro**.

El objetivo es definir lineamientos de diseño para un nuevo ecosistema de aplicaciones que:

---

## Requerimientos

### Módulo de lecturas y archivos planos

* Simplifique flujos operativos y contables.
* Elimine duplicidades entre sistemas (Aquasis, Q Order, herramientas de recaudación, scripts GIS, etc.).
* Siente las bases para un modelo de datos más limpio, parametrizable y trazable (personas, contratos, puntos de servicio, integraciones contables y GIS).

1. Mantener un esquema de archivos planos estandarizados para el intercambio de lecturas entre Aquasis y el nuevo sistema (archivos de salida y de regreso), con layouts claramente documentados.
2. Incluir en los archivos de lecturas: administración, zona, tipo de lote (lectura/inspección/repaso), contrato, lecturas, incidencias, URL de foto, consumos históricos y demás datos necesarios para validaciones.
3. Validar al cargar un lote que todos los contratos traigan lectura o incidencia, bloqueando la carga si falta información mínima.
4. Generar lecturas estimadas automáticamente cuando la incidencia corresponda a avería, para no detener procesos de facturación.
5. Revisar y optimizar el mecanismo actual de “bolsa de estimación” y sus ajustes posteriores, evitando prácticas que generen desfaces contables o de consumo.
6. Catálogos de lecturistas e incidencias: centralizar y sincronizar los catálogos de lecturistas, contratistas e incidencias, de forma que se actualicen automáticamente con cada lote procesado.
7. Permitir agrupar y administrar lecturistas por contratista/cuadrilla para facilitar la operación de campo.
8. Habilitar la posibilidad de ignorar campos no utilizados por el negocio en ciertos contextos, sin romper integraciones ni layouts.
9. Descargar, depurar y mantener un catálogo de incidencias limpio (por ejemplo en Excel) como referencia maestra para el diseño y para parametrización futura.

### Mensajes de lecturistas y comentarios de campo

10. Evaluar el uso del archivo actual de mensajes de lecturistas (“archivo menos”) para capturar comentarios adicionales de campo relevantes para operación y facturación.
11. Definir estructura mínima, reglas de uso y política de habilitación/deshabilitación del módulo de mensajes, incluyendo si debe integrarse al nuevo flujo o mantenerse deshabilitado.

### Recaudación externa y ETL de pagos

12. Mantener/definir un servicio de aplicación de pagos que reciba al menos: contrato, importe, fecha real de pago, canal, forma de pago, oficina y usuario, con controles de seguridad y permisos ligados a oficinas/usuarios.
13. Diseñar un ETL de recaudación que normalice múltiples formatos de recaudadores externos a un layout estándar, identificando campos clave aunque no haya encabezados o estos varíen.
14. Validar que la fecha de pago en el sistema represente el día real en que el cliente pagó (incluyendo fines de semana), aunque el archivo llegue días después.
15. Implementar reglas para rechazar registros inconsistentes (montos, contratos inválidos, datos incompletos, etc.) y enviarlos a una carpeta o bandeja de error para revisión y reproceso.
16. Definir reglas de asignación por defecto de forma de pago cuando no venga explícita en los archivos recibidos.

### Sistema de órdenes (corte, instalación, reconexión, etc.)

17. Diseñar un sistema de órdenes centralizado como fuente única de verdad; otros sistemas solo consumen y actualizan vía servicios.
18. Evitar la duplicidad actual Aquasis / Q Order, decidiendo si Q Order se sustituye completamente o se mantiene como cliente de servicios del nuevo sistema de órdenes.
19. Definir y documentar los servicios web a exponer (consulta de orden, actualización de estatus, captura de datos operativos clave) y las responsabilidades de cada sistema involucrado.

### Integración contable con SAP u otro ERP

20. Definir un modelo de integración contable parametrizable que genere pólizas a partir de transacciones (facturación, convenios, ajustes, etc.) sin depender de sistemas intermedios obsoletos.
21. Cubrir los tipos de pólizas requeridos: facturación diaria, convenios, ajustes, cancelaciones, entre otros, corrigiendo problemas históricos de migraciones previas.
22. Trabajar con layouts “antes y después” para validar que la información generada sea compatible con SAP o con el ERP que lo reemplace.
23. Diseñar un sistema contable propio o una capa de parametrización que pueda adaptarse a cambios futuros en el ERP sin rediseñar la operación comercial.

### Integración y conciliación con GIS

24. Rediseñar el flujo de actualización entre Aquasis y GIS para enviar solo cambios relevantes (nuevos contratos, puntos de servicio, cambios de sector, etc.), evitando cargas completas innecesarias.
25. Sustituir o mejorar los scripts Python actuales, reduciendo dependencias frágiles y ventanas de pérdida de datos.
26. Permitir identificar y extraer cambios desde la última actualización exitosa, evitando recorridos completos de la base.
27. Incluir mecanismos de conciliación y monitoreo para detectar fallas (por ejemplo, sectores sin actualizar) y corregirlas oportunamente.

### Modelo de datos de personas, contratos y puntos de servicio

28. Rediseñar el modelo actual que mezcla propietario, cliente y persona fiscal con datos dispersos y parchados.
29. Separar claramente entidades y roles (persona, cliente, propietario, persona fiscal) con relaciones bien definidas y trazables.
30. Permitir que un contrato tenga histórico de tarifas, estatus y cambios de uso (doméstico/comercial/otros) sin romper la trazabilidad.
31. Evitar duplicidad de información en puntos de servicio, lecturas y órdenes; el contrato/punto de servicio debe ser el eje de consolidación.

### Gestión de contratos, trámites y documentos

32. Diseñar flujos para altas, bajas, cambios de nombre, subrogaciones y trámites especiales (bajas temporales, descuentos, etc.) partiendo de un contrato existente o incluso sin número de contrato (folios previos).
33. Integrar mejor cláusulas, documentos y gestor de cobro alrededor del contrato, reduciendo procesos manuales y dispersos.
34. Unificar simuladores y facturas manuales para que estén vinculados al contrato y no vivan en herramientas aisladas.

### Módulo de atención al cliente y quejas

35. Definir un módulo de atención que muestre información relevante (saldos, pagos, facturas, quejas y aclaraciones) sin exponer datos excesivamente técnicos al personal de atención.
36. Integrarse con herramientas externas de gestión de reclamos cuando ya existan, evitando duplicar flujos y formularios.
37. Asegurar que la información de quejas y aclaraciones se use como dato informativo de contexto en la atención al cliente y la toma de decisiones.

---

## Supuestos / restricciones

### Portal de clientes y pagos en línea

38. Definir el portal de clientes como canal principal para trámites y pagos, integrando datos de Aquasis y del nuevo sistema comercial.
39. Incluir ligas de pago tanto desde Aquasis como desde el nuevo sistema, consolidando opciones de pago virtual y recaudación.
40. Lanzar el portal antes que otras funcionalidades para acelerar beneficios en cobranza y autoservicio.
41. Integrar el portal con sistemas de cobranza y convenios ya existentes, respetando permisos y roles por área.
42. Simplificar la visualización para usuarios finales y agentes de atención (saldos, pagos, estados en tiempo real, navegación sencilla entre contratos/facturas/pagos).

### Caja, recaudación interna, parcialidades y convenios

43. Rediseñar los módulos de caja/recibos para que sean usables y unificados (apertura, anticipos, pagos parciales, devoluciones), evitando módulos paralelos.
44. Clarificar el manejo de parcialidades y convenios con múltiples facturas ligadas, evitando movimientos contables confusos o dobles aplicaciones.
45. Mejorar la gestión de saldos a favor y deudas para que anticipos se apliquen de forma automática y transparente tras el timbrado.
46. Definir claramente roles y permisos para evitar que áreas no autorizadas modifiquen cobros o apliquen ajustes sensibles.

### Monitoreo, conciliaciones y operación

47. Implementar monitoreo de procesos críticos (ETL de pagos, scripts GIS, generación de pólizas, validación de lecturas, etc.) con alertas tempranas ante fallas.
48. Establecer conciliaciones periódicas entre sistemas (por ejemplo, padrón vs GIS, recaudación vs facturación, facturación vs contabilidad) para detectar y corregir desfaces.

**Notas de supuestos:**

* Se mantendrá, al menos en el corto plazo, un esquema de intercambio por archivos planos entre Aquasis y el nuevo sistema para lecturas y posiblemente otros procesos, incluso si se avanza hacia servicios más directos.
* Se asume la coexistencia temporal de sistemas actuales (Aquasis, Q Order, scripts Python de GIS, herramientas de recaudación) mientras se diseña y despliega el modelo objetivo.
* El nuevo ecosistema deberá integrarse con SAP u otro ERP para efectos contables, por lo que el modelo de integración debe ser parametrizable y tolerante a cambios de ERP.

---

## Preguntas abiertas

1. ¿Cuál será la decisión final sobre Q Order: se sustituye completamente por el nuevo sistema de órdenes o se mantiene como cliente de servicios especializado en ciertos casos?
2. ¿Cómo se diseñará en detalle el modelo contable parametrizable (catálogos, reglas de generación de pólizas, esquemas de mapeo a SAP/ERP) y qué equipo será responsable de su gobierno?
3. ¿Cuál será la estructura final de entidades (persona, cliente, propietario, persona fiscal) y las reglas de negocio asociadas (cambios de rol, uniones y separaciones de cuentas, etc.)?
4. ¿Cuál será el alcance definitivo del módulo de mensajes de lecturistas (campos mínimos, visibilidad en otros módulos, impacto en validaciones y facturación)?
5. ¿Qué reglas específicas se aplicarán para el manejo de la bolsa de estimación, el cálculo de estimadas y sus ajustes posteriores para evitar distorsiones en consumos y contabilidad?
6. ¿Cuáles serán los criterios de rechazo y reproceso de pagos en el ETL de recaudación (por tipo de error, niveles de tolerancia, responsables de corrección y tiempos objetivo)?
7. ¿Qué niveles de monitoreo y alertamiento se requieren (SLA, dashboards, notificaciones) para procesos críticos como lecturas, recaudación, generación de pólizas e integraciones GIS?
8. ¿Qué grado de simplificación de interfaz se espera en el módulo de atención y en el portal de clientes (por ejemplo, vistas por tipo de usuario, perfiles especializados, accesibilidad)?

---

## Posibles tareas

* Documentar y versionar el layout estándar de archivos de lecturas, incluyendo ejemplos de archivos actuales y objetivo.
* Levantar y depurar el catálogo maestro de incidencias, consolidando la lista actual y proponiendo una estructura limpia para el nuevo sistema.
* Elaborar un inventario de recaudadores externos y sus formatos actuales, como insumo para el diseño del ETL y del layout estándar de pagos.

---

## Notas adicionales

* Mapear los procesos actuales de caja y recaudación interna, identificando puntos de dolor para alimentar el rediseño de módulos de caja.
* Documentar los flujos de altas, bajas y trámites especiales de contratos, incluyendo variaciones relevantes y ejemplos de casos límite.
* Levantar un primer modelo conceptual de datos (personas, contratos, puntos de servicio, órdenes, lecturas, pagos) como base para diseño lógico posterior.
* Inventariar y evaluar los scripts Python de GIS y otros conectores actuales, identificando los flujos que deberán rediseñarse.
* Definir la primera versión del roadmap de implementación (qué módulos salir primero: portal, ETL de pagos, modelo de datos, etc.).
* Se acordó utilizar Teams para sesiones largas de lunes y Meet para revisiones rápidas de jueves, como dinámica de trabajo recurrente.
* Los entregables esperados incluyen: documentación estructurada de requerimientos, ejemplos de archivos, layouts de integración, scripts y un paquete ZIP de interfaces y documentos.

---