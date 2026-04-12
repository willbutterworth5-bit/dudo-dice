import type { ReactNode } from 'react';

export function RulesContentEs() {
  return (
    <div className="space-y-6">
      <p className="text-white/70 text-base">Perudo (también conocido como dados mentirosos o dudo) es un juego de engaño con dados en el que el último jugador con dados restantes gana.</p>
      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">Victoria</h3>
        <p className="text-lg text-white/85">
          ¡El último jugador con dados restantes gana la partida!
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">Mecánica básica</h3>
        <ul className="list-disc list-outside space-y-2 text-lg pl-5 text-white/85">
          <li>Cada jugador empieza con 5 dados (ocultos para los demás)</li>
          <li>Los jugadores se turnan para hacer apuestas: "X dados mostrando el valor Y"</li>
          <li>Los unos (1s) son comodines y cuentan como cualquier valor (excepto en modo Palifico)</li>
          <li>Puedes subir la apuesta o desafiar la apuesta anterior</li>
          <li>Si se desafía, se revelan y cuentan todos los dados</li>
          <li>El perdedor de un desafío pierde un dado</li>
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">Reglas especiales para apostar con unos</h3>
        <ul className="list-disc list-outside space-y-2 text-lg pl-5 text-white/85">
          <li>
            <strong>Apostar con unos:</strong> Al apostar unos (valor de cara = 1), la cantidad debe ser más de la mitad de la apuesta actual — concretamente, al menos ⌊actual ÷ 2⌋ + 1.
            <br />
            <span className="text-white/60 italic">Ejemplos: "5 cuatros" → mínimo "3 unos" (parte entera de 2,5, +1); "4 cuatros" → mínimo "3 unos" (parte entera de 2, +1)</span>
          </li>
          <li>
            <strong>Volver a apostar desde unos:</strong> Al volver a apostar un valor no-uno (2–6), la cantidad debe duplicarse.
            <br />
            <span className="text-white/60 italic">Ejemplo: Si la apuesta actual es "3 unos", la siguiente apuesta debe ser al menos "6 doses" (el doble de 3)</span>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">Regla Palifico</h3>
        <p className="text-lg mb-2 text-white/85">
          Cuando un jugador comienza la ronda con <strong>un solo dado</strong> (cantidad = 1), se activa el modo Palifico:
        </p>
        <ul className="list-disc list-outside space-y-2 text-lg pl-5 text-white/85">
          <li>Todas las apuestas siguientes en esa ronda deben usar el mismo valor de cara que la apuesta inicial</li>
          <li>Los unos pierden su estado de comodín y <strong>NO se cuentan</strong> (solo cuentan las coincidencias exactas)</li>
          <li>El modo Palifico dura hasta que termina la ronda (cuando se produce un desafío)</li>
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">Regla Calza <span className="text-base font-normal text-white/50">(opcional)</span></h3>
        <p className="text-lg mb-2 text-white/85">
          En lugar de desafiar una apuesta con <strong>Dudo</strong>, un jugador puede llamar <strong>Calza</strong> — reclamando que el recuento exacto en la mesa coincide precisamente con la apuesta.
        </p>
        <ul className="list-disc list-outside space-y-2 text-lg pl-5 text-white/85">
          <li><strong>Si acierta</strong> (coincidencia exacta): el que llama recupera un dado, hasta la cantidad inicial</li>
          <li><strong>Si falla</strong>: el que llama pierde un dado como de costumbre</li>
          <li>Si el que llama es eliminado (pierde su último dado en un Calza fallido), el apostador empieza la siguiente ronda</li>
          <li>Calza puede llamarse en cualquier apuesta, incluso durante el modo Palifico</li>
        </ul>
      </section>
    </div>
  );
}

