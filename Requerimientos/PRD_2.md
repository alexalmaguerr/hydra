Alta de contrato digital, gente en comunidades o personas 

Descuentos

Reconexión queja/tramite (convenios), atención al publico, sis secubre en su totalidad se genera en automatico la factura y orden de reconexión,

Flujo de convenios
Generar bandera de si tiene ese conexionarme, se paga anticipo
Condiciones de la reconexión
Seguimiento de solicitudes y ordenes de reconexión 

Indicadores digital, presencial o hibrido
Baja temporal genera una orden de baja, quitar medidor

Candado en interfaz si no tiene adeudo cero

Cuando esta bloqueado por jurídico no debe mostrar nada 

Estatus de contrato

Agregar una seccion para update de datos fiscales 

Subir constancia fiscales 

Pagos adelantados con descuento
Actualización de contactos

Pago anticipado con descuentos

Solicitudes dinámicas para alta de contratos, queda pendiente revisar con comercial

Revisión de medidor 

Seguridadd ligar con Eldat 

consulta y descarga de los timbrados

"pago anticipado con descuento dentro del apartado con descuento"
"revisión de medidor ver la opción de intregrarlo dentro de solicitudes"


Aquí tienes el **PRD convertido a texto** (copiado del PDF) 

---

## PRD – Draft – 2026-02-26

### Contexto

Se presentó y revisó un prototipo de portal de trámites digitales para clientes de CEA y de un módulo interno de atención, construido a partir de los requerimientos levantados en la sesión del lunes previo. Participaron principalmente Jessica Godínez, Ian Hernández, Mitzael Serna, Sergio Almaguer, Yessenia Ruiz y Alejandro Almaguer, con el objetivo de:

El enfoque principal es contar con un portal único con ruteo por roles/perfiles (cliente externo y atención interna) que consuma datos reales de CEA, automatice procesos críticos (especialmente reconexión) y reduzca la necesidad de que el personal de atención use múltiples sistemas en paralelo, integrándose con Ágora para la gestión centralizada de tickets y quejas.

---

## Requerimientos

### Portal de cliente y módulo interno de atención a clientes

* Validar flujos clave de negocio: trámites (alta/baja/cambio de propietario), reconexión, convenios, estatus de contratos y órdenes.
* Alinear la integración con Ágora como sistema de gestión de tickets y quejas.
* Aterrizar la estrategia de firma digital conforme a NOM 151, manteniendo en paralelo flujos presenciales donde la normativa así lo requiera.
* Obtener retroalimentación para una iteración rápida del prototipo antes de avanzar a nuevos módulos.

