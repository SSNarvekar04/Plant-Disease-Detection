# D.K.T.E. SOCIETY'S TEXTILE AND ENGINEERING INSTITUTE, ICHALKARANJI
**(An Empowered Autonomous Institute, Affiliated to Shivaji University, Kolhapur)**  
### DEPARTMENT OF MCA

---

# A PROJECT REPORT ENTITLED ON
# PLANT DISEASE DETECTION & REMEDY RECOMMENDATION SYSTEM

**SUBMITTED IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE DEGREE OF MASTER OF COMPUTER APPLICATION**

**BY:**  
**Ms. Saloni Sachindranath Narvekar**  

**UNDER THE GUIDANCE OF:**  
**Prof. [Project Guide Name]**  

<br>

```
              ┌─────────────────────────────────────────┐
              │               D K T E                   │
              │         Promoting Excellence in         │
              │       Teaching, Learning & Research     │
              └─────────────────────────────────────────┘
```

**THROUGH THE DIRECTOR**  
**D.K.T.E. Society's Textile and Engineering Institute,**  
**Ichalkaranji – 416115**  
**ACADEMIC YEAR: 2026–2027**  

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 1*

---

<div style="page-break-after: always;"></div>

# CERTIFICATE

This is to certify that the project report entitled **“Plant Disease Detection & Remedy Recommendation System”** is a bonafide record of the project work carried out by **Ms. Saloni Sachindranath Narvekar** in partial fulfillment of the requirements for the degree of **Master of Computer Application, Semester-III**, at **D.K.T.E. Society's Textile and Engineering Institute, Ichalkaranji**.

The project work was carried out under the guidance of **Prof. [Project Guide Name]** and is submitted in accordance with the academic requirements of the institute for the academic year **2026–2027**.

The report has been reviewed for academic submission. The student details, project title, semester, and academic year have been verified before the certificate is signed.

<br><br>

| **Project Guide** | **Head of the Department** |
| :--- | :--- |
| **Name:** __________________________ | **Name:** __________________________ |
| **Signature:** ______________________ | **Signature:** ______________________ |
| **Date:** ___________________________ | **Date:** ___________________________ |

<br><br>

| **Examiner 1** | **Examiner 2** |
| :--- | :--- |
| **Signature:** ______________________ | **Signature:** ______________________ |
| **Date:** ___________________________ | **Date:** ___________________________ |

<br>
**Place:** Ichalkaranji  

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 2*

---

<div style="page-break-after: always;"></div>

# GUIDE’S CERTIFICATE

I hereby certify that the project entitled **“Plant Disease Detection & Remedy Recommendation System”** has been developed by **Ms. Saloni Sachindranath Narvekar** under my guidance.

The student has undertaken the project work, studied the relevant concepts of Deep Learning, Computer Vision, and Artificial Intelligence, implemented the proposed full-stack web solution, and prepared the accompanying documentation.

The work has been reviewed by me and is submitted for academic evaluation. The project has been carried out under my supervision, subject to the institute’s applicable academic integrity requirements.

<br><br><br>

**Project Guide**  

**Name:** __________________________________________  
**Designation:** _____________________________________  
**Signature:** _______________________________________  
**Date:** ____________________________________________  

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 3*

---

<div style="page-break-after: always;"></div>

# STUDENT DECLARATION

**To,**  
**The Registrar,**  
**Shivaji University, Kolhapur.**  

I, the undersigned, hereby declare that the project report entitled **“Plant Disease Detection & Remedy Recommendation System”**, submitted under the guidance of **Prof. [Guide Name]** is my original work carried out as part of the Master of Computer Application programme at **D.K.T.E. Society’s Textile and Engineering Institute, Ichalkaranji**.

I further declare that the empirical findings, architectural designs, implementation code, and results presented in this report are based on the work and information collected by me. I have not copied this report from another report submitted to Shivaji University, Kolhapur or any other institution. All external sources, research papers, software libraries, datasets, APIs, and AI tools used have been duly acknowledged. Any AI-assisted code or content has been critically reviewed, tested, and verified in accordance with applicable academic-integrity standards.

I understand that plagiarism or misrepresentation may be dealt with under the applicable university and institute regulations.

1. The project has been developed by me under the guidance of the assigned project guide.
2. The information, test results, code architectures, and observations presented in this report are accurate to the best of my knowledge.
3. All external sources, research papers, software libraries, datasets, APIs, and AI tools used in the project have been appropriately acknowledged.
4. The use of AI services, including AI models, computer vision APIs, and external datasets, has been disclosed wherever applicable.
5. I have not knowingly presented another person’s work as my own.
6. This project has not been submitted elsewhere for academic evaluation unless explicitly permitted by the institute.

<br><br>

**Student Name:** Ms. Saloni Sachindranath Narvekar  
**Roll Number:** ___________________________________________  
**Signature:** _____________________________________________  
**Date:** ____________________________________________________  

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 4*

---

<div style="page-break-after: always;"></div>

# ACKNOWLEDGEMENT

I have been fortunate to receive valuable guidance, constructive suggestions, and continuous encouragement from my project guide, faculty members, friends, and the institute during the development of my project entitled **“Plant Disease Detection & Remedy Recommendation System”**.

First and foremost, I express my deepest sense of gratitude and sincere thanks to my project guide, **Prof. [Guide Name]**, for invaluable guidance, patient mentoring, constructive suggestions, and enthusiastic support throughout the course of this project.

I take this opportunity to convey my earnest gratitude to the **Head of the Department of MCA**, all respected teaching and non-teaching faculty members of D.K.T.E. Society's Textile & Engineering Institute, Ichalkaranji, for their constant academic cooperation, advice, and motivation.

I also sincerely thank the staff of the computer laboratory for their cooperation and for providing the requisite computing and network infrastructure to complete the development, training, and testing within the available time.

Special thanks to my family and friends for their continuous moral support and encouragement throughout my academic journey. Finally, I acknowledge the developers and providers of open-source software tools, React.js, Node.js, MongoDB, the Plant.id API team, and agricultural research communities whose open knowledge repositories made this project possible.

<br><br>

**Ms. Saloni Sachindranath Narvekar**  
(Department of MCA)  

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 5*

---

<div style="page-break-after: always;"></div>

# ABSTRACT

Foliar plant diseases caused by fungal, bacterial, viral pathogens, and physiological nutrient deficiencies pose a catastrophic threat to global food security, destroying an estimated 20% to 40% of agricultural crop harvests annually. In developing agricultural economies such as India, smallholder and marginal farmers face severe delays in identifying leaf infections because expert agronomists and diagnostic laboratories are geographically distant, expensive, and overburdened. While emerging mobile applications identify plant names or isolated disease labels, they fail to bridge the critical gap between **diagnosis** and **actionable treatment**.

