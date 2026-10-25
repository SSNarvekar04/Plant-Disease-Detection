# PROJECT SYNOPSIS

## Project Title:
# Plant Disease Detection & Remedy Recommendation System

---

**Submitted to:**  
MCA Department  
DKTE Society's Textile & Engineering Institute, Ichalkaranji  

**Submitted by:**  
Saloni Sachindranath Narvekar  

**Institute:**  
MCA Department, DKTE Society's Textile & Engineering Institute, Ichalkaranji  

---
<!-- PAGE BREAK -->

## Introduction

Agriculture plays a central role in India's economy, employing over half of the workforce and providing food security for more than a billion people. However, plant diseases caused by fungal, bacterial, and viral pathogens, along with nutritional disorders, lead to severe annual crop yield reductions estimated between 20% to 40%. For smallholder and marginal farmers, timely diagnosis of foliar infections is critical to prevent crop loss.

Traditionally, identifying crop diseases requires physical consultation with agricultural extension officers or sending leaf samples to distant diagnostic laboratories. This process involves substantial travel costs, expert consultation fees, and turnaround delays of several days or weeks—by which time infections frequently spread uncontrollably across entire fields. Furthermore, while several existing mobile applications offer plant identification or basic disease labelling, they stop abruptly at naming the disease without providing actionable guidance on what steps the farmer should take next. This creates a critical disconnect between **detection** and **remediation**.

The **Plant Disease Detection & Remedy Recommendation System** bridges this gap. It is an end-to-end full-stack web application designed to diagnose foliar plant diseases instantly from photographs and provide comprehensive, actionable remedy plans. By submitting a leaf photograph through a modern, mobile-friendly web browser, the system leverages state-of-the-art Deep Learning Computer Vision models via the **Plant.id API v3** to determine the plant species, identify the most probable disease, and assign an empirical confidence score. 

The application matches this diagnosis with a curated knowledge base in MongoDB, generating an agronomic remedy advisory covering visible symptoms, causal factors, severity ratings, **organic biological remedies** (such as neem oil, Trichoderma, and compost teas), **certified chemical treatments** (such as specific fungicides and water-soluble fertilizers), and **preventive checklists** for subsequent growing seasons. Built on modern web architecture (React 18, Node.js, Express, and MongoDB), the system empowers farmers with reliable, 24/7 agricultural expertise.

---
*MCA Department, DKTE Society's Textile & Engineering Institute, Ichalkaranji*

---
<!-- PAGE BREAK -->

## MODIFICATION AND IMPROVEMENT OVER THE EXISTING IMPLEMENTATION

### Present State:
* **Manual Visual Inspection:** Farmers rely on subjective visual guesses or advice from local pesticide shopkeepers, often resulting in incorrect disease identification.
* **Delayed Laboratory Diagnosis:** Traditional agricultural extension services take days or weeks for laboratory sample culture, causing infections to spread before remedies can be applied.
* **Incomplete Digital Tools:** Existing mobile apps typically stop at identifying the plant species or presenting a disease name without actionable remedial advice.
* **Excessive & Indiscriminate Chemical Use:** Lack of guidance leads to over-application of synthetic chemical pesticides, increasing input costs, damaging soil microbial health, and causing chemical resistance.
* **Absence of Historical Tracking:** Farmers have no centralized digital mechanism to record past crop health issues or monitor recurring seasonal outbreaks.
* **Lack of Confidence Transparency:** Existing systems often present forced predictions on non-crop or unidentifiable photos without indicating uncertainty.

### After implementation of project:
* **Instant Automated AI Diagnosis:** Delivers scientific plant species and disease classification within seconds directly from a single leaf photo.
* **Dual Actionable Advisory (Organic & Chemical):** Provides both eco-friendly organic biological remedies for residue-free farming and certified chemical fungicide/fertilizer treatments for emergency control.
* **Comprehensive Agronomic Profile:** Generates symptom descriptions, causal factor explanations, severity metrics, and seasonal prevention checklists for every diagnosis.
* **Persistent Historical Logging:** Automatically logs each scan per user, enabling farmers and administrators to track recurring infections over time.
* **Honest Confidence & Image Verification:** Automatically validates image integrity (magic-byte checking), filters non-plant images (`is_plant` validation), and flags low-confidence predictions to prevent misdiagnosis.
* **Dynamic Knowledge Base Management:** Features an administrative portal to curate, update, and expand disease records and remedies without requiring application redeployment.

