// Contenido de las páginas de proyecto. Cada proyecto tiene un slug (la URL),
// su logo y los textos por idioma. Los textos de Bucked Up y Reef Check son
// provisorios: reemplazalos por la descripción real del caso.
export const projectSlugs = ['bucked-up', 'hexagon', 'reef-check'] as const;
export type ProjectSlug = (typeof projectSlugs)[number];

type Lang = 'es' | 'en';

interface ProjectCopy {
  industry: string;
  region: string;
  description: string[];
  lastParagraph: string[];
}

// Qué bloque animado muestra cada proyecto. `type` es una clave del registro
// `caseStudies` en la página del proyecto; `props` son los textos por idioma
// (eyebrow, títulos, pasos…) que se pasan tal cual al componente y pisan sus
// defaults. Si falta un idioma, el componente usa sus textos por defecto.
// Es JSON puro, así que se puede guardar en una DB.
export type CaseStudyType = 'excel-to-system' | 'reef-check' | 'bucked-up';

interface CaseStudyConfig {
  type: CaseStudyType;
  props?: Partial<Record<Lang, Record<string, unknown>>>;
}

interface Project {
  slug: ProjectSlug;
  name: string;
  logo: string;
  caseStudy: CaseStudyConfig;
  copy: Record<Lang, ProjectCopy>;
}

// Textos en inglés del caso "De Excel a sistema". El español usa los defaults
// del componente, por eso solo hace falta declarar `en`.
const excelToSystemProps: CaseStudyConfig['props'] = {
  en: {
    eyebrow: 'Case · BIM Industry',
    titleNormal: 'From an Excel spreadsheet',
    titleBold: 'to a system that runs the whole operation.',
    steps: [
      {
        title: 'The spreadsheet',
        text: 'Everything lived in one Excel file: crossed versions, broken formulas and data only the person who entered it understood.',
      },
      {
        title: 'Formalized processes',
        text: 'We mapped every process, standardized it and turned it into a module with its own rules, owners and data.',
      },
      {
        title: 'Real-time decisions',
        text: 'Leadership decides with what is happening today, not with what was entered last month.',
      },
    ],
    mods: [
      { name: 'Projects', sub: 'Intake · Phases · Milestones', value: '14 active' },
      { name: 'Contracts', sub: 'Templates · Signing · Delivery', value: '8 sent today' },
      { name: 'Documentation', sub: 'Drawings · Versions · Deliverables', value: '126 drawings' },
      { name: 'Coordination', sub: 'Clashes · RFIs', value: '3 open RFIs' },
      { name: 'Resources', sub: 'Hours · Allocation', value: '312 h today' },
      { name: 'Billing', sub: 'Certifications · Payments', value: '$ 46.3 M' },
    ],
    cells: [
      { text: 'Project', kind: 'h' }, { text: 'Status', kind: 'h' }, { text: 'Hrs', kind: 'h' }, { text: 'Owner', kind: 'h' },
      { text: 'Tower A', kind: '' }, { text: '¿?', kind: 'y' }, { text: '120', kind: '' }, { text: 'JM', kind: '' },
      { text: 'Tower_A_v3_FINAL', kind: '' }, { text: 'ok', kind: '' }, { text: '#REF!', kind: 'e' }, { text: '—', kind: '' },
      { text: 'Ind. building', kind: '' }, { text: 'delayed', kind: 'y' }, { text: '=B4*1.2', kind: '' }, { text: 'MP / JM', kind: '' },
      { text: 'Rev 07', kind: '' }, { text: 'see email', kind: 'y' }, { text: '98', kind: '' }, { text: '', kind: '' },
      { text: 'Drawings.xls', kind: '' }, { text: '#N/A', kind: 'e' }, { text: '?', kind: '' }, { text: 'pending', kind: 'y' },
    ],
    fileLabels: ['processes_v7_FINAL(2).xlsx', 'system / modules', 'system / dashboard'],
    statusLabels: ['not synced', 'standardized processes', 'live'],
  },
};

