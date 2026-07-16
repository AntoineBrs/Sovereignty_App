// ============================================================================
// Demo dataset — fictional-but-realistic sovereignty assessments
// ----------------------------------------------------------------------------
// POC data. Answers are indicative and NOT official assessments of the real
// companies. Each `answers` array lists the selected scoring level (0/1/2) for
// every question of the referenced schema, in theme + question order.
// Sovereignty scores are computed at runtime from these levels (see scoring.js).
//
// `description` = neutral, anonymised summary of the activity (what the company
// or product does) — no sovereignty judgement. `comment` = the sovereignty
// commentary, shown only in the assessment sections.
// ============================================================================

const COMPANIES = [

  {
    id: "aws",
    name: "Amazon Web Services",
    initials: "AWS",
    color: "#232F3E",
    country: "United States",
    countryCode: "US",
    hq: "Seattle, WA",
    sector: "Cloud infrastructure & hyperscaler",
    description: "A global-scale provider of on-demand cloud infrastructure — compute, storage and networking — serving businesses and public organisations worldwide through a very broad catalogue of managed services.",
    structural: {
      answers: [0, 0, 0, 0, 1, 0, 1],
      comment: "US-incorporated hyperscaler with global governance anchored outside the EU. Directly subject to the Cloud Act and FISA. A European Sovereign Cloud initiative is announced but not yet independently qualified. Strong operational security, weak structural sovereignty."
    },
    products: [
      {
        name: "Amazon EC2 & S3",
        type: "Cloud",
        description: "Elastic virtual servers and object storage that let teams run applications and store data on demand, scaling capacity up or down as workloads change.",
        answers: [0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        comment: "EU regions available, but the parent company's exposure to extraterritorial law remains the dominant risk. Follow-the-sun support and non-EU key management limit data control. Mature security and reversibility tooling."
      }
    ]
  },

  {
    id: "microsoft",
    name: "Microsoft",
    initials: "MS",
    color: "#5B5B5B",
    country: "United States",
    countryCode: "US",
    hq: "Redmond, WA",
    sector: "Cloud & enterprise software",
    description: "A large technology group offering cloud platforms, productivity software and enterprise applications used across most industries, from individual users to multinational organisations.",
    structural: {
      answers: [0, 0, 0, 1, 1, 0, 1],
      comment: "US-headquartered vendor exposed to extraterritorial law. The EU Data Boundary and contractual commitments to challenge government requests improve the posture, but ownership, governance and IP remain outside the EU."
    },
    products: [
      {
        name: "Microsoft Azure",
        type: "Cloud",
        description: "A public cloud platform providing virtual machines, storage, databases and managed services for building and running applications at scale.",
        answers: [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        comment: "EU Data Boundary constrains data location, but metadata flows and non-EU key custody persist. Cloud Act exposure via the US parent is the primary structural weakness."
      },
      {
        name: "Microsoft 365",
        type: "SaaS",
        description: "A cloud productivity suite bundling email, document editing, storage and collaboration tools accessed through the browser or desktop apps.",
        answers: [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        comment: "Productivity suite with EU hosting options and strong compliance certifications, but telemetry, sub-processors and IP ownership keep the offering under US jurisdiction."
      }
    ]
  },

  {
    id: "scaleway",
    name: "Scaleway",
    initials: "SW",
    color: "#521E8A",
    country: "France",
    countryCode: "FR",
    hq: "Paris",
    sector: "European cloud provider",
    description: "A European cloud provider offering compute, storage and managed services aimed at developers and businesses that want infrastructure operated within the EU.",
    structural: {
      answers: [2, 2, 2, 2, 1, 1, 2],
      comment: "French provider (Iliad group), fully EU-owned and governed, with no exposure to extraterritorial law. R&D in France and strong open-source posture. Independent sovereignty qualification still in progress."
    },
    products: [
      {
        name: "Scaleway Elements",
        type: "Cloud",
        description: "A cloud platform offering virtual instances, storage and managed services, with infrastructure operated in European data centres.",
        answers: [2, 2, 2, 1, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 2],
        comment: "EU-law contract, data hosted exclusively in France, client-controlled keys and open export formats. Residual dependency on non-EU silicon; documentation of the software supply chain still maturing."
      }
    ]
  },

  {
    id: "ovhcloud",
    name: "OVHcloud",
    initials: "OVH",
    color: "#123F6D",
    country: "France",
    countryCode: "FR",
    hq: "Roubaix",
    sector: "European cloud provider",
    description: "A European cloud and hosting company that designs its own data centres and servers, providing public cloud, private cloud and bare-metal infrastructure to businesses across Europe.",
    structural: {
      answers: [2, 1, 2, 2, 2, 2, 2],
      comment: "French-controlled provider that designs and manufactures its own servers. SecNumCloud-qualified offerings and R&D in the EU. Publicly listed, with a minority of non-French institutional shareholders."
    },
    products: [
      {
        name: "OVHcloud Public Cloud",
        type: "Cloud",
        description: "An on-demand public cloud offering virtual instances, storage and networking billed by usage, running on European-operated infrastructure.",
        answers: [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        comment: "EU-law contract, sovereign key management and audited European supply chain. Full data control with open reversibility; permanent-deletion attestation still being formalised for some services."
      }
    ]
  },

  {
    id: "databricks",
    name: "Databricks",
    initials: "DB",
    color: "#C0392B",
    country: "United States",
    countryCode: "US",
    hq: "San Francisco, CA",
    sector: "Data & AI platform",
    description: "A data and artificial-intelligence platform that lets organisations store, process and analyse large volumes of data and build machine-learning and analytics applications on top of it.",
    structural: {
      answers: [0, 0, 0, 0, 1, 1, 1],
      comment: "US venture-backed data and AI platform. Origins in the open-source Apache Spark project give some technological openness, but ownership, governance and jurisdiction are firmly non-EU."
    },
    products: [
      {
        name: "Databricks Data Intelligence Platform",
        type: "Software",
        description: "A unified analytics platform that brings together data engineering, data warehousing and machine learning so teams can turn raw data into models and insights.",
        answers: [0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        comment: "Runs on top of US hyperscalers, inheriting their extraterritorial exposure. EU deployment regions and an open-source lineage help, but sub-processors and support access remain outside the EU."
      }
    ]
  },

  {
    id: "sap",
    name: "SAP",
    initials: "SAP",
    color: "#1874B4",
    country: "Germany",
    countryCode: "DE",
    hq: "Walldorf",
    sector: "Enterprise software",
    description: "A vendor of enterprise management software — including ERP, finance, supply-chain and human-resources applications — used by large organisations to run their core business processes.",
    structural: {
      answers: [2, 1, 2, 1, 2, 2, 1],
      comment: "European software champion headquartered in Germany, with EU governance and substantial EU R&D. Global footprint and reliance on US hyperscalers for some cloud delivery create partial extraterritorial exposure."
    },
    products: [
      {
        name: "SAP S/4HANA Cloud",
        type: "SaaS",
        description: "A cloud enterprise-resource-planning suite covering finance, procurement, manufacturing and supply-chain processes for large organisations.",
        answers: [2, 1, 1, 1, 2, 1, 2, 2, 1, 2, 2, 1, 1, 1],
        comment: "EU-anchored ERP with strong European IP, but part of the cloud delivery relies on non-EU hyperscalers, introducing residual jurisdictional and sub-processor exposure."
      }
    ]
  },

  {
    id: "capgemini",
    name: "Capgemini",
    initials: "CAP",
    color: "#0070AD",
    country: "France",
    countryCode: "FR",
    hq: "Paris",
    sector: "IT services & consulting",
    description: "An IT services and consulting firm that helps organisations design, build and operate digital systems, from strategy and software development to system integration and managed services.",
    structural: {
      answers: [1, 2, 2, 1, 1, 1, 1],
      comment: "French-owned and Paris-headquartered consultancy with EU governance. A large global delivery network (including significant offshore capacity) and widespread use of US tooling temper the sovereignty posture."
    },
    products: [
      {
        name: "Digital Transformation Services",
        type: "Agency",
        description: "Consulting and delivery engagements that help organisations modernise their applications, migrate to the cloud and redesign their digital processes.",
        answers: [2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1],
        comment: "EU-law engagements with clear IP transfer to the client. Offshore delivery and a partly non-EU tooling stack mean some engagement data can be accessed from outside the EU."
      }
    ]
  },

  {
    id: "accenture",
    name: "Accenture",
    initials: "ACN",
    color: "#6A1B9A",
    country: "Ireland",
    countryCode: "IE",
    hq: "Dublin",
    sector: "IT services & consulting",
    description: "A global professional-services company providing technology consulting, systems integration and outsourcing to help large organisations transform and run their operations.",
    structural: {
      answers: [1, 0, 1, 0, 1, 0, 1],
      comment: "Incorporated in Ireland but effectively US-managed and NYSE-listed, with a very large non-EU delivery workforce. Registered EU office does not offset non-EU control and extraterritorial exposure."
    },
    products: [
      {
        name: "Technology Consulting",
        type: "Agency",
        description: "Advisory and implementation services covering technology strategy, system design and large-scale integration programmes.",
        answers: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        comment: "Standard EU contracting is available, but global delivery, US-headquartered management and a predominantly non-EU tooling stack keep engagement data within reach of foreign jurisdictions."
      }
    ]
  },

  {
    id: "eviden",
    name: "Eviden — Bull Sequana AI",
    initials: "EVI",
    color: "#2D2A6E",
    country: "France",
    countryCode: "FR",
    hq: "Les Clayes-sous-Bois",
    sector: "Sovereign HPC, AI & digital security",
    description: "A European specialist in high-performance computing, artificial intelligence and digital security, designing supercomputers and trusted platforms for demanding scientific, industrial and public-sector uses.",
    structural: {
      answers: [2, 2, 2, 2, 2, 2, 1],
      comment: "French national champion in high-performance computing and digital security. EU ownership and governance, ANSSI-recognised sovereignty credentials, and in-house design of sovereign supercomputers. A benchmark for structural sovereignty."
    },
    products: [
      {
        name: "BullSequana XH3000",
        type: "Hosting",
        description: "A high-performance computing system designed and built for intensive scientific and industrial workloads, deployed on-premise or in sovereign data centres.",
        answers: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2],
        comment: "Sovereign supercomputer designed and manufactured in France, with EU-owned IP, sovereign key management and an audited European supply chain. SBOM discipline still being extended across all sub-components."
      },
      {
        name: "Trusted AI Platform",
        type: "Software",
        description: "A platform for developing and running artificial-intelligence workloads with an emphasis on data protection and controlled, auditable operation.",
        answers: [2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 1],
        comment: "EU-hosted AI platform with European IP and strong data-control guarantees. Independent component-level audit and long-term reversibility attestation are the main areas still being reinforced."
      }
    ]
  },

  {
    id: "coupa",
    name: "Coupa Software",
    initials: "CPA",
    color: "#E85D04",
    country: "United States",
    countryCode: "US",
    hq: "San Mateo, CA",
    sector: "Procurement & spend management software",
    description: "A cloud platform for business spend management, helping organisations run sourcing, procurement, invoicing and supplier processes from a single system.",
    structural: {
      answers: [0, 0, 0, 0, 0, 0, 1],
      comment: "US-incorporated and majority-owned by a US private-equity firm since 2023, with governance and R&D anchored outside the EU. Directly exposed to the Cloud Act with no contractual mitigation. Minimal open-source governance offers the only partial counterweight."
    },
    products: [
      {
        name: "Coupa Procurement Intelligence",
        type: "SaaS",
        description: "An AI-augmented procurement module that aggregates public market and supplier data, recommends alternative suppliers and tracks price-evolution trends to support sourcing and purchasing decisions.",
        answers: [0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0],
        comment: "Business-spend-management platform whose community-intelligence features rely on cross-customer data aggregation, explicitly permitted under the ToS. Some EU hosting and export options exist, but support, IP and sub-processor governance remain firmly US-centred."
      }
    ]
  },

  {
    id: "ivalua",
    name: "Ivalua",
    initials: "IVA",
    color: "#2E6F95",
    country: "France",
    countryCode: "FR",
    hq: "Paris",
    sector: "Procurement & spend management software",
    description: "A source-to-pay platform covering sourcing, supplier management, contract and invoice processing for large organisations running global procurement operations.",
    structural: {
      answers: [0, 1, 1, 1, 1, 1, 1],
      comment: "French-founded source-to-pay specialist that has progressively re-centred around a US co-headquarters and non-EU institutional investors, tipping the majority of its revenue outside the EU. EU governance and R&D presence remain significant, keeping the profile mixed rather than fully offshore."
    },
    products: [
      {
        name: "Ivalua Smart Procurement Analytics",
        type: "SaaS",
        description: "A source-to-pay module that uses AI to aggregate public supplier and market data, surface alternative-supplier recommendations and monitor price-evolution trends across purchasing categories.",
        answers: [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1],
        comment: "Source-to-pay suite offering an EU-hosting option and enterprise-grade export and breach-notification commitments, but sub-processor coverage, dependency audits and support are only partially EU-anchored — consistent with the group's dual-centre governance."
      }
    ]
  },

  {
    id: "esker",
    name: "Esker",
    initials: "ESK",
    color: "#0E7C61",
    country: "France",
    countryCode: "FR",
    hq: "Lyon",
    sector: "AI-powered procurement & finance automation",
    description: "A European software publisher providing AI-driven automation for procurement, accounts payable and order management processes, used by finance and purchasing teams to streamline supplier interactions.",
    structural: {
      answers: [2, 2, 2, 1, 1, 2, 1],
      comment: "Euronext-listed, Lyon-headquartered publisher with French management, board and R&D. A long-standing US subsidiary serving Americas customers introduces limited extraterritorial exposure, the main item still weighing on an otherwise strong sovereignty profile."
    },
    products: [
      {
        name: "Esker Procure-to-Pay AI Assistant",
        type: "SaaS",
        description: "An AI assistant integrated into a procurement and accounts-payable automation suite, aggregating public supplier and market data, suggesting alternative suppliers and generating price-evolution dashboards to support purchasing teams.",
        answers: [2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1],
        comment: "AI-driven procurement and AP automation product built on EU-hosted infrastructure with sovereign key handling, exhaustive sub-processor disclosure and full audit rights. Residual exposure comes from the US subsidiary serving non-EU customers and a dependency-audit process still being formalised."
      }
    ]
  }

];