---
*MCA Department, DKTE Society's Textile & Engineering Institute, Ichalkaranji*

---
<!-- PAGE BREAK -->

## SCOPE

The scope of the **Plant Disease Detection & Remedy Recommendation System** encompasses functional, technical, and operational dimensions:

1. **Multi-Crop Foliar Disease Identification:**
   * High-accuracy detection across 7 major commercial and food crops: Tomato, Potato, Apple, Grape, Corn/Maize, Bell Pepper, and Strawberry.
   * Coverage of 31+ distinct foliar conditions including fungal blights, rusts, mildews, bacterial spots, viral mosaics, and abiotic nutrient deficiencies.

2. **Automated AI Computer Vision Pipeline:**
   * Integration with the Plant.id API v3 utilizing Convolutional Neural Networks (CNNs) trained on millions of botanical images.
   * Dual-stage inference returning taxonomic species classification and multi-class disease probability rankings.

3. **Structured Remedy Recommendation Engine:**
   * Intelligent matching layer (`diseaseMatchService`) mapping Latin scientific classifications and pathogen types to curated vernacular agricultural remedy plans.
   * Structured categorization into Symptoms, Causes, Severity, Organic Remedies, Chemical Treatments, and Seasonal Precautionary Checklists.

4. **User & Diagnostic History Management:**
   * Secure user authentication with JSON Web Tokens (JWT) and Bcrypt password hashing.
   * User dashboard featuring personal scan histories, image galleries, and historical health trend charts.

5. **Administrative Management Portal:**
   * Role-based access control (RBAC) allowing authorized administrators to manage user accounts, review global scan statistics, and perform CRUD operations on the disease knowledge base.
   * Real-time monitoring of AI service reachability and system latency.

6. **Responsive Cross-Platform Availability:**
   * Cross-browser, responsive client built with React 18, Vite, and Tailwind CSS, fully accessible on desktop computers, tablets, and mobile smartphones.

---
*MCA Department, DKTE Society's Textile & Engineering Institute, Ichalkaranji*

---
<!-- PAGE BREAK -->

## SIGNIFICANCE OF PROJECT

The significance of the project is to provide the following benefits:

* **Rapid Disease Containment:** Enables instantaneous detection in the field, allowing farmers to isolate infected foliage and treat blights before pathogens destroy entire crops.
* **Substantial Reduction in Input Costs:** Recommends targeted treatments and accessible, low-cost organic alternatives, preventing wasteful spending on ineffective or unnecessary chemicals.
* **Promotion of Sustainable & Eco-Friendly Agriculture:** Encourages organic remedies (such as neem formulations, biological antagonists like Trichoderma, and compost teas), protecting soil quality, beneficial insects, and groundwater.
* **Democratization of Expert Agricultural Advisory:** Brings institutional laboratory-grade diagnosis directly to rural and marginal farmers 24/7 without consultation fees or travel constraints.
* **Data-Driven Farming & Predictive Insight:** Generates personal scanning records that help farmers understand which pathogens persist in their fields across crop cycles.
* **Reduced Crop Loss and Higher Yield Quality:** Timely and accurate remedies protect fruit quality and harvest volume, directly improving farm profitability and food security.

---
*MCA Department, DKTE Society's Textile & Engineering Institute, Ichalkaranji*

---
<!-- PAGE BREAK -->

## TOOLS AND TECHNOLOGY USED

