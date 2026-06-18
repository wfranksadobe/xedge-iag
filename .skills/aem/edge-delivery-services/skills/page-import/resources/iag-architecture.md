# IAG-Architecture.md

# IAG Corporate Website Migration Architecture

## Vision
Migration of www.iag.com.au to Adobe Experience Manager Cloud Service, Edge Delivery Services and Universal Editor.

## Architecture Layers

### Experience Layer
- Corporate website
- Investor relations
- Sustainability reporting
- Newsroom
- Careers

### Authoring Layer
- Universal Editor
- AEM Assets
- Content Fragments
- Experience Fragments

### Delivery Layer
- Edge Delivery Services
- Fastly CDN
- Adobe Managed Infrastructure

### Analytics Layer
- Adobe Analytics
- Adobe Tags
- Adobe Data Layer

### Search Layer
- Corporate Search
- Investor Search
- Newsroom Search

## Investor Architecture
Supports:
- Annual reports
- ASX announcements
- Financial results
- Shareholder information
- Investor calendar

## Sustainability Architecture
Supports:
- ESG reporting
- Climate disclosures
- Community reporting
- Governance publications

## Security & Compliance
- WCAG 2.2 AA
- SEO preservation
- Redirect management
- Governance approvals
- Auditability

## Deployment Model
Author -> Review -> Approve -> Publish -> EDS -> Production
