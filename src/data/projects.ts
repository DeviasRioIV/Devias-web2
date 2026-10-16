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
}

// Qué bloque animado muestra cada proyecto. `type` es una clave del registro
// `caseStudies` en la página del proyecto; `props` son los textos por idioma
// (eyebrow, títulos, pasos…) que se pasan tal cual al componente y pisan sus
// defaults. Si falta un idioma, el componente usa sus textos por defecto.
// Es JSON puro, así que se puede guardar en una DB.
export type CaseStudyType = 'excel-to-system' | 'reef-check';

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

export const projects: Project[] = [
  {
    slug: 'bucked-up',
    name: 'Bucked Up',
    logo: '/logos/projects/buckedUp/buckedup_web.webp',
    caseStudy: { type: 'excel-to-system' },
    copy: {
      es: {
        industry: 'E-commerce',
        region: 'Estados Unidos',
        description: [
          'Bucked Up es una marca de suplementos deportivos que necesitaba que su operación digital acompañara el ritmo de su crecimiento.',
          'Ordenamos sus procesos y construimos los sistemas que les permiten decidir con datos en tiempo real.',
        ],
      },
      en: {
        industry: 'E-commerce',
        region: 'United States',
        description: [
          'Bucked Up is a sports supplements brand that needed its digital operation to keep pace with its growth.',
          'We organized its processes and built the systems that let them decide with real-time data.',
        ],
      },
    },
  },
  {
    slug: 'hexagon',
    name: 'Hexagon Multivista',
    logo: '/logos/projects/hexagon/hexagon_multivista.png',
    caseStudy: { type: 'excel-to-system' },
    copy: {
      es: {
        industry: 'BIM',
        region: 'Multinacional',
        description: [
          'Hexagon Multivista permite a los profesionales de la construcción, arquitectos, ingenieros y propietarios construir un mundo mejor mediante servicios de gestión del ciclo de vida de los activos —de principio a fin— basados ​​en datos.',
          'Hexagon Multivista ofrece la única cartera de servicios tecnológicos integral, sostenible y transparente que incluye documentación visual, creación de activos digitales, transformación BIM y análisis automatizado de la construcción, con el fin de aumentar el retorno de la inversión (ROI), optimizar los flujos de trabajo y mejorar la colaboración.',
        ],
      },
      en: {
        industry: 'BIM',
        region: 'Multinational',
        description: [
          'Hexagon Multivista enables construction professionals, architects, engineers and owners to build a better world through data-driven, end-to-end asset lifecycle management services.',
          'Hexagon Multivista offers the only comprehensive, sustainable and transparent portfolio of technology services, including visual documentation, digital asset creation, BIM transformation and automated construction analytics, in order to increase return on investment (ROI), optimize workflows and improve collaboration.',
        ],
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
      },
      en: {
        industry: 'Marine conservation',
        region: 'Global',
        description: [
          'Reef Check is an organization dedicated to coral reef conservation, with volunteers and scientists around the world.',
          'We built the systems that centralize their field data and let them sustain their operation at scale.',
        ],
      },
    },
  },
];

export const getProject = (slug: string | undefined) => projects.find((p) => p.slug === slug);