export const projects: Project[] = [
  {
    slug: 'bucked-up',
    name: 'Bucked Up',
    logo: '/logos/projects/buckedUp/buckedup_web.webp',
    caseStudy: {
      type: 'bucked-up',
      // El inglés usa los defaults del componente; solo se declara el español.
      props: {
        es: {
          eyebrow: 'Caso · Nutrición deportiva / E-commerce',
          titleNormal: 'Empezamos con la tienda online.',
          titleBold: 'Hoy somos socios en todo el negocio.',
          steps: [
            {
              title: 'Empezamos por la tienda',
              text: 'Bucked Up estaba convirtiendo un sitio de contenido en una tienda online real. Entramos para construir lo que los clientes ven y compran, trabajando sobre los sistemas que ya tenían.',
            },
            {
              title: 'Proponer, no solo entregar',
              text: 'Nuestro rol creció junto con la marca. Construimos una app donde los embajadores acceden al contenido de la marca, aprenden a vender y gestionan sus ventas y cupones. Para el Bootcamp, el evento abierto de entrenamiento y nutrición que la marca realiza algunas veces al año, propusimos y llevamos adelante una reestructura y un rediseño completos.',
            },
            {
              title: 'De punta a punta, y parte de las decisiones',
              text: 'Hoy estamos presentes en el producto de punta a punta, desde lo que ven los clientes hasta los sistemas que lo sostienen. Llevamos mejoras de negocio a la mesa en lugar de esperar pedidos, construimos la app de compras móvil y ayudamos a crear los asistentes de IA que el equipo usa a diario.',
            },
          ],
          visual: {
            stages: [
              { file: 'buckedup.com', status: 'solo la tienda' },
              { file: 'ecosistema / nuevos productos', status: 'un rol que crece' },
              { file: 'ecosistema / hoy', status: 'de punta a punta' },
            ],
            tags: ['sitio de contenido', 'tienda online', 'tienda online'],
            tiles: [
              { num: '02', name: 'App de embajadores', sub: 'Contenido · Capacitación · Ventas · Cupones' },
              { num: '03', name: 'Bootcamp', sub: 'Reestructura y rediseño que propusimos' },
              { num: '04', name: 'Asistentes de IA', sub: 'Usados por todo el equipo' },
              { num: '05', name: 'App de compras', sub: 'Comprá desde el celular' },
            ],
            scopeLabel: 'Nuestro rol',
            scopeSegments: ['Lo que ven los clientes', 'Propuestas de negocio', 'Sistemas detrás'],
            feedLabel: 'ECOSISTEMA · EN VIVO',
            events: [
              'Pedido realizado · tienda online',
              'Cupón canjeado · app de embajadores',
              'Pedido realizado · app de compras',
              'Módulo de capacitación completado · app de embajadores',
              'Tarea de asistente completada · equipo',
              'Inscripción abierta · Bootcamp',
            ],
            ariaLabel: 'Animación: un sitio de contenido se convierte en tienda online, crecen nuevos productos a su alrededor y el rol de Devias pasa de la tienda a las propuestas de negocio y los sistemas detrás.',
          },
        },
      },
    },
    copy: {
      es: {
        industry: 'E-commerce',
        region: 'Estados Unidos',
        description: [
          'Bucked Up es una marca de nutrición de alto rendimiento y estilo de vida fundada en Utah en 2016 por los hermanos gemelos Ryan y Jeff Gardner. Sus suplementos, bebidas energéticas, indumentaria y accesorios se venden en grandes cadenas de Estados Unidos, como Walmart, Amazon, GNC y Vitamin Shoppe. En 2024 la marca anunció su distribución en más de 30 países, con tiendas online dedicadas para Canadá, México, Australia y el Reino Unido.',
        ],
        lastParagraph: [
          'Lo que empezó como la construcción de la tienda online se convirtió en una alianza que abarca todo el negocio.',
          'Hoy nuestro trabajo define cómo Bucked Up apoya a sus embajadores, organiza su evento Bootcamp, llega a sus clientes en el celular y pone la IA a trabajar para su equipo. A medida que la marca sigue creciendo, crecemos con ella y proponemos lo que viene en lugar de esperar a que nos lo pidan.',
        ]
      },
      en: {
        industry: 'E-commerce',
        region: 'United States',
        description: [
          'Bucked Up is a performance nutrition and lifestyle brand founded in Utah in 2016 by twin brothers Ryan and Jeff Gardner. Its supplements, energy drinks, apparel and accessories are sold through major U.S. retailers, including Walmart, Amazon, GNC and Vitamin Shoppe. In 2024 the brand announced distribution in more than 30 countries, with dedicated online stores for Canada, Mexico, Australia and the United Kingdom.',
        ],
        lastParagraph: [
          'What began as building the storefront has grown into a partnership across the whole business.',
          'Today our work shapes how Bucked Up supports its ambassadors, runs its Bootcamp event, reaches customers on mobile and puts AI to work for its team. As the brand keeps growing, we keep growing with it, proposing what comes next instead of waiting to be asked.',
        ]
      },
    },
  },
  {
    slug: 'hexagon',
    name: 'Hexagon Multivista',
    logo: '/logos/projects/hexagon/hexagon_multivista.png',
    caseStudy: { type: 'excel-to-system', props: excelToSystemProps },
    copy: {
      es: {
        industry: 'BIM',
        region: 'Multinacional',
        description: [
          'Hexagon Multivista permite a los profesionales de la construcción, arquitectos, ingenieros y propietarios construir un mundo mejor mediante servicios de gestión del ciclo de vida de los activos —de principio a fin— basados ​​en datos.',
          'Hexagon Multivista ofrece la única cartera de servicios tecnológicos integral, sostenible y transparente que incluye documentación visual, creación de activos digitales, transformación BIM y análisis automatizado de la construcción, con el fin de aumentar el retorno de la inversión (ROI), optimizar los flujos de trabajo y mejorar la colaboración.',
        ],
        lastParagraph: []
      },
      en: {
        industry: 'BIM',
        region: 'Multinational',
        description: [
          'Hexagon Multivista enables construction professionals, architects, engineers and owners to build a better world through data-driven, end-to-end asset lifecycle management services.',
          'Hexagon Multivista offers the only comprehensive, sustainable and transparent portfolio of technology services, including visual documentation, digital asset creation, BIM transformation and automated construction analytics, in order to increase return on investment (ROI), optimize workflows and improve collaboration.',
        ],
        lastParagraph: []
      },
    },
  },
  {
    slug: 'reef-check',
    name: 'Reef Check',
    logo: '/logos/projects/reefCheck/reefCheck.png',
    caseStudy: {
      type: 'reef-check',
      props: {
        en: {
          eyebrow: 'Case · Environmental Nonprofit',
          titleNormal: 'From scattered field notes',
          titleBold: 'to reef data the world can use.',
          steps: [
            {
              title: 'Distributed collection',
              text: 'Trained divers survey reefs in 102 countries and territories. That data is only valuable if it is captured consistently and stays traceable.',
            },
            {
              title: 'A platform for survey data',
              text: 'We helped build a platform to collect, manage and administer survey data, designed around Reef Check’s real monitoring process.',
            },
            {
              title: 'Part of a larger mission',
              text: 'Field observations become structured information for reports and global statistics that help understand and protect reef ecosystems.',
            },
          ],
        },
        es: {
          eyebrow: 'Caso · ONG ambiental',
          titleNormal: 'De notas de campo dispersas',
          titleBold: 'a datos de arrecifes que el mundo puede usar.',
          steps: [
            {
              title: 'Recolección distribuida',
              text: 'Buzos entrenados relevan arrecifes en 102 países y territorios. Esos datos solo tienen valor si se capturan de forma consistente y se mantienen trazables.',
            },
            {
              title: 'Una plataforma para los datos de relevamiento',
              text: 'Ayudamos a construir una plataforma para recolectar, gestionar y administrar los datos de los relevamientos, diseñada en torno al proceso real de monitoreo de Reef Check.',
            },
            {
              title: 'Parte de una misión más grande',
              text: 'Las observaciones de campo se convierten en información estructurada para informes y estadísticas globales que ayudan a comprender y proteger los ecosistemas de arrecifes.',
            },
          ],
        },
      },
    },
    copy: {
      es: {
        industry: 'Conservación marina',
        region: 'Global',
        description: [
          'Reef Check es una organización dedicada a la conservación de los arrecifes de coral, con voluntarios y científicos en todo el mundo.',
          'Construimos los sistemas que centralizan sus datos de campo y les permiten sostener su operación a escala.',
        ],
        "lastParagraph": [
          'Desde observaciones de campo individuales hasta datos confiables que respaldan la conservación global de los arrecifes. Devias ayudó a construir la plataforma que recopila, gestiona y administra los datos de los relevamientos de Reef Check. La tecnología adecuada convierte el trabajo de miles de buzos en información que el mundo puede usar y permite que las personas que realizan el trabajo se concentren en lo que importa.'
        ],
      },
      en: {
        industry: 'Marine conservation',
        region: 'Global',
        description: [
          'Reef Check is an organization dedicated to coral reef conservation, with volunteers and scientists around the world.',
          'We built the systems that centralize their field data and let them sustain their operation at scale.',
        ],
        "lastParagraph": [
          'From individual field observations to reliable data supporting global reef conservation. Devias helped build the platform that collects, manages and administers Reef Check’s survey data. The right technology turns the work of thousands of divers into information the world can use, and lets the people doing the work focus on what matters.'
        ],
      },
    },
  },
];

export const getProject = (slug: string | undefined) => projects.find((p) => p.slug === slug);
