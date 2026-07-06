// ============================================================================
// Demo dataset — fictional-but-realistic sovereignty assessments
// ----------------------------------------------------------------------------
// POC data. Answers are indicative and NOT official assessments of the real
// companies. Each `answers` array lists the selected scoring level (0/1/2) for
// every question of the referenced schema, in theme + question order.
// Sovereignty scores are computed at runtime from these levels (see scoring.js).
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
    structural: {
      answers: [0, 0, 0, 0, 1, 0, 1],
      comment: "US-incorporated hyperscaler with global governance anchored outside the EU. Directly subject to the Cloud Act and FISA. A European Sovereign Cloud initiative is announced but not yet independently qualified. Strong operational security, weak structural sovereignty."
    },
    products: [
      {
        name: "Amazon EC2 & S3",
        type: "Cloud",
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
    structural: {
      answers: [0, 0, 0, 1, 1, 0, 1],
      comment: "US-headquartered vendor exposed to extraterritorial law. The EU Data Boundary and contractual commitments to challenge government requests improve the posture, but ownership, governance and IP remain outside the EU."
    },
    products: [
      {
        name: "Microsoft Azure",
        type: "Cloud",
        answers: [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        comment: "EU Data Boundary constrains data location, but metadata flows and non-EU key custody persist. Cloud Act exposure via the US parent is the primary structural weakness."
      },
      {
        name: "Microsoft 365",
        type: "SaaS",
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
    structural: {
      answers: [2, 2, 2, 2, 1, 1, 2],
      comment: "French provider (Iliad group), fully EU-owned and governed, with no exposure to extraterritorial law. R&D in France and strong open-source posture. Independent sovereignty qualification still in progress."
    },
    products: [
      {
        name: "Scaleway Elements",
        type: "Cloud",
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
    structural: {
      answers: [2, 1, 2, 2, 2, 2, 2],
      comment: "French-controlled provider that designs and manufactures its own servers. SecNumCloud-qualified offerings and R&D in the EU. Publicly listed, with a minority of non-French institutional shareholders."
    },
    products: [
      {
        name: "OVHcloud Public Cloud",
        type: "Cloud",
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
    structural: {
      answers: [0, 0, 0, 0, 1, 1, 1],
      comment: "US venture-backed data and AI platform. Origins in the open-source Apache Spark project give some technological openness, but ownership, governance and jurisdiction are firmly non-EU."
    },
    products: [
      {
        name: "Databricks Data Intelligence Platform",
        type: "SaaS",
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
    structural: {
      answers: [2, 1, 2, 1, 2, 2, 1],
      comment: "European software champion headquartered in Germany, with EU governance and substantial EU R&D. Global footprint and reliance on US hyperscalers for some cloud delivery create partial extraterritorial exposure."
    },
    products: [
      {
        name: "SAP S/4HANA Cloud",
        type: "SaaS",
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
    structural: {
      answers: [1, 2, 2, 1, 1, 1, 1],
      comment: "French-owned and Paris-headquartered consultancy with EU governance. A large global delivery network (including significant offshore capacity) and widespread use of US tooling temper the sovereignty posture."
    },
    products: [
      {
        name: "Digital Transformation Services",
        type: "Agency",
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
    structural: {
      answers: [1, 0, 1, 0, 1, 0, 1],
      comment: "Incorporated in Ireland but effectively US-managed and NYSE-listed, with a very large non-EU delivery workforce. Registered EU office does not offset non-EU control and extraterritorial exposure."
    },
    products: [
      {
        name: "Technology Consulting",
        type: "Agency",
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
    structural: {
      answers: [2, 2, 2, 2, 2, 2, 1],
      comment: "French national champion in high-performance computing and digital security. EU ownership and governance, ANSSI-recognised sovereignty credentials, and in-house design of sovereign supercomputers. A benchmark for structural sovereignty."
    },
    products: [
      {
        name: "BullSequana XH3000",
        type: "Hosting",
        answers: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2],
        comment: "Sovereign supercomputer designed and manufactured in France, with EU-owned IP, sovereign key management and an audited European supply chain. SBOM discipline still being extended across all sub-components."
      },
      {
        name: "Trusted AI Platform",
        type: "SaaS",
        answers: [2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 1],
        comment: "EU-hosted AI platform with European IP and strong data-control guarantees. Independent component-level audit and long-term reversibility attestation are the main areas still being reinforced."
      }
    ]
  }

];