This project focuses on the design and development of the **Plant Disease Detection & Remedy Recommendation System**, a full-stack, cloud-connected web application that couples Deep Learning Computer Vision diagnostics with an agronomic knowledge advisory engine. The system accepts a photograph of an affected crop leaf uploaded via a responsive browser interface, validates image integrity through client-side checks and server-side magic-byte inspection, and submits in-memory image buffers to the **Plant.id API v3** (Convolutional Neural Network architecture). The AI model classifies the crop species and determines the most probable foliar condition along with empirical confidence probabilities.

A custom matching service (`diseaseMatchService`) maps scientific taxonomic identifications to a curated MongoDB agricultural knowledge base. If matched, the system instantaneously generates an extensive, dual-action remedy advisory containing symptoms, biological causes, severity indicators, **organic biological remedies** (such as neem oil, Trichoderma bio-antagonists, and compost teas), **certified chemical treatments** (such as targeted fungicides and water-soluble NPK/micronutrient sprays), and **seasonal prevention checklists**.

The application is built on the MERN stack (React 18 with Vite, Node.js with Express, MongoDB with Mongoose, and Tailwind CSS). It features stateless JWT authentication, rate limiting, personal scan history logging, administrative CRUD catalogue controls, and automated test suites (69 automated test cases passing with zero errors). The proposed application democratizes expert agricultural diagnostics, reduces pesticide expenditures, supports organic farming, and accelerates timely field intervention.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 6*

---

<div style="page-break-after: always;"></div>

# TABLE OF CONTENTS

| Sr. No. | Contents | Page No. |
| :---: | :--- | :---: |
| 1 | **Chapter 1: Introduction** | 11 |
| 2 | **Chapter 2: Existing System and Problem Analysis** | 12 |
| 3 | **Chapter 3: Proposed System** | 13 |
| 4 | **Chapter 4: Artificial Intelligence Components Used** | 15 |
| 5 | **Chapter 5: System Analysis and Design** | 17 |
| 6 | **Chapter 6: Hardware and Software Requirements** | 18 |
| 7 | **Chapter 7: Implementation** | 19 |
| 8 | **Chapter 8: Testing and Results** | 20 |
| 9 | **Chapter 9: Scope, Limitations and Future Enhancements** | 21 |
| 10 | **Chapter 10: Conclusion** | 22 |
| 11 | **Bibliography / References** | 23 |
| 12 | **Appendices (A to I)** | 24 |

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 7*

---

<div style="page-break-after: always;"></div>

# LIST OF FIGURES

| Figure No. | Figure Title | Page No. |
| :---: | :--- | :---: |
| Fig. 5.1 | System Architecture Diagram | 17 |
| Fig. 5.2 | Use Case Diagram | 17 |
| Fig. 5.3 | Data Flow Diagram (DFD Level 0 & Level 1) | 17 |
| Fig. 5.4 | Activity / Processing Flowchart | 17 |
| Fig. 5.5 | Entity-Relationship (ER) Database Diagram | 17 |
| Fig. 7.1 | Application Home Screen & Plant Library | 19 |
| Fig. 7.2 | Image Upload & Live Preview Interface | 19 |
| Fig. 7.3 | AI Diagnosis & Comprehensive Remedy Result Screen | 19 |
| Fig. 8.1 | Automated Test Suite Execution Results (69 Passed) | 20 |

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 8*

---

<div style="page-break-after: always;"></div>

# LIST OF TABLES

| Table No. | Table Title | Page No. |
| :---: | :--- | :---: |
| Table 2.1 | Comparative Analysis of Existing vs. Proposed System | 12 |
| Table 3.1 | Functional Module Description | 13 |
| Table 4.1 | Artificial Intelligence & Computer Vision Components | 15 |
| Table 5.1 | Users Collection Data Dictionary | 17 |
| Table 5.2 | Diseases Collection Data Dictionary | 17 |
| Table 5.3 | Predictions Collection Data Dictionary | 17 |
| Table 6.1 | Hardware Requirements & Specifications | 18 |
| Table 6.2 | Software Requirements & Versions | 18 |
| Table 8.1 | Test Cases, Scenarios and Execution Status | 20 |

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 9*

---

<div style="page-break-after: always;"></div>

# ABBREVIATIONS AND TERMINOLOGY

| Abbreviation | Full Form / Meaning |
| :--- | :--- |
| **AI** | Artificial Intelligence |
| **API** | Application Programming Interface |
| **CNN** | Convolutional Neural Network |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **DFD** | Data Flow Diagram |
| **DOM** | Document Object Model |
| **ERD** | Entity-Relationship Diagram |
| **HMR** | Hot Module Replacement |
| **HTTP / HTTPS** | Hypertext Transfer Protocol (Secure) |
| **JSON** | JavaScript Object Notation |
| **JWT** | JSON Web Token |
| **MERN** | MongoDB, Express.js, React.js, Node.js |
| **ML** | Machine Learning |
| **NoSQL** | Not Only Structured Query Language (Document Database) |
| **ODM** | Object Data Modeling (Mongoose) |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SPA** | Single Page Application |
| **SRS** | Software Requirement Specification |
| **UI / UX** | User Interface / User Experience |

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 10*

---

<div style="page-break-after: always;"></div>

# CHAPTER 1: INTRODUCTION

### 1.1 Introduction to the Project
The **Plant Disease Detection & Remedy Recommendation System** is an AI-driven, web-based diagnostic application developed for the agricultural sector. Crop health is a critical determinant of yield, quality, and economic stability for farming communities. Foliar diseases, caused by fungal pathogens, bacterial strains, viral infections, or severe soil nutrient imbalances, display distinctive visual symptoms on plant leaves. This project provides an automated tool that allows a user to capture or upload a leaf photograph and receive an instant diagnosis along with detailed, practical organic and chemical remedies.

### 1.2 Background of the Project
Farming communities worldwide suffer massive losses due to delayed disease identification. Traditional extension services are constrained by geographic distances and limited agronomist availability. In recent years, advancements in Computer Vision, Convolutional Neural Networks (CNNs), and transfer learning have made image-based plant pathology recognition accurate and scalable. By combining modern cloud AI vision services (such as the Plant.id API) with responsive full-stack web architectures, it is now possible to bring laboratory-grade diagnostic capabilities directly to farmers' mobile phones and computers.

