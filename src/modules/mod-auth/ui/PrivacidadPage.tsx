"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/shared/ui/icons/ArrowLeftIcon";

/**
 * `/privacidad`: Política de privacidad y protección de datos personales.
 * Basada en docs/conversacion/privacidad.md (§5 Contenido mínimo propuesto, Ley N.° 29733, SPEC-05 y SPEC-23).
 */
export function PrivacidadPage() {
  const router = useRouter();

  const handleVolver = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="wf-phone flex flex-col h-screen max-h-[880px] bg-surface-cloud">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border-inverse bg-surface-ink text-text-inverse sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Volver"
            onClick={handleVolver}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse text-lg leading-none hover:bg-surface-ink cursor-pointer"
          >
            <ArrowLeftIcon size={20} />
          </button>
        </div>
        <p className="font-heading uppercase tracking-[0.08em] text-[16px]">POLÍTICA DE PRIVACIDAD</p>
        <div className="w-10" />
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4 text-text-primary text-[13px] leading-relaxed">
        {/* Aviso de proyecto académico y verificación legal */}
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3.5 text-amber-900 text-[12px] flex flex-col gap-1 shadow-xs">
          <p className="font-bold uppercase tracking-wide text-[11px]">Aviso del proyecto académico</p>
          <p>
            Este documento refleja el diseño del canal conversacional de Inka Athletics conforme a la Ley N.° 29733 y las especificaciones del sistema. No constituye asesoría legal definitiva y está sujeto a validación legal antes de entrar a producción. Los puntos institucionales aún no formalizados se señalan expresamente como <span className="font-semibold italic">pendiente de definición</span>.
          </p>
        </div>

        {/* 1. Responsable del tratamiento */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            1. Responsable del Tratamiento
          </h2>
          <ul className="text-text-secondary list-disc pl-4 space-y-1">
            <li><strong>Denominación:</strong> Inka Athletics (identificador institucional de tienda: <em>pendiente de definición</em>).</li>
            <li><strong>Domicilio legal:</strong> Lima, Perú (<em>pendiente de definición</em>).</li>
            <li><strong>Canal de contacto para privacidad:</strong> Correo y buzón formal de privacidad (<em>pendiente de definición por la tienda</em>).</li>
          </ul>
        </section>

        {/* 2. Datos que se tratan */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            2. Datos Personales que se Tratan
          </h2>
          <p className="text-text-secondary">
            Conforme al inventario de datos del canal, se tratan únicamente los datos indispensables para la atención y compra:
          </p>
          <ul className="text-text-secondary list-disc pl-4 space-y-1">
            <li><strong>Conversaciones del chat:</strong> Mensajes de texto (con redacción automática de contraseñas, OTP y tarjetas), resumen de conversación y vector de búsqueda.</li>
            <li><strong>Identidad y contacto:</strong> Nombre de pila (único dato de identidad enviado al asistente con IA), correo electrónico y celular verificado (ambos enmascarados en la interfaz del chat).</li>
            <li><strong>Datos de checkout y entrega:</strong> Tipo y número de documento de identidad enmascarado, nombre del destinatario y dirección de entrega.</li>
            <li><strong>Imágenes adjuntas:</strong> Fotografías enviadas en el chat, procesadas en bucket privado sin metadatos EXIF ni ubicación geográfica.</li>
            <li><strong>Datos excluidos:</strong> El chatbot <em>nunca</em> almacena contraseñas, códigos OTP ni numeración completa de tarjetas bancarias (PAN, CVV o vencimiento); el pago se procesa directamente en formularios seguros.</li>
          </ul>
        </section>

        {/* 3. Finalidades del tratamiento */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            3. Finalidades del Tratamiento
          </h2>
          <ul className="text-text-secondary list-disc pl-4 space-y-1">
            <li>Atender consultas sobre el catálogo deportivo y facilitar la compra asistida por chat.</li>
            <li>Gestionar el carrito de compras, el flujo de pago y la emisión de pedidos.</li>
            <li>Enviar notificaciones y correos transaccionales de confirmación de compra y estado del despacho.</li>
            <li>Gestionar solicitudes de postventa, cambios, devoluciones y registro de reclamos.</li>
            <li>Medir la calidad del servicio mediante métricas técnicas agregadas y disociadas (sin datos personales).</li>
          </ul>
        </section>

        {/* 4. Destinatarios de los datos */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            4. Destinatarios de los Datos
          </h2>
          <p className="text-text-secondary">
            Los datos son comunicados únicamente a los siguientes componentes estrictamente necesarios:
          </p>
          <ul className="text-text-secondary list-disc pl-4 space-y-1">
            <li><strong>Módulos internos del Marketplace:</strong> Seguridad y Usuarios (autenticación), Productos y Ofertas (catálogo), Ventas y Postventa (pedidos y reclamos) y Despacho y Entrega (envíos).</li>
            <li><strong>Proveedor de IA (LLM):</strong> Procesamiento conversacional de los turnos de chat.</li>
            <li><strong>Proveedor de correo (SMTP):</strong> Envío de correos transaccionales de confirmación.</li>
            <li><strong>Proveedor de almacenamiento (Supabase Storage):</strong> Custodia en bucket privado de imágenes adjuntas normalizadas.</li>
          </ul>
        </section>

        {/* 5. Transferencia internacional y retención del proveedor LLM */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            5. Transferencia Internacional de Datos
          </h2>
          <p className="text-text-secondary">
            El procesamiento del asistente virtual con IA involucra un flujo transfronterizo de datos personales hacia servidores ubicados fuera del Perú operados por el proveedor del modelo de lenguaje (OpenAI). El proveedor conserva las entradas de la API (incluidas las imágenes en base64) durante 30 días exclusivamente para monitoreo de seguridad y detección de abusos, conforme a sus términos vigentes, sin utilizarlas para entrenar modelos.
          </p>
        </section>

        {/* 6. Uso de Inteligencia Artificial */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            6. Uso de Inteligencia Artificial y Reglas de Protección
          </h2>
          <p className="text-text-secondary">
            Las respuestas del chat son generadas dinámicamente por un asistente con inteligencia artificial, mientras que precios, disponibilidad, promociones y estados de pedido provienen de los servicios oficiales de la tienda.
          </p>
          <ul className="text-text-secondary list-disc pl-4 space-y-1">
            <li><strong>Qué se envía al LLM:</strong> Prompt del sistema, nombre de pila del cliente, últimos 12 mensajes del chat (redactados) e imágenes adjuntas del turno.</li>
            <li><strong>Qué nunca se envía al LLM:</strong> Correo electrónico, teléfono celular, documento de identidad, dirección completa, contraseñas ni datos bancarios.</li>
          </ul>
        </section>

        {/* 7. Plazos de conservación */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            7. Conservación de Datos
          </h2>
          <ul className="text-text-secondary list-disc pl-4 space-y-1">
            <li><strong>Conversaciones anónimas:</strong> Expiran y se eliminan a los 7 días de inactividad.</li>
            <li><strong>Conversaciones autenticadas:</strong> Se archivan a los 90 días de inactividad.</li>
            <li><strong>Imágenes adjuntas pendientes:</strong> Se eliminan automáticamente tras 24 horas si no son enviadas.</li>
            <li><strong>Borradores de postventa:</strong> Se conservan por 24 horas en caso de reintento.</li>
            <li><strong>Plazos de borrado definitivo de registros de compra:</strong> <em>Pendiente de definición</em> en el modelo de datos maestro.</li>
          </ul>
        </section>

        {/* 8. Derechos del titular (ARCO) */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            8. Derechos del Titular (ARCO)
          </h2>
          <p className="text-text-secondary">
            El titular puede ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) conforme a la Ley N.° 29733, así como acudir ante la Autoridad Nacional de Protección de Datos Personales.
          </p>
          <p className="text-text-secondary">
            <strong>Atención de solicitudes:</strong> Por razones de seguridad y verificación fehaciente de identidad, los derechos ARCO no se tramitan a través de los mensajes del chat. El canal institucional, correo específico y procedimiento se encuentran <em>pendientes de definición</em> por el área legal de la tienda.
          </p>
        </section>

        {/* 9. Banco de datos personales */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            9. Banco de Datos Personales
          </h2>
          <p className="text-text-secondary">
            El registro e inscripción del banco de datos personales correspondiente ante la Dirección de Registro Nacional de Protección de Datos Personales se encuentra <em>pendiente de definición</em> y verificación previa al despliegue operativo.
          </p>
        </section>

        {/* 10. Almacenamiento en el navegador */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            10. Almacenamiento en el Navegador (Cookies y LocalStorage)
          </h2>
          <ul className="text-text-secondary list-disc pl-4 space-y-1">
            <li><strong>LocalStorage:</strong> Almacena el token de acceso de sesión de corta duración y la confirmación de aceptación del aviso de imágenes adjuntas en el dispositivo.</li>
            <li><strong>Cookies técnicas:</strong> Cookie <code>chat_sid</code> para identificar la sesión de chat anónima sin datos personales, y cookie <code>httpOnly</code> para la rotación segura del refresh token.</li>
          </ul>
        </section>

        {/* 11. Consecuencias de no proporcionar datos */}
        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            11. Consecuencia de no Proporcionar los Datos
          </h2>
          <p className="text-text-secondary">
            La consulta del catálogo de productos y el armado del carrito en el chat no requieren registro ni datos personales. No obstante, para confirmar pedidos, procesar el pago y realizar la entrega a domicilio es obligatorio registrar una cuenta, contar con celular verificado mediante OTP e ingresar documento de identidad y dirección de entrega.
          </p>
        </section>

        <div className="pt-2 pb-4">
          <button
            type="button"
            onClick={handleVolver}
            className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink hover:bg-action-primary-hover active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            VOLVER
          </button>
        </div>
      </main>
    </div>
  );
}