1. El flujo de trámites debe permitir combinación de trámite digital y atención presencial cuando existan limitaciones legales o de preferencia del usuario.
2. El sistema debe automatizar la generación de órdenes de reconexión cuando se cumplan las condiciones de negocio (por ejemplo, pago total o cumplimiento de convenio), evitando reconexiones manuales propensas a fallo.
3. Debe existir una sección de seguimiento de órdenes donde el cliente pueda ver historial y estado de órdenes de reconexión, cortes y otros eventos relevantes.
4. El sistema debe implementar candados en la interfaz para impedir iniciar trámites que requieran adeudo cero (especialmente bajas temporales y permanentes) cuando existan adeudos.
5. Realizar el envío del folio por correo o a través de Whatsapp una vez finalizado el trámite.
6. Deben mostrarse mensajes claros y visibles indicando por qué no se puede iniciar un trámite (adeudos, bloqueo jurídico, etc.) antes de que el usuario intente avanzar.
7. Se requieren indicadores visuales previos al inicio del trámite (por ejemplo, badges o alertas en el contrato) que muestren condiciones que limitan la operación.
8. El sistema debe soportar convenios de pago parametrizables, permitiendo ajustar porcentajes de anticipo y número de parcialidades (típicamente 6–12 meses), con flexibilidad controlada por reglas de negocio.
9. Debe existir la opción de consulta y descargada de timbrados, tanto de pagos como de facturas.
10. Al crear un nuevo convenio se deben de asignar todas las facturas a las cuales se aplicará dicho convenio y se que pueda parametrizar, además de incluir los datos de con quién se está realizando el convenio y documentos requeridos para poder realizar el trámite.
11. Se requiere una checklist interna para convenios que permita a usuarios internos validar documentación y requisitos antes de emitir el convenio.
12. Los catálogos de documentos requeridos por trámite deben basarse en normativas/catálogos oficiales e indicar explícitamente cuáles pueden digitalizarse y cuáles deben seguir siendo físicos.
13. Los requisitos de documentos y firmas deben estar explícitamente indicados en la UI de cada trámite, tanto para cliente externo como para usuarios de atención interna.
14. El módulo interno debe permitir agregar notas, observaciones, reasignaciones y seguimiento interno sobre trámites, quejas y convenios.
15. El sistema debe buscar ser un único punto de interfaz para el agente interno, evitando que deba abrir múltiples aplicaciones para atender un caso.
16. La gestión de tickets y quejas debe centralizarse en Agora; el nuevo sistema debe integrarse con Agora para crear y consultar tickets sin que el usuario interno tenga que cambiar de aplicación.
17. Desde el módulo interno se debe poder acceder y enviar información hacia Agora (por ejemplo, datos de trámites, estatus, notas) de manera transparente.
18. El acceso interno debe gestionarse mediante LDAP ligado a Microsoft, permitiendo alta y revocación rápida de cuentas internas.
19. La interfaz interna debe cambiar según permisos y roles, controlando visibilidad de información y acciones disponibles por perfil.
20. Deben definirse y aplicarse controles de seguridad e infraestructura que separen acceso interno y externo, manteniendo información crítica protegida.
21. El portal debe mostrar indicadores visibles del estatus del contrato (activo, limitado, cortado, con bloqueo jurídico, con adeudos, etc.).
22. En casos de bloqueo jurídico o adeudos relevantes, el sistema debe bloquear el acceso a ciertas funciones y mostrar advertencias específicas desde el login o al cambiar de contrato.
23. El usuario (externo e interno) debe poder conocer fácilmente el estado del servicio para evitar pagos indebidos o intentos de trámites erróneos.
24. El portal de cliente debe permitir la actualización de datos fiscales para facilitar una facturación correcta y evitar errores de timbrado.
25. Debe habilitarse la gestión de personas de contacto asociadas al contrato, relevantes para cobranza y seguimiento de deudas, incluso en contratos inactivos o en baja temporal.

---

## Supuestos / restricciones

26. El sistema debe prepararse para una integración futura con proveedores de firma digital compatibles con NOM 151, iniciando desde ahora el diseño técnico necesario.
27. Cada trámite debe tener definido el tipo de firma requerida (autógrafa, digital o ambas), y esta información debe mostrarse claramente al usuario.
28. El sistema debe soportar ambos flujos de firma (digital y presencial) para adaptarse a la legislación vigente y a posibles cambios regulatorios futuros.
29. La UI debe dirigir al usuario a la sección correcta para firmar digitalmente o proporcionar instrucciones claras para la firma presencial.
30. Se propone un único portal con módulos diferenciados para cliente externo y atención interna, manejado desde el mismo servidor con ruteo basado en roles.
31. La arquitectura debe equilibrar accesibilidad y protección, separando funciones críticas y asegurando que la información interna sensible no sea accesible desde el portal público.
32. Se debe evitar la duplicidad de herramientas comerciales (Hydra vs. Agora y otros sistemas), definiendo con claridad cuál será el sistema comercial principal.

Supuestos:

1. El portal de trámites digitales se construye principalmente para clientes de CEA, consumiendo información de CEA mediante APIs ya existentes.
2. Los convenios de pago serán configurables, pero los rangos finales de porcentaje de anticipo y número de meses deberán acordarse con negocio (se asume un rango típico de 6–12 meses).
3. Agora será el sistema central de gestión de tickets y quejas, por lo que el nuevo portal y el módulo interno no deben duplicar estas capacidades, sino integrarse con Agora.
4. Se asume la disponibilidad de infraestructura que permita separar claramente el acceso interno y externo, con controles de seguridad suficientes para proteger información sensible.
5. El acceso interno se basará en LDAP integrado con Microsoft, lo que permite alta/baja rápida de usuarios y control de permisos centralizado.
6. La estrategia de firma digital seguirá la NOM 151 y otras normativas aplicables, manteniendo en paralelo la opción de firma presencial donde la regulación aún no permita digitalización plena.

---

## Preguntas abiertas

1. ¿Cuál es el alcance legal y normativo definitivo de la digitalización y firma electrónica por tipo de trámite (qué puede ser totalmente digital, qué requiere firma autógrafa y bajo qué condiciones aplica NOM 151)?
2. ¿Cuáles serán los parámetros finales de convenios de pago (límites de meses, rangos permitidos de porcentaje de anticipo, manejo de excepciones y aprobaciones especiales)?
3. ¿Cómo se definirá con precisión el alcance funcional entre Ágora y el nuevo portal/módulo interno (qué funciones se quedan en Agora y cuáles migran o viven en el nuevo sistema) para evitar redundancias y determinar el sistema comercial principal?
4. ¿Cuáles serán los detalles técnicos de integración con LDAP y la arquitectura de servidores (topología, segmentación de redes, mecanismos de autenticación y autorización, alta disponibilidad, etc.)?
5. ¿Qué proveedor(es) de firma digital se seleccionará, con qué modelo de integración (API, SDK, servicio externo) y con qué alcances iniciales por tipo de trámite?
6. ¿Cuál será el catálogo definitivo de documentos digitalizables por trámite, incluyendo criterios de aceptación, formatos válidos y mecanismos de resguardo/trazabilidad para mantener validez legal?
7. ¿Cuál será la priorización de los siguientes módulos o flujos tras validar esta iteración (nuevos trámites, reportes, funcionalidades adicionales de convenios, etc.)?

---

## Posibles tareas

* Definir y configurar las reglas de negocio para automatizar órdenes de reconexión, incluyendo condiciones de disparo (pago total, cumplimiento de convenio) y manejo de excepciones.
* Diseñar la UI de indicadores de estado de contrato y candados de operación, incluyendo mensajes claros cuando existan adeudos o bloqueos jurídicos.
* Definir la estructura de convenios parametrizables (campos, rangos válidos, flujos de aprobación) y construir la checklist interna de validación documental.
* Definir y configurar la integración con Agora para creación y consulta de tickets desde el módulo interno, asegurando que el agente no deba cambiar de sistema.
* Diseñar el módulo interno de atención (pantallas, flujos, permisos) como punto único de interfaz para el agente.
* Aterrizar el diseño técnico de la integración de firma digital conforme a NOM 151, incluyendo mapeo de trámites por tipo de firma y flujos híbridos digital/presencial.
* Preparar y ejecutar una iteración del prototipo con los ajustes definidos y generar el video de demostración para revisión asíncrona.

---

## Decisiones / acuerdos principales

1. Se mantendrá una combinación de trámites digitales y atención presencial en la etapa inicial, especialmente donde existan restricciones legales.
2. El sistema soportará ambos tipos de firma (digital y presencial), activando la digital gradualmente conforme avance la normativa y la integración con proveedores.
3. La gestión de tickets y quejas se centralizará en Agora, y el nuevo portal/módulo interno deberá integrarse con dicho sistema en lugar de duplicar funcionalidades.
4. Se realizará una iteración rápida del prototipo con base en el feedback de esta sesión y se enviará un video con los cambios para revisión asíncrona antes de avanzar a nuevos módulos.
5. La experiencia del usuario interno debe ser unificada, evitando que atención al público use múltiples sistemas para gestionar el mismo caso.

---