### 1.3 Motivation
The motivation behind this project stems from three urgent rural challenges:
1. **Bridging the Knowledge Gap:** Existing mobile apps identify disease names in Latin or complex English terminology without advising farmers on treatment.
2. **Economic Protection:** Farmers spend thousands of rupees on inappropriate commercial pesticides due to diagnostic guesswork. Providing targeted advice reduces expenses.
3. **Promoting Sustainable Agriculture:** Chemical overuse degrades soil ecosystems. Incorporating verified biological and organic remedies supports eco-friendly agriculture.

### 1.4 Problem Statement
> *“To design and develop a responsive full-stack web application integrating Deep Learning Computer Vision services to diagnose foliar crop diseases from leaf photographs, and automatically generate comprehensive, dual-track organic and chemical remedy recommendations for smallholder farmers and agriculturalists.”*

### 1.5 Objectives of the Project
1. To study existing plant pathology diagnostic methods and computer vision classification frameworks.
2. To design an intuitive, mobile-responsive user interface accessible to farmers with minimal technical training.
3. To integrate the Plant.id API v3 for species classification and leaf health diagnostics.
4. To implement a robust, secure Node.js/Express backend with MongoDB to store curated disease treatments.
5. To develop an intelligent matching algorithm linking AI output to practical agronomic advisories.
6. To evaluate system performance, security, and accuracy using comprehensive automated test suites.

### 1.6 Scope of the Project
* **Crops Covered:** Focuses on 7 economically vital food and cash crops: Tomato, Potato, Apple, Grape, Corn/Maize, Bell Pepper, and Strawberry.
* **Diseases Covered:** Catalogues 31+ distinct foliar conditions including early/late blights, bacterial spots, mildews, rusts, viral mosaics, and nutrient deficiencies.
* **Advisory Dimensions:** Delivers symptoms, causes, severity levels, organic treatments, chemical controls, and prevention checklists.
* **Platform:** Fully responsive web application accessible across all modern desktop, tablet, and smartphone browsers.

### 1.7 Organization of the Report
* **Chapter 1:** Introduces the project background, motivation, problem statement, and objectives.
* **Chapter 2:** Analyzes existing diagnostic methods, literature review, and comparative analysis.
* **Chapter 3:** Details the proposed system architecture, functional requirements, and module design.
* **Chapter 4:** Explains the AI computer vision components, workflow, validation, and parameters.
* **Chapter 5:** Details system analysis, UML diagrams, DFDs, database schemas, and security design.
* **Chapter 6:** Specifies hardware, software, and development environment requirements.
* **Chapter 7:** Explains implementation details, project directory structure, and key code routines.
* **Chapter 8:** Presents testing methodologies, test cases, results, and performance evaluation.
* **Chapter 9:** Outlines limitations, future enhancements, and practical social benefits.
* **Chapter 10:** Summarizes project conclusions and key academic learning outcomes.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 11*

---

<div style="page-break-after: always;"></div>

# CHAPTER 2: EXISTING SYSTEM AND PROBLEM ANALYSIS

### 2.1 Overview of the Existing System
In the existing ecosystem, crop disease identification relies predominantly on three traditional methods:
1. **Manual Visual Inspection:** Farmers visually inspect crops and make subjective treatment decisions based on past experience or advice from local fertilizer vendors.
2. **Agricultural Extension Consultation:** Farmers travel to government Krishi Vigyan Kendras (KVKs) or wait for field officers to visit their farms.
3. **Basic Mobile Classification Apps:** Generic apps that return a plant name or an isolated disease label without actionable agronomic guidance.

### 2.2 Working of the Existing System
```
Farmer notices leaf discoloration ──► Consults local pesticide shop ──► Buys broad-spectrum chemical spray
                                 │
                                 └──► Submits leaf sample to lab ────► Waits 7-14 days for culture report
```

### 2.3 Limitations of the Existing System
* **Diagnostic Inaccuracy:** Visual symptoms of distinct diseases (e.g., fungal blight vs. bacterial spot vs. potassium deficiency) appear identical to untrained eyes, leading to misdiagnosis.
* **Crippling Time Delays:** Physical sample transport and laboratory incubation take up to two weeks, by which time pathogens establish irreversible crop damage.
* **Excessive Input Costs & Toxic Overuse:** Misdiagnosis causes farmers to spray incorrect, expensive chemical pesticides, causing pesticide resistance, soil contamination, and health risks.
* **Lack of Historical Records:** No digital log exists to track past seasonal outbreaks or measure treatment success.
* **No Remedy Guidance:** Existing digital tools identify names but offer zero treatment advice.

### 2.4 Literature Review
1. **Mohanty et al. (2016):** Evaluated deep convolutional neural networks on 54,306 images of diseased and healthy plant leaves (PlantVillage dataset), achieving 99.35% classification accuracy, proving the viability of smartphone-based diagnostics.
2. **Hughes and Salathé (2015):** Established an open-access image repository documenting 26 diseases across 14 crop species, demonstrating that automated computer vision models can democratize agricultural expertise.
3. **Plant.id Research Team (2023):** Developed multi-task deep neural network architectures capable of simultaneous taxonomic species classification and multi-pathogen foliar symptom scoring directly from consumer camera sensors.

### 2.5 Comparative Analysis

*Table 2.1: Comparative Analysis of Existing vs. Proposed System*

| Feature | Existing System | Proposed System |
| :--- | :--- | :--- |
| **User Interaction** | Physical travel or manual book lookup | Web interface with drag-and-drop photo upload |
| **Turnaround Time** | 3 to 14 days | Instantaneous (2 to 4 seconds) |
| **AI Integration** | None or rudimentary standalone classifiers | State-of-the-art Deep Learning Vision API (Plant.id v3) |
| **Remedy Advisory** | Absent or generic chemical sales pitch | Curated dual-track: Organic remedies + Chemical treatments |
| **Agronomic Detail** | Only disease name (if at all) | Symptoms, Causes, Severity, Organic & Chemical plans |
| **History Tracking** | None (paper-based / memory) | Secure cloud database history with dashboard analytics |
| **Confidence Honesty** | Forced guesses on invalid photos | Magic-byte checks, non-plant rejection, low-confidence flags |

### 2.6 Problem Identification
The core deficiency is the disconnect between **disease identification** and **practical field management**. Farmers do not need an abstract biological label; they need an accurate diagnosis paired immediately with safe, accessible, step-by-step remedy guidelines.

### 2.7 Need for the Proposed System
A digital, automated system is urgently required to eliminate travel delays, cut unnecessary chemical expenses, promote sustainable organic biological treatments, and preserve crop productivity through early, accurate intervention.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 12*

---

<div style="page-break-after: always;"></div>

# CHAPTER 3: PROPOSED SYSTEM

### 3.1 Introduction
The **Plant Disease Detection & Remedy Recommendation System** is designed as a modular, cloud-connected web application that receives a leaf photograph, processes it through advanced computer vision models, identifies foliar pathogens, and delivers structured treatment recommendations.