### Tool:
* **Visual Studio Code (VS Code):** A lightweight, extensible code editor providing integrated terminal access, code linting, debugging, and Git integration for full-stack JavaScript development.
* **Node.js Runtime Environment (v18+ / v24):** An open-source, cross-platform JavaScript runtime environment executing backend server operations asynchronously via an event-driven I/O model.
* **MongoDB Compass:** The official graphical user interface (GUI) for MongoDB, utilized for querying collections, inspecting documents, and managing database indexes.
* **Postman / cURL:** API development and testing tools used to validate RESTful endpoints, multipart payload uploads, and authentication tokens.
* **Git & GitHub:** Distributed version control system and cloud repository utilized for source code tracking, branching, and project maintenance.

### Technology:
* **React.js (v18):** A declarative, component-based frontend JavaScript library used for developing dynamic Single Page Applications (SPAs) with stateful user interfaces.
* **Vite (v6):** A modern frontend build tool providing an ultra-fast development server with Hot Module Replacement (HMR) and Rollup-based production builds.
* **Express.js (v4):** A minimal and flexible Node.js web application framework providing robust features for RESTful routing, middleware handling, and HTTP request processing.
* **MongoDB & Mongoose (v8):** A document-oriented NoSQL database coupled with the Mongoose Object Data Modeling (ODM) library for strict schema definition, validation, and asynchronous queries.
* **Tailwind CSS (v3):** A utility-first CSS framework enabling rapid, responsive UI development with built-in dark/light mode themes and mobile-first layouts.
* **Plant.id API v3:** A state-of-the-art Deep Learning Computer Vision API utilizing Convolutional Neural Networks (CNNs) for botanical species classification and foliar health assessment.
* **JSON Web Tokens (JWT) & Bcrypt.js:** Industry-standard stateless token authentication and cryptographic password hashing (12 salt rounds) ensuring secure user session management.
* **Multer:** Node.js multipart form-data middleware configured with in-memory buffering for zero-disk-leak file validation and streaming.
* **Chart.js & Lucide React:** Charting engine for rendering interactive visual analytics and an accessible iconography system.

---
*MCA Department, DKTE Society's Textile & Engineering Institute, Ichalkaranji*

---
<!-- PAGE BREAK -->

## TIME FRAME REQUIRED FOR VARIOUS STAGES OF PROJECT IMPLEMENTATION

| Sr. No. | PHASES | TIME DURATION |
| :---: | :--- | :---: |
| 1. | Software Requirement Specification (SRS) & Literature Review | 2 weeks |
| 2. | System Design (Architecture, Database Schema & UI/UX Wireframing) | 3 weeks |
| 3. | Coding & Integration (Frontend, Express Backend & AI Pipeline) | 4 weeks |
| 4. | Implementation & Knowledge Base Curation (Remedy Database) | 5 weeks |
| 5. | Testing, Optimization & Deployment Verification | 1 week |

---
*MCA Department, DKTE Society's Textile & Engineering Institute, Ichalkaranji*

---
<!-- PAGE BREAK -->

## REFERENCES

* **Mohanty, S. P., Hughes, D. P., & Salathé, M. (2016).** *Using deep learning for image-based plant disease detection.* Frontiers in Plant Science, 7, 1419.
* **Hughes, D. P., & Salathé, M. (2015).** *An open access repository of images on plant health to enable the development of mobile disease diagnostics.* arXiv preprint arXiv:1511.08060 (PlantVillage dataset).
* **Plant.id API Documentation (2024).** *FlowerChecker s.r.o.* Machine Learning Plant Identification & Health Assessment API v3. https://plant.id/
* **MongoDB Documentation (2024).** *MongoDB, Inc.* MongoDB Manual & Mongoose ODM Documentation. https://www.mongodb.com/docs/
* **React Documentation (2024).** *Meta Open Source.* React 18: Getting Started and Component Architecture. https://react.dev/
* **Express.js Documentation (2024).** *OpenJS Foundation.* Fast, unopinionated, minimalist web framework for Node.js. https://expressjs.com/
* **ICAR (Indian Council of Agricultural Research).** *Integrated Pest and Disease Management Guidelines for Horticultural and Cash Crops.* https://icar.org.in/

---
*MCA Department, DKTE Society's Textile & Engineering Institute, Ichalkaranji*

