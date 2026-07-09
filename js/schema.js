// ============================================================================
// Sovereignty questionnaires — schema definitions
// ----------------------------------------------------------------------------
// Each questionnaire is organised into THEMES. Each theme holds QUESTIONS.
// Each question has three scoring LEVELS (0 = non-sovereign ... 2 = sovereign).
// Company answers (see data.js) reference these questions by their position.
// Sovereignty scores are derived at runtime from the selected levels.
// ============================================================================

const SCHEMAS = {

  // --------------------------------------------------------------------------
  // STRUCTURAL questionnaire — assesses the company as a whole
  // --------------------------------------------------------------------------
  structural: {
    key: "structural",
    label: "Structural Sovereignty",
    themes: [
      {
        name: "European Footprint",
        questions: [
          {
            q: "What is the share of EU / non-EU revenue for your organisation?",
            guidance: "Assess where the company's economic value is generated.",
            levels: [
              "Revenue predominantly generated outside the EU (> 50%).",
              "Majority of revenue generated in the EU (> 50%).",
              "More than 80% of annual revenue generated within the EU / EEA."
            ]
          },
          {
            q: "Is the company majority-owned by EU entities? Do any non-EU minority shareholders hold veto rights or equivalent control mechanisms?",
            guidance: "Look beyond headline ownership at effective control and debt structure.",
            levels: [
              "EU/EEA entities hold <50% of capital or voting rights, or non-EU investors exercise effective control.",
              "EU/EEA entities hold 50 to 89% of capital and voting rights, with no non-EU majority control, but possible minority veto rights, strategic debt, or special governance right",
              "EU/EEA entities hold ≥90% of capital and voting rights, and no non-EU shareholder holds veto rights, negative control, board control, or equivalent influence. Debt is not subject to non-EU control rights"
            ]
          },
          {
            q: "Where are the ultimate governance and decision-making bodies legally and physically anchored?",
            guidance: "Identify where strategic decisions are effectively taken.",
            levels: [
              "Registered office or operational management outside the EU, or decisions taken by foreign actors.",
              "Headquarters in the EU but effective strategic management by a foreign parent company.",
              "Registered office, C-suite and Board located and fiscally resident in the EU."
            ]
          }
        ]
      },
      {
        name: "Independence from Extraterritorial Law",
        questions: [
          {
            q: "What is your exposure to extraterritorial laws such as the US Cloud Act or the Chinese Cyber Law, and what contractual protections are in place?",
            guidance: "Assess legal exposure enabling a foreign authority to compel data disclosure.",
            levels: [
              "Direct or indirect subjection to a foreign jurisdiction (US / China) with no protective measures.",
              "Exposure to extraterritorial laws, but contractual protections are in place.",
              "No direct or indirect exposure; contractual commitment that no foreign law can compel disclosure."
            ]
          },
          {
            q: "Do you hold certifications or internal frameworks related to resilience and sovereignty of your offers?",
            guidance: "Distinguish self-declared posture from independently verified assurance.",
            levels: [
              "No sovereignty audit; data managed without external control.",
              "Internal self-assessment carried out, but no verification by an independent third party.",
              "Proof of a sovereignty audit or qualification by a national authority (e.g. ANSSI) or a European body."
            ]
          }
        ]
      },
      {
        name: "Research & Open Source",
        questions: [
          {
            q: "Where is R&D conducted and who owns the underlying technology and intellectual property?",
            guidance: "Trace ownership of the core technology and the location of R&D.",
            levels: [
              "R&D and IP controlled by a non-EU parent company.",
              "Partially conducted in the EU, or IP held in a mix of offshore structures with dependency on non-EU proprietary components without guaranteed control.",
              "IP wholly owned by EU entities with a documented chain of ownership, and R&D primarily conducted in the EU."
            ]
          },
          {
            q: "What is your reliance on open-source versus proprietary components, and how are third-party technology dependencies audited and managed?",
            guidance: "Evaluate governance over the technology supply chain.",
            levels: [
              "Full dependency on non-EU proprietary components without governance.",
              "Mix of open-source and proprietary components with partial governance.",
              "Non-EU proprietary dependencies documented with qualified EU alternatives identified; active governance of open-source components in production."
            ]
          }
        ]
      }
    ]
  },

  // --------------------------------------------------------------------------
  // PRODUCT questionnaire — Hosting & Cloud (16 questions)
  // --------------------------------------------------------------------------
  hosting_cloud: {
    key: "hosting_cloud",
    label: "Hosting & Cloud",
    themes: [
      {
        name: "Legal Framework & Compliance",
        questions: [
          {
            q: "Is the provider governed by European legislation regardless of where the hosting is located? Are disputes handled by European courts?",
            guidance: "Identify the law governing the contract and the competent court, regardless of server location.",
            levels: [
              "Contract governed by the law of a non-EU country. Disputes subject to a non-EU jurisdiction.",
              "A Member State's law is mentioned, but reserve clauses allow switching to another jurisdiction in case of conflict.",
              "Contract governed exclusively by the law of an EU Member State. Competent jurisdiction within the EU, with no referral clause."
            ]
          },
          {
            q: "Does the provider guarantee that no government or authority can access data, particularly under extraterritorial laws such as the Cloud Act or FISA?",
            guidance: "Assess whether a foreign authority could legally compel access without going through European courts.",
            levels: [
              "Provider or parent company subject to extraterritorial laws (Cloud Act, FISA). No protective clause.",
              "Structural exposure to extraterritorial laws, but contractual clauses to challenge requests and notify the client.",
              "No exposure to extraterritorial laws. Responses only to European judicial orders."
            ]
          }
        ]
      },
      {
        name: "Data Location & Control",
        questions: [
          {
            q: "Are all data, including backups, metadata and logs, hosted in European data centres?",
            guidance: "Verify that all data, including copies and technical traces, never leaves European territory.",
            levels: [
              "Primary data or backups hosted outside the EU, with no contractual geographic restriction.",
              "Production data in Europe, but technical logs or metadata replicated outside the EU.",
              "100% of the processing chain hosted exclusively in the EU / EEA, contractually guaranteed and verifiable by audit."
            ]
          },
          {
            q: "Does the provider guarantee that data is not used for commercial purposes, AI training or analysis?",
            guidance: "Ensure that data entrusted to the provider is not used for any purpose other than hosting.",
            levels: [
              "The ToS explicitly authorise use of data to improve services, train AI models or produce analyses.",
              "No commercial resale, but use for AI training or metadata analysis is not explicitly excluded by the contract.",
              "Formal, explicit and contractually enforceable prohibition on any use of data for commercial, AI or analytical purposes."
            ]
          },
          {
            q: "Are the technical teams (e.g. support) who have access to data located in Europe?",
            guidance: "Identify whether persons subject to foreign legislation can access the data.",
            levels: [
              "Support operated follow-the-sun from non-EU countries, with direct access to client environments.",
              "Advanced technical team with full data access in the EU, but first-level support with limited data access outside the EU.",
              "All levels of support and maintenance provided exclusively by teams located in the EU."
            ]
          }
        ]
      },
      {
        name: "Security & Encryption",
        questions: [
          {
            q: "Is data always encrypted, and can the company hold the encryption keys?",
            guidance: "Verify who holds the keys to decrypt the data: the provider or the client.",
            levels: [
              "Data is encrypted, but keys are fully managed by the provider. The client has no control over the keys.",
              "Data is encrypted. BYOK option available, but keys are managed by a KMS subject to extraterritorial laws.",
              "Data is encrypted. BYOK with a sovereign KMS partner, or HYOK; the client has full control over their keys."
            ]
          },
          {
            q: "Does the provider notify the company within 72 hours of a data breach or access incident?",
            guidance: "Ensure prompt, direct notification in the event of unauthorised access.",
            levels: [
              "No contractual obligation to notify within a defined timeframe.",
              "Notification provided for contractually, but without a guaranteed timeframe or precise level of detail.",
              "Formal notification guaranteed within 72 hours, with a structured report of nature, data concerned, impact and measures."
            ]
          },
          {
            q: "Are critical hardware components (servers, processors, network cards) developed in cyber-risk countries?",
            guidance: "Assess whether hardware may originate from countries able to introduce hidden surveillance devices.",
            levels: [
              "Critical components designed or manufactured in high-risk countries, with no audit or traceability policy.",
              "Components from recognised manufacturers assembled in sensitive areas. Partial integrity checks upon receipt.",
              "Critical components designed and manufactured in countries linked to the EU by security agreements. Supply chain audited annually."
            ]
          }
        ]
      },
      {
        name: "Technological Independence",
        questions: [
          {
            q: "Is the provider itself dependent on non-European suppliers?",
            guidance: "Verify whether the provider relies on non-European actors to operate its service.",
            levels: [
              "Infrastructure relies entirely or predominantly on non-European hyperscalers with no mitigation plan.",
              "Non-European dependencies exist on non-critical components, or are identified with a reduction plan.",
              "All critical infrastructure components rely on qualified European suppliers."
            ]
          },
          {
            q: "How are third-party technological dependencies managed and audited?",
            guidance: "Assess how the provider controls and qualifies third-party components.",
            levels: [
              "No dependency management policy. Third-party components integrated without risk assessment.",
              "A policy exists but dependencies are not systematically assessed for origin or extraterritorial exposure.",
              "All critical dependencies are European or open source with no extraterritorial exposure. Others are non-critical and documented."
            ]
          },
          {
            q: "Are intellectual property and R&D European?",
            guidance: "Verify that code and technology belong to European entities and cannot be controlled from abroad.",
            levels: [
              "IP held by a non-European entity. R&D outside the EU. The European subsidiary is a mere reseller.",
              "Part of the IP is European, but critical components remain under foreign licence or ownership.",
              "All IP held by European entities. R&D exclusively in the EU. Critical components open source or European-owned."
            ]
          }
        ]
      },
      {
        name: "Transparency & Audit",
        questions: [
          {
            q: "Does the provider maintain an SBOM, attested via certification or independent third-party audit?",
            guidance: "Ensure the provider knows precisely all software components in its solution.",
            levels: [
              "No SBOM exists, or the provider cannot attest to its existence.",
              "An SBOM exists but is incomplete or not regularly updated. No independent audit of completeness.",
              "A complete SBOM updated at every release, its completeness attested by a specialised independent audit."
            ]
          },
          {
            q: "Can the company request an independent audit of the provider's data management and processes?",
            guidance: "Verify that data-management commitments can be independently checked.",
            levels: [
              "No contractual audit rights. Provider only shares its own certifications.",
              "Audit rights provided for but limited: questionnaires, document reviews or remote access only.",
              "Full audit rights: physical access to data centres, review of logs, processes and code, by any certified auditor."
            ]
          },
          {
            q: "Does the provider notify the company before any significant service change impacting its sovereignty?",
            guidance: "Ensure the client is informed before any change that may affect data sovereignty.",
            levels: [
              "No obligation to notify changes. The client discovers them after implementation.",
              "Notifies certain sovereignty-impacting changes (e.g. sub-processor) but not all.",
              "Contractually commits to notifying any sovereignty-impacting change with sufficient advance notice."
            ]
          }
        ]
      },
      {
        name: "Reversibility & Exit",
        questions: [
          {
            q: "Can the company exit and recover its data easily without financial or time penalties, with a transition period of at least 30 days?",
            guidance: "Verify that the client can recover data and switch provider without constraints.",
            levels: [
              "Export impossible, costly, in a proprietary format, or data deleted less than 15 days after termination.",
              "Export in standard formats possible, but transition period under 30 days or reversibility not tested.",
              "Free export in open formats (JSON, CSV, XML). Transition period of at least 30 days in read-only mode."
            ]
          },
          {
            q: "Can the company request the permanent and certified deletion of its data at any time?",
            guidance: "Ensure total and verifiable destruction of data can be required at any time.",
            levels: [
              "No contractual deletion obligation. Data may be retained indefinitely after the contract.",
              "Deletion possible on request, but incomplete (backups, logs, metadata) or without written attestation.",
              "Comprehensive deletion contractually guaranteed within a defined timeframe, with written attestation of method."
            ]
          }
        ]
      }
    ]
  },

  // --------------------------------------------------------------------------
  // PRODUCT questionnaire — SaaS & Software (14 questions)
  // --------------------------------------------------------------------------
  saas_software: {
    key: "saas_software",
    label: "SaaS & Software",
    themes: [
      {
        name: "Legal Framework & Compliance",
        questions: [
          {
            q: "Is the provider governed by European legislation regardless of where the product / service is located? Are disputes handled by European courts?",
            guidance: "Identify the governing law and competent court regardless of where the product is operated.",
            levels: [
              "Contract governed by the law of a non-EU country. Disputes subject to a non-EU jurisdiction.",
              "A Member State's law is mentioned, but reserve clauses allow switching jurisdiction in case of conflict.",
              "Contract governed exclusively by EU Member State law. Competent jurisdiction within the EU, no referral clause."
            ]
          },
          {
            q: "Does the provider guarantee that no government or authority can access data, particularly under extraterritorial laws such as the Cloud Act or FISA?",
            guidance: "Assess whether a foreign authority could legally compel access without European courts.",
            levels: [
              "Provider or parent company subject to extraterritorial laws (Cloud Act, FISA). No protective clause.",
              "Structural exposure to extraterritorial laws, but contractual clauses to challenge requests and notify the client.",
              "No exposure to extraterritorial laws. Responses only to European judicial orders."
            ]
          },
          {
            q: "Is all data entered in the product hosted on infrastructure subject to European legislation?",
            guidance: "Verify that data processed by the software is stored on EU-governed infrastructure, even if the publisher is not itself a host.",
            levels: [
              "Data processed or stored on non-EU infrastructure, with no contractual guarantee of European location.",
              "Production data hosted in Europe, but some flows (analytics, logs, telemetry) transit through non-EU servers.",
              "All data hosted on infrastructure exclusively located in the EU, contractually guaranteed and verifiable by audit."
            ]
          }
        ]
      },
      {
        name: "Data Location & Control",
        questions: [
          {
            q: "Are the technical teams (e.g. support) who have access to data located in Europe?",
            guidance: "Identify whether persons subject to foreign legislation can access the data.",
            levels: [
              "Support operated follow-the-sun from non-EU countries, with direct access to client environments.",
              "Advanced technical team with full data access in the EU, but first-level support outside the EU.",
              "All levels of support and maintenance provided exclusively by teams located in the EU."
            ]
          },
          {
            q: "Does the provider guarantee that data is not used for commercial purposes, AI training or analysis?",
            guidance: "Ensure that data is not used for any purpose other than delivering the service.",
            levels: [
              "The ToS explicitly authorise use of data to improve services, train AI models or produce analyses.",
              "No commercial resale, but use for AI training or metadata analysis is not explicitly excluded.",
              "Formal, explicit and contractually enforceable prohibition on any use of data for commercial, AI or analytical purposes."
            ]
          },
          {
            q: "Are the provider's potential sub-processors / tools identified and subject to European legislation?",
            guidance: "Ensure third-party components (analytics, support, emailing, AI tools) are known, documented and EU-governed.",
            levels: [
              "No list of sub-processors available. Third-party tools integrated without informing the client.",
              "List available but incomplete. Some sub-processors subject to extraterritorial laws access technical or aggregated data.",
              "Exhaustive, up-to-date list available contractually. Any sub-processor accessing sensitive data is EU-governed."
            ]
          }
        ]
      },
      {
        name: "Security",
        questions: [
          {
            q: "Does the provider notify the company within 72 hours of a data breach or access incident?",
            guidance: "Ensure prompt, direct notification in the event of unauthorised access.",
            levels: [
              "No contractual obligation to notify within a defined timeframe.",
              "Notification provided for contractually, but without a guaranteed timeframe or precise level of detail.",
              "Formal notification guaranteed within 72 hours, with a structured report of nature, data, impact and measures."
            ]
          }
        ]
      },
      {
        name: "Technological Independence",
        questions: [
          {
            q: "Are intellectual property and R&D European?",
            guidance: "Verify that code and technology belong to European entities and cannot be controlled from abroad.",
            levels: [
              "IP held by a non-European entity. R&D outside the EU. The European subsidiary is a mere reseller.",
              "Part of the IP is European, but critical components remain under foreign licence or ownership.",
              "All IP held by European entities. R&D exclusively in the EU. Critical components open source or European-owned."
            ]
          },
          {
            q: "How are the product's third-party technological dependencies managed and audited?",
            guidance: "Assess how the provider controls and qualifies third-party components.",
            levels: [
              "No dependency management policy. Third-party components integrated without risk assessment.",
              "A policy exists but dependencies are not systematically assessed for origin or extraterritorial exposure.",
              "All critical dependencies are European or open source with no extraterritorial exposure. Others documented."
            ]
          }
        ]
      },
      {
        name: "Transparency & Audit",
        questions: [
          {
            q: "Does the provider maintain a complete, regularly updated list of software components with an existence certificate accessible for audit?",
            guidance: "Ensure the provider knows precisely all software components in its solution.",
            levels: [
              "No list of software components exists, or the provider cannot attest to its existence.",
              "A list exists but is incomplete or not regularly updated. No independent audit of completeness.",
              "A complete list updated at every release, its completeness attested by a specialised independent audit."
            ]
          },
          {
            q: "Can the company request an independent audit of the provider's data management and processes?",
            guidance: "Verify that data-management commitments can be independently checked.",
            levels: [
              "No contractual audit rights. Provider only shares its own certifications.",
              "Audit rights limited: questionnaires and document reviews only. No access to source code or logs.",
              "Full audit rights: review of logs, data-processing procedures and source code, by any certified auditor."
            ]
          },
          {
            q: "Does the provider notify the company before any significant service change impacting its sovereignty?",
            guidance: "Ensure the client is informed before any change that may affect data sovereignty.",
            levels: [
              "No obligation to notify changes. The client discovers them after implementation.",
              "Notifies certain sovereignty-impacting changes (e.g. sub-processor) but not all.",
              "Contractually commits to notifying any sovereignty-impacting change with sufficient advance notice."
            ]
          }
        ]
      },
      {
        name: "Reversibility & Exit",
        questions: [
          {
            q: "Can the company exit and recover its data easily without financial or time penalties, with a transition period of at least 30 days?",
            guidance: "Verify that the client can recover data and switch provider without constraints.",
            levels: [
              "Export impossible, costly, in a proprietary format, or data deleted less than 15 days after termination.",
              "Export in standard formats possible, but transition period under 30 days or reversibility not tested.",
              "Free export in open formats (JSON, CSV, XML). Transition period of at least 30 days in read-only mode."
            ]
          },
          {
            q: "Can the company request the permanent and certified deletion of its data at any time?",
            guidance: "Ensure total and verifiable destruction of data can be required at any time.",
            levels: [
              "No contractual deletion obligation. Data may be retained indefinitely after the contract.",
              "Deletion possible on request, but incomplete (backups, logs, metadata) or without written attestation.",
              "Comprehensive deletion contractually guaranteed within a defined timeframe, with written attestation of method."
            ]
          }
        ]
      }
    ]
  },

  // --------------------------------------------------------------------------
  // PRODUCT questionnaire — Agency & Service (12 questions)
  // --------------------------------------------------------------------------
  agency_service: {
    key: "agency_service",
    label: "Agency & Service",
    themes: [
      {
        name: "Legal Framework & Compliance",
        questions: [
          {
            q: "Is the provider governed by European legislation regardless of where the product / service is located? Are disputes handled by European courts?",
            guidance: "Identify the governing law and competent court for the engagement.",
            levels: [
              "Contract governed by the law of a non-EU country. Disputes subject to a non-EU jurisdiction.",
              "A Member State's law is mentioned, but reserve clauses allow switching jurisdiction in case of conflict.",
              "Contract governed exclusively by EU Member State law. Competent jurisdiction within the EU, no referral clause."
            ]
          },
          {
            q: "Are the provider's potential sub-processors identified and subject to European legislation?",
            guidance: "Ensure the agency identifies all partners and sub-processors and verifies their EU compliance.",
            levels: [
              "No list of sub-processors available. Partners used without informing the client or verifying compliance.",
              "Partial list exists but incomplete, or some sub-processors subject to extraterritorial laws without mitigation.",
              "Exhaustive list shared before the engagement. All domiciled in the EU and bound by GDPR-compliant commitments."
            ]
          },
          {
            q: "Does the provider guarantee that no government or authority can access data, particularly under extraterritorial laws such as the Cloud Act or FISA?",
            guidance: "Assess whether a foreign authority could legally compel access without European courts.",
            levels: [
              "Provider or parent company subject to extraterritorial laws (Cloud Act, FISA). No protective clause.",
              "Structural exposure to extraterritorial laws, but contractual clauses to challenge requests and notify the client.",
              "No exposure to extraterritorial laws. Responses only to European judicial orders."
            ]
          }
        ]
      },
      {
        name: "Data Location & Control",
        questions: [
          {
            q: "Is the company's data processed using tools subject to European legislation?",
            guidance: "Verify that entrusted data (briefs, documents, client data) is not processed in non-EU-governed tools.",
            levels: [
              "Client data processed in predominantly non-European tools with no contractual framework or minimisation.",
              "Some non-European tools used for non-critical tasks, with commitments to minimise or pseudonymise data.",
              "All tools used to process client data are EU-governed. The list is contractually shared and kept up to date."
            ]
          },
          {
            q: "Does the provider guarantee that data is not used for commercial purposes, AI training or analysis?",
            guidance: "Ensure that data is not used for any purpose other than carrying out the engagement.",
            levels: [
              "The contract explicitly authorises the agency to reuse produced content or transmitted data.",
              "No resale to third parties, but internal reuse (knowledge base, benchmarks, AI training) is not prohibited.",
              "Formal, explicit and contractually enforceable prohibition on any use of data for commercial or internal purposes."
            ]
          },
          {
            q: "Are the teams (e.g. consultants) who have access to data located in Europe?",
            guidance: "Identify whether persons on the engagement are subject to foreign legislation.",
            levels: [
              "Part of the project team located outside the EU, with access to the engagement's data and documents.",
              "Core team in Europe, but occasional contributors or non-EU sub-processors may access non-sensitive documents.",
              "All persons on the engagement located in the EU. No access by persons subject to extraterritorial laws."
            ]
          }
        ]
      },
      {
        name: "Security",
        questions: [
          {
            q: "Does the provider notify the company within 72 hours of a data breach or access incident?",
            guidance: "Ensure prompt, direct notification in the event of unauthorised access.",
            levels: [
              "No contractual obligation to notify within a defined timeframe.",
              "Notification provided for contractually, but without a guaranteed timeframe or precise level of detail.",
              "Formal notification guaranteed within 72 hours, with a structured report of nature, data, impact and measures."
            ]
          }
        ]
      },
      {
        name: "Transparency & Audit",
        questions: [
          {
            q: "Can the provider supply a complete, regularly updated list of tools / platforms / sub-processors used, with an existence certificate accessible for audit?",
            guidance: "Ensure the agency documents and communicates all tools and sub-processors used in the engagement.",
            levels: [
              "No list available. Tools used without informing the client or documenting compliance.",
              "Partial list available on request but not exhaustive or regularly updated. No third-party audit of completeness.",
              "Complete, up-to-date list of all tools, platforms and sub-processors, provided contractually and verifiable by audit."
            ]
          },
          {
            q: "Can the company request an independent audit of the provider's data management and processes?",
            guidance: "Verify that data-management commitments can be independently checked.",
            levels: [
              "No contractual audit rights. Provider only shares its own certifications.",
              "Audit rights limited: questionnaires and document reviews only. No access to internal processes.",
              "Full audit rights on data-processing procedures, exercised by any certified auditor appointed by the client."
            ]
          },
          {
            q: "Does the provider notify the company before any significant service change impacting its sovereignty?",
            guidance: "Ensure the client is informed before any change that may affect data sovereignty.",
            levels: [
              "No obligation to notify changes. The client discovers them after implementation.",
              "Notifies certain sovereignty-impacting changes (e.g. sub-processor) but not all.",
              "Contractually commits to notifying any sovereignty-impacting change with sufficient advance notice."
            ]
          }
        ]
      },
      {
        name: "Reversibility & Exit",
        questions: [
          {
            q: "Are the deliverables produced during the engagement entirely the intellectual property of the client company?",
            guidance: "Verify that deliverables (code, designs, studies, content) belong entirely to the client.",
            levels: [
              "Deliverables remain wholly or partly the property of the agency. The client only has a limited licence.",
              "Ownership of final deliverables transferred, but reusable components or internal libraries remain the agency's.",
              "All deliverables fully transferred to the client upon delivery, without usage restrictions."
            ]
          },
          {
            q: "Does the provider guarantee the permanent deletion of data at the end of the engagement?",
            guidance: "Ensure all entrusted data and documents are destroyed with no residual copies remaining.",
            levels: [
              "No contractual deletion obligation. The agency retains data indefinitely after the engagement.",
              "Deletion provided for but partial: some third-party tools or archives may retain residual copies.",
              "Comprehensive deletion of all entrusted data contractually guaranteed, with written attestation provided."
            ]
          }
        ]
      }
    ]
  }
};

// Product typology metadata (label + which schema drives its questionnaire)
const PRODUCT_TYPES = {
  "Hosting":  { schema: "hosting_cloud" },
  "Cloud":    { schema: "hosting_cloud" },
  "SaaS":     { schema: "saas_software" },
  "Software": { schema: "saas_software" },
  "Agency":   { schema: "agency_service" },
  "Service":  { schema: "agency_service" }
};