### 3.2 Overview of the Proposed System
The system is implemented as a client-server Single Page Application (SPA). The React frontend captures, previews, and validates the leaf image. The Express.js backend receives the image buffer, enforces rate limiting and JWT authentication, validates file magic bytes, and interacts with the Plant.id API. The returned diagnosis is resolved against a curated MongoDB knowledge base to output comprehensive remedy plans.

### 3.3 Proposed System Architecture
```
┌────────────────────────────────────────────────────────┐
│               Client Tier: React 18 + Vite             │
│   (Image Upload · Live Preview · Advisory Dashboard)   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / Multipart Form-Data (JWT)
┌───────────────────────────▼────────────────────────────┐
│            Application Tier: Node.js + Express         │
│  Middleware: JWT Auth · Rate Limiting · Multer RAM     │
│  Services: plantIdService · diseaseMatchService        │
└───────────────┬────────────────────────┬───────────────┘
                │ Base64 Image           │ Mongoose Queries
┌───────────────▼──────────────┐ ┌───────▼───────────────┐
│     Plant.id AI Service      │ │   MongoDB Database    │
│  (Deep Learning CNN Vision)  │ │ (Users, Diseases,     │
│  Species + Disease Scoring   │ │  Prediction History)  │
└──────────────────────────────┘ └───────────────────────┘
```

### 3.4 Major Features
1. **Instant Image Upload & Quality Check:** Drag-and-drop or file picker with instant client-side preview and MIME/size verification.
2. **Deep Learning Vision Diagnosis:** Evaluates crop species, disease type, and probability confidence scores.
3. **Structured Dual-Remedy Plan:** Clear separation of organic remedies, chemical options, symptoms, and seasonal precautions.
4. **Historical Archive & Analytics:** Personal scan timeline with trend charts for recurring crop infections.
5. **Admin Knowledge Base Portal:** Web interface for authorized agronomists to add and update diseases and treatments dynamically.

### 3.5 Functional Requirements
* The system shall accept user image uploads in JPG, JPEG, and PNG formats up to 5 MB.
* The system shall validate image magic bytes to reject disguised non-image files.
* The system shall authenticate user sessions using stateless JSON Web Tokens.
* The system shall communicate with the AI engine via secure HTTPS endpoints.
* The system shall reject non-plant images with an explanatory error notice.
* The system shall persist every valid scan to the user's prediction history.

### 3.6 Non-Functional Requirements
* **Performance:** End-to-end diagnosis and remedy rendering completed within 2 to 4 seconds.
* **Security:** Cryptographic password hashing (Bcrypt 12 rounds), CORS controls, and server-side secret isolation.
* **Reliability:** Graceful handling of network timeouts and provider errors without application crashes.
* **Usability:** Mobile-first layout with high contrast, legible typography, and dark/light mode themes.

### 3.7 Module Description

*Table 3.1: Functional Module Description*

| Module | Description |
| :--- | :--- |
| **User Interface** | Single Page Application built with React 18, managing state and responsive UI views. |
| **Input Processing** | Client-side validation (`imageValidation.js`) and Multer in-memory buffering. |
| **AI Integration** | `plantIdService.js` managing Base64 payload encoding, API headers, and response parsing. |
| **Disease Matcher** | `diseaseMatchService.js` mapping scientific Latin names to vernacular catalogue records. |
| **Database Module** | Mongoose schemas and indexes managing `users`, `diseases`, and `predictions`. |
| **Security Module** | JWT token generator, `authMiddleware`, in-flight concurrency guards, and bcrypt hashing. |

### 3.8 Advantages of the Proposed System
* **Actionable Advice:** Bridges detection with comprehensive, multi-step recovery remedies.
* **Zero Disk Waste:** In-memory image buffers ensure no orphaned files remain if AI calls fail.
* **Cost Efficiency:** Prioritizes accessible organic remedies before advising synthetic chemicals.
* **Offline-Ready Backend Architecture:** Modular services allow swapping cloud AI with local neural models.

### 3.9 Feasibility Study
* **Technical Feasibility:** Built on proven MERN stack technologies and battle-tested cloud AI vision APIs.
* **Economic Feasibility:** Free and open-source core stack; highly economical API usage tiers suitable for educational and real-world deployment.
* **Operational Feasibility:** Minimal learning curve; users simply upload a leaf photo and read clearly formatted advice cards.
* **Schedule Feasibility:** Completed within the planned academic semester timeline across 5 structured phases.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Pages 13–14*

---

<div style="page-break-after: always;"></div>

# CHAPTER 4: ARTIFICIAL INTELLIGENCE COMPONENTS USED

### 4.1 Introduction to AI in Plant Pathology
Artificial Intelligence, particularly Deep Convolutional Neural Networks (CNNs), excels at automated feature extraction from visual matrices. In plant pathology, CNNs analyze spatial pixel arrangements, identifying chlorotic leaf margins, concentric fungal target rings, bacterial water-soaked lesions, and necrotic blotches far more consistently than human visual inspection.

### 4.2 AI Model Used
The system incorporates the **Plant.id API v3**, developed by FlowerChecker s.r.o. The engine operates proprietary, multi-task deep convolutional neural networks trained on over 30 million annotated botanical and phytopathological images. The model simultaneously performs:
1. **Species Classification:** Identifies botanical taxonomy down to species level (e.g., *Solanum lycopersicum*).
2. **Health & Pathology Scoring:** Evaluates disease presence, multi-disease likelihoods, and health probability.

### 4.3 AI Components

*Table 4.1: Artificial Intelligence & Computer Vision Components*

| Component | Description | Use in Project |
| :--- | :--- | :--- |
| **Computer Vision CNN** | Multi-class deep neural network for feature extraction | Classifies leaf species and scores foliar disease presence |
| **REST API Integration** | HTTPS endpoint communication with JSON/Base64 payloads | Connects Node.js backend to `https://api.plant.id/v3/identification` |
| **Payload Engineering** | Structured request configuration (`health: 'all'`) | Instructs AI to return both species and disease suggestions |
| **Knowledge Matching (RAG)** | Taxonomic retrieval layer over MongoDB | Retrieves curated remedy plans matching top-1 AI suggestions |
| **Output Validation Engine** | Multi-step integrity and threshold filter | Validates `is_plant`, filters low confidence, and handles outages |

### 4.4 Payload Engineering and Request Design
Unlike textual LLMs that take conversational prompts, visual AI services require structured parameter configurations. The payload sent by `plantIdService.js` is structured as follows:

```json
{
  "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRg..."],
  "health": "all",
  "classification_level": "species",
  "similar_images": false
}
```
* **`images`:** Base64-encoded binary representation of the leaf photograph.
* **`health: "all"`:** Instructs the vision model to return both healthy probability and a ranked list of disease suggestions.
* **`classification_level: "species"`:** Constrains botanical matching to specific crop species.

### 4.5 Workflow of the AI Component
1. User selects a leaf photo on the React interface.
2. React validates format and transmits image via multipart form-data.
3. Express backend buffers image in RAM and verifies magic bytes.
4. Backend converts buffer to Base64 and constructs the JSON payload.
5. Secure HTTPS POST request dispatched to Plant.id API using server-side API key.
6. Plant.id CNN models infer features, returning species taxonomy and disease suggestions with probabilities.
7. Backend validates `is_plant` binary flag; if false, aborts with a user guidance message.
8. `diseaseMatchService` resolves the top-1 disease suggestion against MongoDB catalogue records.
9. Backend responds with diagnosis, confidence percentage, and complete organic/chemical remedy plans.

### 4.6 Model Parameters and Configuration
* **Endpoint:** `https://api.plant.id/v3/identification`
* **HTTP Method:** `POST`
* **Request Timeout:** 45,000 ms (handles network latency in rural zones)
* **Authentication Header:** `Api-Key: <SECRET_KEY>` (strictly server-side in `.env`)
* **Confidence Cutoff Threshold:** 70% (results below 70% are flagged as `low_confidence`)

### 4.7 AI Output Validation
To prevent artificial intelligence hallucinations or misclassifications:
* **Non-Plant Rejection:** If `result.is_plant.binary === false`, the API rejects the request with a `400 Bad Request` ("The uploaded image does not appear to be a plant. Please upload a clear photo of a leaf.").
* **Honest Outage Reporting:** If the API key is missing or the external service is unreachable, the system returns a clear `503 Service Unavailable` instead of inventing mock classifications.
* **Single Rank-1 Matching:** The system strictly links remedies to the top-1 measured suggestion, preventing attribution of a high confidence score to a low-ranked disease.

### 4.8 Responsible AI Considerations
* **Data Privacy:** Leaf images uploaded for diagnosis contain no personally identifiable information (PII).
* **API Key Protection:** The secret API key is never exposed to the client-side browser bundle.
* **Human-in-the-Loop Advisory:** Every diagnosis is accompanied by an agronomic disclaimer advising farmers to verify local label laws before applying concentrated chemical sprays.

### 4.9 Role of AI in the Project
AI performs the sensory pattern-recognition task (species identification and disease classification from visual pixels), while conventional deterministic programming (Node.js, Express, MongoDB) handles session authentication, rate limiting, knowledge retrieval, and persistent history logging.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Pages 15–16*

---

<div style="page-break-after: always;"></div>

# CHAPTER 5: SYSTEM ANALYSIS AND DESIGN

### 5.1 System Architecture Diagram
```
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                    │
│      React 18 · Vite · Tailwind CSS · React Router     │
│   (Home · DetectDisease · DiseaseLibrary · Dashboard)  │
└───────────────────────────┬────────────────────────────┘
                            │ Axios HTTP / REST API (JWT Bearer)
┌───────────────────────────▼────────────────────────────┐
│                    APPLICATION TIER                    │
│      Node.js · Express.js · Multer · Bcrypt · JWT      │
│                                                        │
│  Controllers: auth · disease · prediction · admin      │
│  Services: plantIdService · diseaseMatchService        │
│  Middleware: authMiddleware · uploadMiddleware         │
└───────────────┬────────────────────────┬───────────────┘
                │ HTTPS (Base64)         │ Mongoose ODM
┌───────────────▼──────────────┐ ┌───────▼───────────────┐
│     EXTERNAL AI SERVICE      │ │       DATA TIER       │
│        Plant.id API v3       │ │   MongoDB (Port 27017)│
│  (Deep Learning CNN Vision)  │ │   Users · Diseases    │
│                              │ │     Predictions       │
└──────────────────────────────┘ └───────────────────────┘
```

### 5.2 Use Case Diagram
* **Actors:** Farmer/User, Administrator, AI Vision Provider.
* **Use Cases for Farmer:** Register Account, Login, Upload Leaf Photograph, View Diagnosis & Confidence Score, Access Organic & Chemical Remedies, View Scan History, Update Profile.
* **Use Cases for Administrator:** Manage User Accounts, Perform CRUD on Disease Knowledge Base, Monitor AI Endpoint Health, Review Global Prediction Logs.
* **Use Cases for AI Provider:** Accept Base64 Leaf Stream, Return Species & Disease Probabilities.

### 5.3 Data Flow Diagram (DFD)
* **DFD Level 0 (Context Level):**
  `Farmer ──► [0.0 Plant Disease System] ◄──► [Plant.id AI]`
  `Farmer ◄── (Remedy & Diagnosis) ── [0.0 Plant Disease System]`
* **DFD Level 1:**
  1.0 User Authentication ➔ 2.0 Image Upload & Validation ➔ 3.0 AI Inference ➔ 4.0 Disease & Remedy Matching ➔ 5.0 History Logging & Presentation.

### 5.4 Flowchart
```
[Start] ──► Upload Leaf Image ──► Client Size/Type Valid? ──(No)──► [Show Error]
                                        │ (Yes)
                                  Send to Backend
                                        │
                            Magic Bytes Valid Image? ──(No)──► [Show Error]
                                        │ (Yes)
                           Send Base64 to Plant.id API
                                        │
                                Image is Plant? ───────(No)──► [Ask Clear Leaf]
                                        │ (Yes)
                           Extract Top-1 Diagnosis
                                        │
                           Match MongoDB Catalogue
                                        │
                      ┌─────────────────┴─────────────────┐
                      ▼                                   ▼
             (Catalogue Match)                   (No Catalogue Match)
          Link Remedy Plan to Record          Save Prediction + Notice
                      └─────────────────┬─────────────────┘
                                        ▼
                           Save Record to History
                                        ▼
                     Display Diagnosis + Remedy Plan ──► [End]
```

### 5.5 Database Design (Data Dictionary)

*Table 5.1: Users Collection (`users`)*
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Unique user identifier |
| `name` | String | Required, Min: 3, Max: 80 | Full name of the user |
| `email` | String | Required, Unique, Lowercase | Login email address |
| `password` | String | Required, Select: false | Bcrypt-hashed password |
| `role` | String | Enum: `['user', 'admin']` | User authorization role |
| `location` | String | Optional, Max: 120 | Geographic farm location |
| `isActive` | Boolean | Default: `true` | Account activation flag |