export function FaqContentEs() {
  const faqs: { q: string; a: ReactNode }[] = [
    {
      q: '¿Qué es el Perudo?',
      a: (
        <p>Perudo es el juego original de dados mentirosos sudamericano en el que se basa Dudo Dice. También se conoce como Dudo, Cacho o simplemente Dados mentirosos. El juego nació en los Andes y se popularizó mundialmente tras el lanzamiento del juego de mesa de Richard Borg en 1993.</p>
      ),
    },
    {
      q: '¿Qué significa "Dudo"?',
      a: (
        <p>Dudo significa <em>"lo dudo"</em> en español. Llamar Dudo desafía la apuesta del jugador anterior — se revelan y cuentan todos los dados. Si la apuesta era incorrecta, el apostador pierde un dado. Si era correcta, el que desafió pierde un dado.</p>
      ),
    },
    {
      q: '¿Cuáles son los niveles de dificultad?',
      a: (
        <>
          <p className="mb-2">Hay tres niveles de dificultad para la IA:</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li><strong>Fácil</strong> — La IA hace apuestas conservadoras y desafía con frecuencia. Ideal para aprender el juego.</li>
            <li><strong>Normal</strong> — Juego equilibrado. La IA hace faroles de vez en cuando y lee la mesa razonablemente bien.</li>
            <li><strong>Difícil</strong> — La IA lleva la cuenta de los dados, hace faroles estratégicamente y desafía con precisión. Ganar en Difícil consigue el logro <strong>Modo difícil</strong>.</li>
          </ul>
        </>
      ),
    },
    {
      q: '¿Cómo funciona el sistema de puntuación Elo?',
      a: (
        <>
          <p className="mb-2">El Elo es una puntuación competitiva para partidas multijugador en línea con 3 o más jugadores humanos. Refleja tu nivel de habilidad a lo largo del tiempo.</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li>Todos los jugadores comienzan en <strong>1500</strong>.</li>
            <li>Tras cada partida clasificatoria, la puntuación se ajusta según dónde terminaste y a quién superaste.</li>
            <li>Superar a un jugador con mayor puntuación te da más Elo; perder ante uno con menor puntuación te cuesta más.</li>
            <li>Las partidas con solo 2 jugadores humanos son siempre <strong>casuales</strong> — sin cambios de Elo.</li>
            <li>Los bots no afectan a los cálculos de Elo.</li>
            <li>Si te desconectas de una partida clasificatoria y no vuelves en 60 segundos, cuenta como una derrota en último lugar.</li>
            <li>Tu puntuación se marca como <strong>provisional</strong> durante las primeras 10 partidas clasificatorias mientras se estabiliza.</li>
          </ul>
        </>
      ),
    },
    {
      q: '¿Cómo funcionan los logros?',
      a: (
        <>
          <p className="mb-2">Los logros se consiguen alcanzando hitos específicos en partidas de un jugador o multijugador. Se guardan localmente en tu perfil.</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li><strong>Primera tirada</strong> — Juega tu primera partida</li>
            <li><strong>Primera victoria</strong> — Gana tu primera partida</li>
            <li><strong>¡Dudo!</strong> — Haz una llamada Dudo exitosa</li>
            <li><strong>Última resistencia</strong> — Gana una partida con 1 dado</li>
            <li><strong>Intocable</strong> — Gana sin perder ningún dado</li>
            <li><strong>¡Calza!</strong> — Haz una llamada Calza exitosa</li>
            <li><strong>Tirador de élite</strong> — 5 Dudos exitosos en una partida</li>
            <li><strong>Modo difícil</strong> — Gana en dificultad Difícil</li>
            <li><strong>En racha</strong> — Gana 3 partidas seguidas</li>
            <li><strong>Campeón</strong> — Gana 10 partidas</li>
            <li><strong>Maestro Dudo</strong> — Haz 25 llamadas Dudo exitosas</li>
            <li><strong>Veterano</strong> — Juega 50 partidas</li>
          </ul>
          <p className="mt-2 text-white/60 text-sm">Aparece una notificación cuando desbloqueas un nuevo logro.</p>
        </>
      ),
    },
    {
      q: '¿El 1 siempre es comodín?',
      a: (
        <>
          <p className="mb-2">Sí — en el juego normal, los 1s cuentan como cualquier valor de cara. Por ejemplo, si alguien apuesta "4 cincos", el recuento incluye todos los 5s <em>más</em> todos los 1s.</p>
          <p>La excepción es el <strong>modo Palifico</strong>: cuando un jugador con exactamente 1 dado empieza una ronda, los 1s pierden su estado de comodín durante toda esa ronda y solo cuentan como valor de cara 1.</p>
        </>
      ),
    },
    {
      q: '¿Puedo jugar sin conexión?',
      a: (
        <p>¡Sí! El modo de un jugador te permite jugar contra 1–5 oponentes de IA sin necesidad de internet una vez cargada la página. Tus estadísticas y logros se guardan localmente en tu navegador.</p>
      ),
    },
    {
      q: '¿Se guarda mi perfil?',
      a: (
        <>
          <p className="mb-2">Tu perfil (nombre, avatar, estadísticas, logros y puntuación Elo) se almacena en el almacenamiento local de tu navegador por defecto. Persiste entre sesiones, pero está vinculado a tu dispositivo y navegador — borrar los datos del navegador lo reiniciará.</p>
          <p>Para mantener tu perfil seguro y sincronizarlo entre dispositivos, crea una cuenta gratuita con tu correo electrónico. Pulsa <strong>Iniciar sesión / Crear cuenta</strong> en la pantalla de Perfil, regístrate con tu correo y confirma el enlace enviado a tu bandeja de entrada. Una vez iniciada la sesión, tu perfil se sincroniza automáticamente.</p>
        </>
      ),
    },
    {
      q: '¿Cómo me uno a la partida de un amigo?',
      a: (
        <>
          <p className="mb-2">El anfitrión de una sala privada puede compartir el código de sala de 4 letras. Tu amigo puede introducirlo en la pestaña <strong>Unirse a sala</strong> en la pantalla de Online, o visitar <code className="bg-white/10 px-1 rounded text-sm">dudodice.com/online/join/CÓDIGO</code>.</p>
          <p>Las salas públicas aparecen en la pestaña <strong>Explorar</strong> — cualquiera puede unirse directamente.</p>
        </>
      ),
    },
    {
      q: '¿Qué ocurre si abandono una partida antes de terminar?',
      a: (
        <>
          <p className="mb-2">Si te desconectas, empieza un temporizador de 60 segundos. Si vuelves a conectarte a tiempo, te reincorporas sin problemas. Si no:</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li>Una IA toma el control de tus dados y continúa jugando</li>
            <li>En una <strong>partida clasificatoria</strong>, tu puntuación recibe la penalización por último puesto</li>
            <li>En una <strong>partida casual</strong>, no se ve afectada ninguna puntuación</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {faqs.map(({ q, a }, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold text-lg mb-2">{q}</h3>
          <div className="text-white/80 text-base leading-relaxed">{a}</div>
        </div>
      ))}
    </div>
  );
}
