import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  onClose: () => void;
}

function PrivacyContentEn() {
  return (
    <div className="space-y-4 text-sm text-white/80 leading-relaxed">
      <p className="text-white/50 text-xs">Last updated: April 2026</p>

      <section>
        <h3 className="font-bold text-white mb-1">Who we are</h3>
        <p>
          Dudo Dice is an online Perudo (Liar's Dice) game. This policy explains what personal data we
          collect, why we collect it, and your rights under the UK GDPR and EU GDPR.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">What data we collect and why</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><span className="text-white font-medium">Email address</span> — to identify your account and send password-reset emails. Legal basis: contract.</li>
          <li><span className="text-white font-medium">Display name and country</span> — to personalise your profile. Legal basis: contract.</li>
          <li><span className="text-white font-medium">Date of birth</span> — to verify you are 13 or older (required to use the service). Not shown publicly. Legal basis: legal obligation / legitimate interest.</li>
          <li><span className="text-white font-medium">Game statistics and achievements</span> — to track your progress and display your profile. Legal basis: contract.</li>
          <li><span className="text-white font-medium">Elo rating</span> — to match you with similarly-skilled opponents in ranked play. Legal basis: contract.</li>
          <li><span className="text-white font-medium">Profile photo</span> — stored locally in your browser and optionally synced to your account to display on your profile. Legal basis: contract. You can remove it at any time from the Profile screen.</li>
          <li><span className="text-white font-medium">IP address</span> — processed transiently by our server when you connect to online games. Not stored persistently. Legal basis: legitimate interest (preventing abuse).</li>
          <li><span className="text-white font-medium">Feedback messages</span> — to respond to bug reports and suggestions. Legal basis: legitimate interest. Providing your email is optional.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Guest play</h3>
        <p>
          If you play without an account, game data is stored only in your browser's localStorage. We do
          not receive or process this data. It is deleted when you clear your browser data.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Third-party processors</h3>
        <p>
          We use <span className="text-white font-medium">Supabase</span> (EU region) to store account and game data, <span className="text-white font-medium">Google OAuth</span> to enable sign-in with Google, and <span className="text-white font-medium">Google Analytics</span> for website measurement.
          These providers act as processors or independent service providers depending on the feature used. We do not sell your data to any third party.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Data retention</h3>
        <p>
          Account data is retained for as long as your account is active. If you request deletion, we will
          erase your personal data within 30 days. Game statistics may be retained in anonymised,
          aggregated form for analytics after deletion.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Your rights</h3>
        <p>Under UK/EU GDPR you have the right to:</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request erasure of your data ("right to be forgotten")</li>
          <li>Restrict or object to processing</li>
          <li>Data portability (receive your data in a machine-readable format)</li>
          <li>Withdraw consent at any time (where processing is based on consent)</li>
        </ul>
        <p className="mt-1">
          You can exercise these rights directly in the app: use <span className="text-white font-medium">Export my data</span> on your profile page to download a copy of your data, and <span className="text-white font-medium">Delete account</span> to permanently erase your account. For other requests, use the feedback form. We will respond within 30 days.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Cookies</h3>
        <p>
          The app uses localStorage for session and profile data. We do not use advertising cookies. If you
          choose <span className="text-white font-medium">Essential only</span>, Google Analytics is limited to
          cookieless measurement with analytics storage denied. If you choose <span className="text-white font-medium">Accept all</span>,
          Google Analytics may also use analytics cookies for fuller measurement of visits and navigation.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Contact</h3>
        <p>
          For privacy questions, data requests, or complaints, use the feedback form in the app. You also
          have the right to lodge a complaint with your national supervisory authority (e.g. the ICO in the UK).
        </p>
      </section>
    </div>
  );
}

function PrivacyContentEs() {
  return (
    <div className="space-y-4 text-sm text-white/80 leading-relaxed">
      <p className="text-white/50 text-xs">Última actualización: abril de 2026</p>

      <section>
        <h3 className="font-bold text-white mb-1">Quiénes somos</h3>
        <p>
          Dudo Dice es un juego de Perudo (dados mentirosos) en línea. Esta política explica qué datos personales
          recopilamos, por qué los recopilamos y tus derechos en virtud del UK GDPR y el EU GDPR.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Qué datos recopilamos y por qué</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><span className="text-white font-medium">Dirección de correo electrónico</span> — para identificar tu cuenta y enviar correos de restablecimiento de contraseña. Base legal: contrato.</li>
          <li><span className="text-white font-medium">Nombre de usuario y país</span> — para personalizar tu perfil. Base legal: contrato.</li>
          <li><span className="text-white font-medium">Fecha de nacimiento</span> — para verificar que tienes 13 años o más (requisito para usar el servicio). No se muestra públicamente. Base legal: obligación legal / interés legítimo.</li>
          <li><span className="text-white font-medium">Estadísticas de partidas y logros</span> — para registrar tu progreso y mostrar tu perfil. Base legal: contrato.</li>
          <li><span className="text-white font-medium">Puntuación Elo</span> — para emparejarte con rivales de nivel similar en partidas clasificatorias. Base legal: contrato.</li>
          <li><span className="text-white font-medium">Foto de perfil</span> — almacenada localmente en tu navegador y sincronizada opcionalmente con tu cuenta para mostrarla en tu perfil. Base legal: contrato. Puedes eliminarla en cualquier momento desde la pantalla de Perfil.</li>
          <li><span className="text-white font-medium">Dirección IP</span> — procesada de forma transitoria por nuestro servidor cuando te conectas a partidas en línea. No se almacena de forma persistente. Base legal: interés legítimo (prevención de abusos).</li>
          <li><span className="text-white font-medium">Mensajes de comentarios</span> — para responder a informes de errores y sugerencias. Base legal: interés legítimo. Proporcionar tu correo es opcional.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Juego como invitado</h3>
        <p>
          Si juegas sin cuenta, los datos de la partida se almacenan únicamente en el localStorage de tu navegador.
          No recibimos ni procesamos estos datos. Se eliminan cuando borras los datos del navegador.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Proveedores externos</h3>
        <p>
          Utilizamos <span className="text-white font-medium">Supabase</span> (región UE) para almacenar datos de cuentas y partidas, <span className="text-white font-medium">Google OAuth</span> para habilitar el inicio de sesión con Google, y <span className="text-white font-medium">Google Analytics</span> para medir el uso del sitio web.
          Estos proveedores actúan como encargados del tratamiento o prestadores de servicios independientes según la funcionalidad. No vendemos tus datos a terceros.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Conservación de datos</h3>
        <p>
          Los datos de la cuenta se conservan mientras esta esté activa. Si solicitas la eliminación, borraremos
          tus datos personales en un plazo de 30 días. Las estadísticas de partidas podrán conservarse de forma
          anonimizada y agregada con fines analíticos tras la eliminación.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Tus derechos</h3>
        <p>En virtud del UK/EU GDPR tienes derecho a:</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Acceder a los datos personales que conservamos sobre ti</li>
          <li>Corregir datos inexactos</li>
          <li>Solicitar la eliminación de tus datos («derecho al olvido»)</li>
          <li>Restringir u oponerte al tratamiento</li>
          <li>Portabilidad de datos (recibir tus datos en un formato legible por máquina)</li>
          <li>Retirar el consentimiento en cualquier momento (cuando el tratamiento se base en el consentimiento)</li>
        </ul>
        <p className="mt-1">
          Puedes ejercer estos derechos directamente en la aplicación: usa <span className="text-white font-medium">Exportar mis datos</span> en tu página de perfil para descargar una copia de tus datos, y <span className="text-white font-medium">Eliminar cuenta</span> para borrar tu cuenta de forma permanente. Para otras solicitudes, usa el formulario de comentarios. Responderemos en un plazo de 30 días.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Cookies</h3>
        <p>
          La aplicación utiliza localStorage para datos de sesión y perfil. No usamos cookies publicitarias. Si eliges
          <span className="text-white font-medium"> Solo esenciales</span>, Google Analytics se limita a
          medición sin cookies con el almacenamiento de análisis desactivado. Si eliges <span className="text-white font-medium">Aceptar todo</span>,
          Google Analytics también podrá usar cookies analíticas para una medición más completa de visitas y navegación.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-white mb-1">Contacto</h3>
        <p>
          Para preguntas sobre privacidad, solicitudes de datos o reclamaciones, usa el formulario de comentarios de la aplicación. También
          tienes derecho a presentar una reclamación ante tu autoridad supervisora nacional (p. ej., la AEPD en España).
        </p>
      </section>
    </div>
  );
}

export default function PrivacyPolicyModal({ onClose }: Props) {
  const { t, language } = useLanguage();

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/20 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">{t('landing.privacyPolicy')}</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl leading-none px-1"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-indigo px-5 py-4">
          {language === 'es' ? <PrivacyContentEs /> : <PrivacyContentEn />}
        </div>
      </div>
    </div>
  );
}