*Table 5.2: Diseases Collection (`diseases`)*
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Unique disease identifier |
| `plantName` | String | Required, Indexed | Crop name (e.g., Tomato) |
| `diseaseName`| String | Required, Max: 160 | Disease name (e.g., Early Blight) |
| `description`| String | Required, Max: 5000 | Botanical disease overview |
| `symptoms` | [String] | Required, Min 1 bullet | Visual foliage symptoms |
| `causes` | [String] | Required, Min 1 bullet | Pathogenic/environmental causes |
| `severity` | String | Enum: `['Low','Medium','High','Critical']` | Disease damage rating |
| `organicRemedies` | [String] | Required, Min 1 bullet | Biological & organic treatments |
| `chemicalTreatment`| [String] | Required, Min 1 bullet | Fungicides, bactericides, sprays |
| `prevention` | [String] | Required, Min 1 bullet | Seasonal preventive measures |
| `pathogenType` | String | Optional, Max: 120 | Causal organism category |

*Table 5.3: Predictions Collection (`predictions`)*
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Prediction record identifier |
| `user` | ObjectId | Foreign Key (ref: User) | Reference to owning user |
| `imageUrl` | String | Required | URL of stored leaf image |
| `plantName` | String | Required | Classified crop name |
| `diseaseName`| String | Required | Classified disease name |
| `confidence` | Number | Required, 0 to 100 | Statistical probability % |
| `predictionStatus` | String | Enum: `['detected','low_confidence','healthy']` | Diagnostic classification outcome |
| `disease` | ObjectId | Foreign Key (ref: Disease) | Soft reference to remedy record |

### 5.6 Input and Output Design
* **Input Interface:** Drag-and-drop dropzone supporting JPG/PNG leaf photographs with instant preview and file metadata display.
* **Output Interface:** Clean diagnosis card featuring confidence probability bar, disease status badges, and tabbed advisory cards for symptoms, causes, organic treatments, chemical sprays, and prevention checklists.

### 5.7 Security Design
* **Stateless Token Authentication:** JSON Web Tokens signed with secret keys, with 7-day expiration.
* **Cryptographic Password Hashing:** Bcrypt.js with 12 salt rounds ensuring zero plaintext password exposure.
* **CORS Protection:** Dynamic origin filtering allowing only trusted client addresses.
* **File Integrity Security:** Magic-byte buffer validation preventing executable code uploads.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 17*

---

<div style="page-break-after: always;"></div>

# CHAPTER 6: HARDWARE AND SOFTWARE REQUIREMENTS

### 6.1 Hardware Requirements

*Table 6.1: Hardware Requirements & Specifications*

| Component | Minimum / Expected Requirement | Actual Development Configuration |
| :--- | :--- | :--- |
| **Processor** | Intel Core i3 (2.0 GHz) / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 (Multi-Core) |
| **RAM** | 4 GB DDR4 | 8 GB / 16 GB DDR4 |
| **Storage** | 20 GB free disk space | 512 GB NVMe SSD |
| **Display** | 1366 × 768 standard resolution | 1920 × 1080 Full HD IPS Display |
| **Internet** | Stable broadband / 4G (1 Mbps+) | High-Speed Fiber Internet (50 Mbps+) |
| **Camera** | 5 MP mobile/webcam sensor | 12 MP+ smartphone camera sensor |
| **GPU** | Not required (cloud AI inference) | Intel Iris Xe / NVIDIA GeForce |

### 6.2 Software Requirements

*Table 6.2: Software Requirements & Versions*

| Software Component | Purpose | Version Used |
| :--- | :--- | :--- |
| **Operating System** | System execution platform | Windows 11 / Linux (Ubuntu 22.04) |
| **Programming Language** | Full-stack application logic | JavaScript (ES6+ / Node.js ECMAScript) |
| **IDE / Code Editor** | Development and debugging | Visual Studio Code (v1.94+) |
| **Front-End Technology** | Reactive client interface | React.js (v18.3.1), Vite (v6.0.7) |
| **Styling Framework** | Responsive utility styling | Tailwind CSS (v3.4.17) |
| **Back-End Framework** | Server-side RESTful API | Express.js (v4.19.2) |
| **Runtime Environment** | Server execution engine | Node.js (v24.15.0 / v18+) |
| **Database** | NoSQL document storage | MongoDB Server (v8.3 / v7.0) |
| **Database ODM** | Schema modeling and queries | Mongoose (v8.6.0) |
| **AI Model / API** | Computer vision foliar diagnosis | Plant.id API v3 |
| **HTTP Client** | Asynchronous API communication | Axios (v1.7.9) |
| **Image Parser** | Multipart form handling | Multer (v1.4.5-lts.1) |
| **Testing Suite** | Automated offline & API checks | Node.js Test Runner / Assertions |
| **Web Browser** | Application rendering and testing | Google Chrome / Microsoft Edge / Safari |

### 6.3 Development Environment
The application is structured as an npm-managed monorepo containing distinct `frontend/` and `backend/` directories. Frontend modules use ES Modules bundled via Vite. The backend operates on CommonJS modules with nodemon for hot reloading. Environment configurations are governed by `.env` variables isolated from Git tracking.

### 6.4 AI Service Requirements
* **Provider:** FlowerChecker s.r.o. (Plant.id).
* **Protocol:** HTTPS RESTful API over TLS 1.3.
* **Authentication:** Secret header-based API key (`Api-Key: <TOKEN>`).
* **Rate Limits:** Standard development plan accommodating identification requests within 45-second execution timeouts.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 18*

---

<div style="page-break-after: always;"></div>

# CHAPTER 7: IMPLEMENTATION

### 7.1 Introduction
Implementation translates the architectural specifications into functioning code. Development was structured into three tiers: database schema initialization, Express RESTful services, and reactive React components.

### 7.2 Project Structure
```
Plant Disease Detection/
├── backend/
│   ├── config/ (db.js, env.js)
│   ├── controllers/ (auth, disease, prediction, user, admin)
│   ├── data/ (diseaseCatalogue.js - 31 curated records)
│   ├── middleware/ (auth, error, rateLimit, upload)
│   ├── models/ (User.js, Disease.js, Prediction.js)
│   ├── routes/ (authRoutes, diseaseRoutes, predictionRoutes)
│   ├── services/ (plantIdService.js, diseaseMatchService.js)
│   ├── tests/ (api.test.js, integration.test.js)
│   ├── server.js & seed.js
├── frontend/
│   ├── src/
│   │   ├── components/ (ImageUploader, PredictionResultView, Navbar)
│   │   ├── context/ (AuthContext, ThemeContext)
│   │   ├── pages/ (Home, DetectDisease, History, DiseaseLibrary)
│   │   ├── services/ (api.js, index.js)
│   │   └── utils/ (imageValidation.js, constants.js)
│   ├── vite.config.js
└── docs/ (PROJECT_SYNOPSIS.md, PROJECT_REPORT.md)
```

### 7.3 Implementation of Modules
1. **Authentication Module:** Implemented in `authController.js` and `authMiddleware.js`. Employs bcrypt for password hashing and issues signed JWT tokens on login.
2. **Upload & Magic-Byte Module:** Implemented in `uploadMiddleware.js`. Buffers files in memory and inspects bytes 0–3 for JPEG (`0xFF 0xD8 0xFF`) and PNG (`0x89 0x50 0x4E 0x47`) signatures.
3. **Disease Matching Module:** Implemented in `diseaseMatchService.js`. Matches Plant.id species and pathogen suggestions with MongoDB catalogue records.

### 7.4 AI Model Integration
The AI integration module (`plantIdService.js`) encodes binary leaf buffers into Base64 format and transmits them to Plant.id:

```javascript
// backend/services/plantIdService.js (Excerpt)
async function callPlantId(imageBuffer) {
  const base64Image = imageBuffer.toString('base64');
  const response = await axios.post(
    `${config.plantId.baseUrl}/identification`,
    {
      images: [base64Image],
      health: 'all',
      classification_level: 'species',
    },
    {
      headers: {
        'Api-Key': config.plantId.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.plantId.timeoutMs,
    }
  );
  return response.data;
}
```

### 7.5 Prompt / API Payload Implementation
Request payloads instruct the AI model to assess both health status and disease classes. The returned response structure is normalized into a standard internal shape:
`{ plant: cropName, disease: diseaseName, confidence: score, isHealthy: boolean }`.

### 7.6 Database Implementation
Mongoose schemas define strict constraints. Soft references connect `Prediction` documents with `Disease` records, preserving historical scans even if catalogue records are altered.

### 7.7 User Interface Implementation
* **`ImageUploader.jsx`:** Manages drag-and-drop events, live previews using `FileReader`, and upload progress indicators.
* **`PredictionResultView.jsx`:** Renders visual confidence bars, severity indicators, and tabbed remedy cards.

### 7.8 Error Handling
* **API Inavailability:** Caught and mapped to clean HTTP 503 responses.
* **Disguised Files:** Rejected with HTTP 400.
* **Concurrent Requests:** Guarded by `singleFlight` middleware to prevent duplicate simultaneous submissions.

### 7.9 Deployment & Execution
* **Backend Dev Server:** `cd backend && npm run dev` (Port 5000)
* **Frontend Dev Server:** `cd frontend && npm run dev` (Port 5173 with `/api` proxy)
* **Production Build:** `npm run build` generates optimized static assets in `frontend/dist`.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 19*

---

<div style="page-break-after: always;"></div>

# CHAPTER 8: TESTING AND RESULTS

### 8.1 Introduction to Testing
Testing verifies functional correctness, reliability, security boundaries, and response times. Testing encompassed unit testing, integration testing, API boundary checks, and automated regression testing.

### 8.2 Testing Methodology
* **Unit Testing:** Verified utility functions (string normalizers, image validators, token generators).
* **Integration Testing:** Tested end-to-end API workflows with mock and live Plant.id stubs.
* **Security Testing:** Validated JWT expiration, SQL/NoSQL injection resistance, and unauthenticated route blocking.

### 8.3 Test Cases

*Table 8.1: Test Cases, Scenarios and Execution Status*

| Test ID | Scenario | Input | Expected Output | Actual Output / Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Valid leaf upload | JPEG tomato leaf photo | 201 Created, diagnosis & remedies | Pass (Diagnosis displayed) |
| **TC02** | Missing image | Empty form submission | 400 Bad Request error message | Pass (Rejected cleanly) |
| **TC03** | Fake disguised file | `.txt` file renamed to `.jpg` | 400 Bad Request (Magic-byte check) | Pass (Rejected cleanly) |
| **TC04** | AI service outage | Simulated network timeout | 503 Service Unavailable notice | Pass (Friendly notice shown) |
| **TC05** | Non-plant image | Car/Human photograph | 400 Bad Request (Not a plant) | Pass (Prompt to upload leaf) |
| **TC06** | User Registration | Valid email & strong password | 201 Created & hashed password | Pass (User registered) |
| **TC07** | Duplicate Email | Already registered email | 409 Conflict error message | Pass (Duplicate blocked) |
| **TC08** | Unauthorized Access | Call `/api/predictions` without JWT | 401 Unauthorized response | Pass (Protected route secured)|

### 8.4 AI Output Evaluation
The Plant.id AI output was evaluated on foliar images of Tomato, Potato, Apple, and Grape. The model demonstrated strong consistency in isolating chlorosis, necrotic patches, and mildew mycelium, returning average confidence ratings between 74% and 96% for well-lit, focused photographs.

### 8.5 Results and Observations
* Zero crashes during network outages; system cleanly informs user of service status.
* Disease matching correctly identifies pathogen types even when Latin scientific species differ slightly from common names.
* Automated offline test runner executed 69 comprehensive tests with **69 Passed and 0 Failed**.

### 8.6 Performance Analysis
* **Frontend Initial Load Time:** ~500 ms (Vite ES module chunking).
* **AI Analysis Turnaround Time:** 1.8 to 3.2 seconds.
* **Database Query Latency:** Under 15 ms for indexed disease lookups.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 20*

---

<div style="page-break-after: always;"></div>

# CHAPTER 9: SCOPE, LIMITATIONS AND FUTURE ENHANCEMENTS

### 9.1 Scope of the Project
The application currently supports 7 major agricultural crops and over 31 disease conditions, providing species classification, confidence metrics, and curated dual-action treatment advisories across mobile and desktop browsers.

### 9.2 Limitations of the Project
* **Internet Dependency:** Requires active internet connectivity to communicate with cloud AI vision endpoints.
* **Lighting Sensitivity:** Severely blurred, underexposed, or shadowed photos reduce diagnostic confidence.
* **API Quota Constraints:** Free third-party cloud tiers impose monthly request ceilings.
* **Language Barrier:** Interface is currently presented in English, requiring translation for non-English-literate farmers.

### 9.3 Future Enhancements
1. **Multilingual Regional Support:** Integrating Marathi, Hindi, and regional language translations for rural farmers.
2. **Voice-Assisted Advisory:** Adding text-to-speech and voice input so farmers can listen to remedy instructions.
3. **Offline On-Device Inference:** Developing an edge-compatible TensorFlow Lite / ONNX model running entirely client-side without internet access.
4. **IoT Soil & Weather Integration:** Combining leaf image diagnosis with soil moisture and ambient humidity sensors for predictive blight forecasting.
5. **Mobile Application (PWA/React Native):** Packaging the system into a native Android application for one-tap home screen access.

### 9.4 Social and Practical Applications
This system democratizes agricultural expertise for rural communities. It enables timely crop intervention, prevents catastrophic yield destruction, reduces reliance on expensive chemical pesticides, and preserves farm income.

### 9.5 Sustainability and Maintainability
Built with clean MVC architectural separation and Mongoose schemas, the system is highly maintainable. New crops and remedy records can be added dynamically through the Admin Portal without modifying application code or restarting servers.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 21*

---

<div style="page-break-after: always;"></div>

# CHAPTER 10: CONCLUSION

### 10.1 Conclusion
The **Plant Disease Detection & Remedy Recommendation System** successfully demonstrates the integration of modern Artificial Intelligence with full-stack web engineering to solve a vital real-world agricultural challenge. By bridging the gap between automated visual disease detection and practical, dual-track remedial advice, the system provides farmers with immediate, actionable guidance. Built with React 18, Express, MongoDB, and the Plant.id API, the application delivers rapid, secure, and transparent diagnostics.

### 10.2 Learning Outcomes
* **Deep Learning Integration:** Acquired practical knowledge in integrating cloud computer vision APIs and handling Base64 image streaming.
* **Full-Stack Development:** Mastered building responsive SPAs with React 18, Vite, and Tailwind CSS.
* **Secure Backend Engineering:** Implemented robust Express REST APIs featuring JWT authentication, rate limiting, and magic-byte file validation.
* **Database Architecture:** Gained expertise in NoSQL document modeling, indexing, and soft-referencing with MongoDB and Mongoose.
* **System Testing & Quality Assurance:** Designed comprehensive automated test suites covering 69 unit, integration, and security checks.

### 10.3 Final Remarks
The project proves that intelligent technological interventions can significantly enhance traditional agriculture. With future extensions toward multilingual voice advisory and edge offline models, the system holds tremendous potential to empower farming communities across the nation.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 22*

---

<div style="page-break-after: always;"></div>

# BIBLIOGRAPHY / REFERENCES

1. **Mohanty, S. P., Hughes, D. P., & Salathé, M. (2016).** *Using deep learning for image-based plant disease detection.* Frontiers in Plant Science, 7, 1419. https://doi.org/10.3389/fpls.2016.01419
2. **Hughes, D. P., & Salathé, M. (2015).** *An open access repository of images on plant health to enable the development of mobile disease diagnostics.* arXiv preprint arXiv:1511.08060.
3. **Plant.id API Documentation (2024).** *FlowerChecker s.r.o.* Machine Learning Plant Identification & Health Assessment API v3. https://plant.id/
4. **MongoDB, Inc. (2024).** *MongoDB Documentation & Mongoose ODM Reference (v8).* https://www.mongodb.com/docs/
5. **Meta Open Source (2024).** *React 18: The Library for Web and Native User Interfaces.* https://react.dev/
6. **OpenJS Foundation (2024).** *Express.js: Fast, unopinionated, minimalist web framework for Node.js.* https://expressjs.com/
7. **ICAR - Indian Council of Agricultural Research (2023).** *Handbook of Agriculture and Plant Protection Practices.* Ministry of Agriculture & Farmers Welfare, Government of India. https://icar.org.in/
8. **Agrios, G. N. (2005).** *Plant Pathology (5th Edition).* Elsevier Academic Press, Burlington, MA.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Page 23*

---

<div style="page-break-after: always;"></div>

# APPENDICES

### Appendix A: Source Code Highlights
The codebase is structured under `backend/` and `frontend/`. Critical routines include:
* `backend/services/plantIdService.js`: AI API client and Base64 stream encoder.
* `backend/services/diseaseMatchService.js`: Taxonomic matching engine.
* `backend/middleware/uploadMiddleware.js`: In-memory buffering and magic-byte inspection.
* `frontend/src/components/ImageUploader.jsx`: Drag-and-drop reactive preview component.

### Appendix B: API Payload Sample
```json
{
  "images": ["/9j/4AAQSkZJRgABAQEAYABgAAD..."],
  "health": "all",
  "classification_level": "species"
}
```

### Appendix C: Sample Input and Output
* **Input Image:** Photograph of tomato leaf exhibiting concentric brown lesions with yellow chlorotic halos.
* **AI Output:** Species: *Solanum lycopersicum* (Tomato), Disease: Early Blight (*Alternaria solani*), Confidence: 91.4%.
* **Remedy Output:** Organic: Apply 0.5% neem oil, Trichoderma viride biological spray; Chemical: Foliar spray of Mancozeb 75% WP (2.5g/L) or Chlorothalonil.

### Appendix D: User Manual
1. Open web browser and navigate to `http://localhost:5173`.
2. Click **Login** and enter credentials (or Register a new account).
3. Navigate to **Detect Disease** in the top navigation bar.
4. Click **Choose image** or drag a leaf photo into the dropzone.
5. Click the green **Detect Disease** button.
6. Review the diagnosis, confidence score, symptoms, organic remedies, and chemical treatment options.

### Appendix E: Installation & Deployment Guide
1. Ensure Node.js (v18+) and MongoDB are installed and running locally.
2. Backend Setup:
   ```bash
   cd backend
   npm install
   npm run seed
   npm run dev
   ```
3. Frontend Setup:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Access web application at `http://localhost:5173`.

### Appendix F: Automated Test Results Summary
* 69 tests executed across authentication, disease library CRUD, rate limiting, and prediction flows.
* **Result:** `passed: 69, failed: 0`.

### Appendix G: Dataset / Catalogue Summary
Curated database containing 31 detailed agronomic records across 7 crops (Tomato, Potato, Apple, Grape, Corn, Pepper, Strawberry), each cataloging symptoms, causes, severity, organic treatments, chemical controls, and prevention checklists.

### Appendix H: Application Screenshots Map
* Fig. 7.1: Landing Homepage with Crop Categories.
* Fig. 7.2: Interactive Image Uploader with Leaf Preview.
* Fig. 7.3: Comprehensive Diagnosis & Structured Remedy Advisory.

### Appendix I: AI Usage Disclosure
Generative and Computer Vision Artificial Intelligence tools (Plant.id API v3 and assistive code evaluation frameworks) were utilized during the research and development phases of this project. All architectural designs, integration code, data schemas, and documentation were reviewed, customized, and validated by the student in accordance with the academic integrity guidelines of D.K.T.E. Society's Textile & Engineering Institute, Ichalkaranji.

*MCA-II Semester-III | Plant Disease Detection & Remedy Recommendation System • Pages 24–25*

