# ShubhNivas: Project Analysis and Claude Master Prompt

Prepared from the `Housing_Society-integrated` repository on 26 November 2026. The implementation evidence below comes from its frontend, backend, Flutter apps, migrations, and checked-in assets. Code presence confirms that a workflow exists in the repository; live behavior still depends on deployment, database migrations, configured permissions, society data, and integrations.

## A. Project analysis report

### Product at a glance

ShubhNivas is a housing-society management platform for Indian residential communities. The repository contains a React/Vite administrative dashboard, a Node/Express/PostgreSQL backend, and a Flutter application with resident and security-guard experiences. The backend is organized into domain modules and database migrations; the dashboard uses protected routes and granular permissions. The resident app has dedicated screens and API clients for resident services.

**Sales positioning supported by the implementation:** one platform can organize community administration, resident services, finance, gate operations, staff, vendors, procurement, amenities, helpdesk, reports, communications, and community activities. One mobile app offers separate role-based resident and security logins and distinct workflows; administrators use the web dashboard. Present this as an integrated operational experience, not a promise that every society must use every module or that every role can access every feature.

### Module status inventory

Status terms: **Implemented in code** means a frontend/app workflow and backend/API/database support were located. It does not imply that a particular deployment has been configured or populated. **Partially implemented / verify in demo** means a related workflow exists but the exact requested capability is not fully evidenced. **Not found** means do not market it as an existing feature based on this repository.

| Area | Evidence-based status | Verified functionality and customer benefit |
|---|---|---|
| Admin dashboard and overview | Implemented in code | Dashboard routes, operational summary/report modules and data-backed views provide administrators a starting point for society operations. Do not invent live KPI values. |
| Resident, user and unit management | Implemented in code | Dedicated residents, users, society, tower, floor, unit, verification, ownership, and move-in/move-out pages with protected routes. Supports organized records and role-scoped access. |
| Staff and security staff | Implemented in code | Staff directory, staff documents, attendance, tasks, patrols, incidents, emergencies, and security audit modules are present. Individual security staff records include employee codes. |
| Guard sign-in and identity | Implemented in code | Shared security-head account flow requires the individual active guard employee code; server returns the selected staff identity/profile. This helps attribute a session to the right guard. |
| Guard selfie verification | Implemented in code; verify device/deployment in demo | Backend extracts a face descriptor from the saved profile photo and request selfie, compares them using a configurable bounded distance threshold, records login outcome, and clears request selfie bytes/descriptors. The code comments and cleanup flow say selfies are not persisted/cached. Describe as an additional identity check, never as perfect or guaranteed fraud prevention. |
| Visitor and gate workflows | Implemented in code | Security Guard login in the shared mobile app includes visitor registration/check-in screens; backend implements visitor profiles, invites, passes, arrival, entry/exit and gate events. Supports searchable/structured gate operations. |
| Shift scheduling | Implemented in code; verify operational rules in demo | Shift and roster modules exist in admin/backend, and a migration changes the roster index to allow multiple staff/date rows. Do not claim automatic coverage optimization or payroll. |
| Vendor, documents and contracts | Implemented in code | Vendor list/detail/forms, contacts, documents, contracts, bank details and status workflows are represented in dashboard/backend modules. Helps centralize provider information and records. |
| Procurement, requests, quotations and orders | Implemented in code | Purchase requests, RFQs/quotations, purchase orders and approvals have dashboard routes and backend modules. Show a real workflow screenshot; do not claim every society's approval policy is configured. |
| Parking and vehicles | Implemented in code | Parking areas, slots, allocations, vehicles and gate visits have dashboard routes and report support. |
| Amenities and bookings | Implemented in code | Admin amenity/slot/booking pages and resident amenity screens/API are present; backend includes booking services and concurrency coverage. Helps expose booking options and organize shared facilities. |
| Helpdesk, tickets and SLA | Implemented in code | Resident complaint/request screens and admin ticket/setup modules, categories, priorities, timers and reports exist. Supports issue visibility and resolution tracking; do not promise response times. |
| Finance and maintenance | Implemented in code | Finance pages cover accounts, billing, invoices, payments, ledgers, journals, taxes, reconciliation and exports; resident finance screens expose bills/payment workflows. Actual integrations and society setup must be demonstrated. |
| Reports and exports | Implemented in code | Report center supports report endpoints and PDF/Excel (`xlsx`) exports; PDF generation suppresses UUID-like identifiers, produces readable labels and attempts to include the society logo where a valid uploaded logo exists. |
| Notices, communications, notifications | Implemented in code | Notices, notification center, templates, preferences, broadcasts and delivery reports have dashboard/backend modules; resident app displays society notices and bell notifications. Delivery channels depend on configuration. |
| Advertisement management | Implemented in code; demo with configured image/storage | Admin create/edit/delete/activate and resident ad delivery exist. Advertisements follow their active date window and resident dismissals are persisted so a dismissed ad does not reappear. Total view tracking is available for admin reporting; there is no per-resident display limit. |
| Kids Activities | Implemented in code; verify current deployment/migrations | Admin creates and edits activities with date, start/end time, age range, optional prize, registration requirement and deadline; residents see eligible activities and can submit child participation; admin can review registrations/children. The deadline controls registration, while the resident activity card is intended to remain until scheduled end time. |
| RBAC and permissions | Implemented in code | Protected dashboard routes check permission codes; role/permission management and seeded module permission migrations are present. Describe as role-based access control without claiming a specific compliance certification. |
| Resident app profile and recovery | Implemented in code | Resident profile/edit/password screens and resident-specific password recovery flows exist. Resident-only web sign-in is rejected server-side; resident access is app-oriented. |
| Resident service breadth | Implemented in code | Resident app directories/screens include dashboard, bills, visitors, complaints/help, amenities, profile, notices/notifications, advertisements, and Kids Activities. Confirm the demo backend has active records for shown screens. |
| Security Guard experience in the shared mobile app | Implemented in code | The Flutter app routes Security Guard accounts to a guard dashboard with profile, visitor registration/list, deliveries and gate log. Face verification is part of guard sign-in, not evidence of face verification for every visitor. |

### One mobile app, separate role logins, role-based access

The repository contains **one Flutter mobile application** with a login screen that lets the user choose Resident or Security Guard sign-in. The authenticated role routes the user to a different home/dashboard and corresponding app workflows. The administrator dashboard is a separate web experience. Do not describe this as separate resident and guard apps, and do not imply that a guard sees every resident feature.

- **Resident login/app access:** resident home dashboard, society/unit and maintenance/bill information, resident complaints/helpdesk requests and their statuses, visitor-related services, amenity browsing/booking, announcements and bell notifications, advertisement cards, Kids Activities and registration when enabled, profile and password management, and other resident app services evidenced in the Flutter features.
- **Security Guard login/app access:** shared security account credentials plus individual employee code and sign-in selfie verification; guard dashboard and shift assignments; visitor registration and visitor/pass list; gate log; delivery workflows; and helpdesk tickets assigned to the guard, including ticket details and permitted status actions. These are guard-specific functions and assigned ticket work; do not claim guards can submit resident complaints, use resident bill/payment features, book amenities as a resident, manage resident advertisements, or access all resident/admin functions.
- **Administrator web access:** web dashboard modules are protected by role permissions. Routes and backend operations use permission codes, and the role-management module assigns/removes roles and permissions. Describe this as role-based access control (RBAC) and role-appropriate access, not as an audit/compliance certification.

**Verified product distinction:** a single mobile app adapts its destination and features to the selected login/account role; residents and guards use different role-specific workflows, while administrators use the web dashboard. This provides a consistent mobile app distribution with access aligned to each person’s responsibilities.

### Verified differentiators for the sales story

1. **Guard sign-in tied to an individual staff identity:** shared security credentials can be paired with an employee code selecting a specific active security guard and profile. This gives society teams clearer attribution.
2. **Selfie-to-profile check at guard login:** the backend compares a request selfie against the stored guard profile photograph. Request selfie bytes and derived selfie descriptors are cleared after verification; do not claim the selfie is retained as attendance evidence.
3. **Connected resident, admin and gate journeys:** visitor invites/passes, resident-facing notifications, guard flows, and admin records coexist in the same product repository.
4. **Operational workflow breadth:** finance, vendor records/contracts, procurement/quotations/orders, amenities, parking, helpdesk/SLA and reports are available alongside resident and security workflows.
5. **Community engagement workflows:** configurable resident advertisements and Kids Activities (including age range, deadline and participation) provide focused modules beyond basic records.
6. **Readable, branded reports:** the PDF report controller includes human-readable labels, filters UUID-like identifiers, and can use an uploaded society logo. Excel output is supported. Do not promise every report has data in every deployment.
7. **One mobile app with different role-based logins:** a shared Flutter app routes resident and security users into distinct experiences. The resident experience includes resident services; the guard experience focuses on shifts, visitors, gate logs, deliveries and assigned helpdesk tickets. The administrator web dashboard has a separate role/permission-protected experience.

### Company facts and missing proof points

The repository materials found for this task identify the company as **Ambi-Elite Pvt. Ltd.** but do not establish a verified company history, vision/mission statement, leadership name, director photograph, phone number, email, public website, customer count, certifications, testimonials, or implementation/support guarantees. Use the company name only as confirmed. The copy below presents a proposed product-purpose statement, not a historical claim about the company. Keep director and contact details editable placeholders pending owner-provided facts.

### Asset inventory

| Asset | Exact repository path | Intended page | Status / use |
|---|---|---|---|
| ShubhNivas logo mark | `C:\Users\SURESH\OneDrive\Desktop\ambi-eli\Housing_Society-integrated\societyapp\assets\images\logo1.png` | 1, 3, 10; small footer mark | Available; transparent building/community mark, no textual wordmark apparent. Pair with typeset “ShubhNivas”. |
| Residential community hero photo | `C:\Users\SURESH\OneDrive\Desktop\ambi-eli\Housing_Society-integrated\societyapp\assets\images\shubhnivas_residence.jpg` | 1, 2, 10 | Available; premium residential complex image. Suitable for marketing visual, not an app screenshot. |
| Ambi-Elite login background | `C:\Users\SURESH\OneDrive\Desktop\ambi-eli\Housing_Society-integrated\frontend\src\assets\ambi-elite-login-background.png` | Optional page 5/10 background | Available; building/blue graphic login background. Not a verified corporate logo. Use only as a subtle visual, not as logo. |
| Admin / resident / guard product screenshots | No saved screenshot asset found in repository search | 3, 4, 6 | Missing as standalone files. Request/export fresh screenshots from a configured demo, or create clearly labeled replaceable UI mockup frames. Do not present invented mockups as actual screenshots. |
| Ambi-Elite company logo | No dedicated company logo found | 1, 5, 10 | Missing; provide a text-only company name treatment or replaceable logo placeholder. |
| Director photo/name/qualification | Not found | 5 | Missing; use “Director name / designation / verified profile to be supplied” and an empty portrait placeholder. |
| Two team portraits/names | Not found | 5 | Missing; use the two required dummy portrait placeholders and editable “Name / Role” captions. |
| Visitor, ad, kids, guard verification, amenity and report screenshots | Not found as repository image files | 4, 6 | Missing; use approved runtime screenshots supplied separately by the owner or labeled mockup placeholders. |
| Phone, email, website, QR destination | Not found as verified marketing contacts | 10 | Missing; use explicit replacement placeholders. Do not create a working QR code pointing to an assumed URL. |

### Competitor research and comparison notes

Research checked official product/feature pages on 26 November 2026. “Publicly marketed” below means the vendor describes the feature on an official page. It does not mean the precise implementation matches ShubhNivas. “Not publicly verified” means no reliable claim is made either way.

Official source references:

- MyGate apartment management system: https://mygate.com/apartment-management-system/
- MyGate FAQs (amenities, staff management, platform overview): https://mygate.com/faqs/
- MyGate SmartEye staff verification help page: https://adminfaq.mygate.com/articles/129223-how-does-mygate-ensure-all-society-staff-entries-are-verified-to-avoid-any-proxies
- NoBrokerHood features: https://www.nobrokerhood.com/solutions/nobrokerhood-features
- NoBrokerHood visitor management: https://www.nobrokerhood.com/solutions/visitor-management-system
- NoBrokerHood helpdesk overview (official blog): https://www.nobrokerhood.com/blog/step-by-step-guide-to-helpdesk/
- NoBrokerHood TouchlessEntry post (historical feature description): https://www.nobrokerhood.com/blog/its-time-your-building-society-got-a-security-upgrade-nobrokerhoods-new-launch-touchlessentry/

| Feature | ShubhNivas implementation | MyGate public evidence | NoBrokerHood public evidence | Safe conclusion for the brochure |
|---|---|---|---|---|
| Resident/society management | Implemented: residents, units, user roles, app | Broad apartment/community management marketed | Broad community/society features marketed | All three publicly position for society operations; feature scope varies by plan/configuration. |
| Visitor management | Implemented: invites, passes, guard registration, entry/exit/gate events | Visitor and gate management marketed | Visitor management, pre-approval and visitor records marketed | Common category; ShubhNivas demo can emphasize its connected resident/guard/admin workflow. |
| Helpdesk | Implemented: complaint/ticket/status/SLA modules | Helpdesk/complaints marketed | Helpdesk ticketing marketed | Comparable category; do not claim superiority. |
| Amenity booking | Implemented admin slots/bookings and resident booking | Amenity booking marketed in FAQs and product page | Free/paid amenity management and configurable slots marketed | Common category; use ShubhNivas screenshot to demonstrate its own flow. |
| Guard/profile face verification | Implemented at guard login, matching guard selfie to stored profile image | Official SmartEye material describes photos for staff entry/exit and profile comparison; different workflow | Historical official TouchlessEntry article describes face scan for domestic/service staff entry; different workflow and older source | Do not claim competitors lack face checks. State the precise ShubhNivas use case and invite side-by-side demo. |
| Individual employee code with shared Security Head login | Explicitly implemented for security login and selected staff identity | Not publicly verified from sources checked | Not publicly verified from sources checked | A specific ShubhNivas workflow; comparison is “not publicly verified”, not “competitors lack it”. |
| Multi-shift scheduling | ShubhNivas has shift/roster modules; multiple roster rows supported by schema/index behavior | Staff management is marketed; exact guard roster workflow not verified | Staff/security management is marketed; exact multiple-shift workflow not verified | Demo actual roster screens before making a stronger comparative claim. |
| Advertisement management with resident dismissal | Implemented: admin ads, date window, view tracking and persisted dismissal | Not publicly verified as equivalent resident home-screen ad campaign controls | Not publicly verified as equivalent resident home-screen ad campaign controls | A visible ShubhNivas module; say “purpose-built advertisement controls in this platform,” not competitor absence. |
| Kids activities with age/deadline/participant form | Implemented as Kids Activities module | General community events/engagement may exist; exact age-gated child registration workflow not verified | Events/community features may exist; exact age-gated child registration workflow not verified | Describe the exact ShubhNivas activity-registration workflow; mark competitor workflow “not publicly verified”. |
| Vendor management | Implemented vendor records, documents, contracts and contacts | Vendor management is listed among platform areas | Vendor management is referenced in feature material | Similar broad category; show ShubhNivas contracts/documents workflow in demo. |
| Procurement / RFQ / quotation / purchase orders | Implemented request, quotations/RFQs, orders and approvals | Accounting/vendor/operations broad coverage; equivalent procurement workflow not confirmed in checked material | Purchase request/order is referenced in role dashboard feature page; quotation/RFQ details not fully verified | Say ShubhNivas includes these implemented workflow screens; avoid exclusivity. |
| Finance, maintenance and accounting | Implemented finance suite, resident bill/payment paths and reports | Accounting, maintenance billing, payments and reports marketed | Utility payment/accounting-related services referenced; exact parity depends on product config | Scope differs. Compare by required workflow in a live demo, not checkmarks alone. |
| Reports and PDF/Excel export | Implemented report center; PDF/XLSX export support; society-logo support in PDF generation | Reports/accounting reports marketed | Reports/visitor reports marketed in official pages | Similar reporting category; ShubhNivas supports readable exports; do not imply competitor exports lack branding or readability. |
| Role-based admin access | Implemented permission-protected routes and role permissions | Role-specific platform/admin functions described in official material | Multiple admin types and responsibilities listed | All describe differentiated access in some form; implementation details should be demo-verified. |

## B. Complete page-wise sales content

Use the following copy verbatim or with only fit-and-finish edits. Do not add unverified statistics, client names, testimonials, certifications, guarantees, pricing, or claims of market leadership.

### Page 1 — Cover

**Headline:** Smarter Society Management. Better Community Living.

**Supporting line:** One connected platform for the people and operations that keep a residential community moving.

**Intro:** ShubhNivas brings society administrators, residents and security teams into a shared digital experience for everyday community operations. From resident records and visitor workflows to amenities, helpdesk, finance, reports and community activities, it helps make important information easier to organize and access.

**Brand line:** ShubhNivas | Housing Society Management Platform

**Company:** Ambi-Elite Pvt. Ltd.

**Visual caption:** A connected community begins with clearer everyday operations.

**Close:** Your society. Better connected.

### Page 2 — The problem and our solution

**Headline:** Society operations deserve more than scattered records.

**Tagline:** Replace avoidable coordination friction with a more organized digital experience.

**Intro:** A residential community runs on many small decisions and handoffs. When visitor logs, resident details, maintenance updates, complaints, staff information and committee records live in separate places, it takes extra effort to find the latest information and keep everyone aligned.

**Section: When processes are disconnected**

- **Manual records:** Registers and spreadsheets can be hard to keep consistent and quick to search.
- **Scattered communication:** Residents may miss an update when announcements rely on disconnected channels.
- **Gate coordination:** Visitor information and resident decisions need to move between the gate and the home.
- **Maintenance follow-up:** Requests can require repeated calls when ownership and status are not easy to see.
- **People and provider records:** Staff, vendors, documents and contracts can be difficult to track across folders.
- **Reports under time pressure:** Preparing a clear view of operations can take manual consolidation.

**Section: A more connected way with ShubhNivas**

ShubhNivas gives authorized teams dedicated modules for residents, units, staff, vendors, procurement, visitors, amenities, helpdesk, finance, communications and reports. Residents use the app to access society services and updates; security teams use guard workflows for visitor activity; administrators manage records through permission-aware dashboard pages.

**Before / after table:**

| Disconnected approach | With ShubhNivas |
|---|---|
| Information spread across registers and files | Society records organized in dedicated modules |
| Repeated status follow-ups | Ticket and workflow status views |
| Visitor coordination by phone and paper | Digital invite, pass and gate-event workflows |
| Separate channels for resident updates | Notices and app notifications in a resident experience |
| Manual report assembly | Filtered reports with PDF/Excel export options |

**Highlighted statement:** Digital society management is not just about moving forms online. It is about making everyday information easier to find, share and act on.

**Visual captions:** “From fragmented handoffs” / “To organized workflows and shared visibility.”

**Close:** Start with the operations that matter most to your community.

### Page 3 — Introducing ShubhNivas

**Headline:** One platform. Three connected experiences.

**Tagline:** Built around the day-to-day work of a residential society.

**Intro:** ShubhNivas is a housing society management platform from Ambi-Elite Pvt. Ltd. Its web dashboard and single mobile app—configured with distinct Resident and Security Guard login modes—address different responsibilities while connecting core society records and operational workflows.

**What it is:** A modular digital workspace for housing societies and residential communities to manage administrative records, resident-facing services, gate operations and recurring community tasks.

**Why it exists:** Society teams coordinate people, property, services and communication every day. ShubhNivas brings these activities into structured modules so authorized users can work with clearer records and residents can reach relevant services through an app.

**How access works:** ShubhNivas uses one mobile app with a Resident or Security Guard login choice. After sign-in, each role sees its own home screen and permitted workflows. Administrators work in the separate web dashboard, where role permissions control access to modules. It is one mobile app with distinct logins and experiences, not one unrestricted screen shared by every user.

**Who it serves:**

- **Administrators and committee members:** Manage society records, people, workflows, permissions and reports from the dashboard.
- **Residents:** View society information, maintenance, notices, amenities, helpdesk services and community updates in the app.
- **Security teams:** Use dedicated guard flows for identity-based sign-in, visitor registration and gate-related tasks.

**Highlighted statement:** ShubhNivas is designed to bring everyday society operations into one connected experience.

**Image caption:** Three role-based experiences, connected around one residential community.

**Close:** A clearer view for administrators. Convenient access for residents. Focused workflows for security teams.

### Page 4 — Three connected experiences

**Headline:** The right tools for each role in the community.

**Tagline:** Purposeful views for administration, resident services and gate operations.

**Intro:** ShubhNivas organizes common society responsibilities into dedicated modules. Access is permission-aware, and each user experience is shaped around the work that role needs to perform.

**A. Admin Dashboard — Organize society operations**

Manage residents, users, units and verification; keep staff profiles and documents organized; maintain vendor records, contacts, contracts and documents; run purchase requests, quotations, orders and approvals; manage parking, vehicles, visitor records, amenities and bookings; track helpdesk tickets and SLA timers; work with finance and maintenance records; publish notices, advertisements and Kids Activities; review reports and export PDF or Excel files.

**Benefit:** Give authorized administrators a structured place to review records, follow operational work and prepare information for committee decisions.

**B. Resident Application — Put useful services within reach**

Residents can access the home dashboard, society and unit information, maintenance and bill details, announcements and notifications, amenity booking, visitor-related services, complaints/helpdesk, profile and password controls, advertisements, and Kids Activities registration where the activity requires it.

**Benefit:** Make common society information and requests easier to access without relying on a resident to find the right office contact first.

**C. One Mobile App, Different Role Logins — Make access role-appropriate**

Residents and security guards use the same Flutter mobile app distribution but select different login modes. The app routes each authenticated account to its role-specific home screen and features. Administrators use the separate web dashboard. Role-based access keeps workflows aligned with each account’s responsibilities; it does not give every role access to every feature.

**Resident experience:** Residents can view society/unit and maintenance/bill information; raise and follow their complaints/helpdesk requests; access visitor services, amenities and bookings; read notices and bell notifications; see advertisements and Kids Activities; register children when the activity requires it; and manage their profile/password.

**Security Guard experience:** Guards can use employee-code-based identity and selfie verification at sign-in, view their shift assignments, register visitors, review visitor/pass information, update gate logs and delivery workflows, and review/update helpdesk tickets assigned to them using the allowed ticket actions. The repository does not show guards using resident bill/payment, amenity-booking, advertisement-management or all resident features, so do not claim that they do.

**Administrator experience:** Administrators use the separate permission-aware web dashboard to manage society records and operational modules.

**Image captions:** “Admin dashboard: manage the operational record.” / “Resident login: services and updates in the mobile app.” / “Security Guard login: visitor, gate and assigned-ticket workflows in the same mobile app.”

**Close:** Different responsibilities. A more connected community workflow.

### Page 5 — About Ambi-Elite Pvt. Ltd.

**Headline:** Built by Ambi-Elite Pvt. Ltd.

**Tagline:** Practical digital experiences for the everyday needs of residential communities.

**Intro:** Ambi-Elite Pvt. Ltd. is the company behind ShubhNivas. The platform brings together administrative, resident and security workflows for housing societies in India. Its product purpose is to help communities organize routine operations through connected digital tools.

**Purpose:** Help society teams and residents work with clearer information and more organized everyday processes.

**Vision statement (proposed marketing copy; confirm with company before publication):** A future where every residential community can manage its everyday needs through accessible, connected digital experiences.

**Mission statement (proposed marketing copy; confirm with company before publication):** Build practical software that helps housing societies coordinate administration, resident services and security workflows with greater clarity.

**Why ShubhNivas:** The product brings multiple society functions together in one platform and provides role-specific experiences for administrators, residents and security teams.

**Leadership block:**

- **Director:** [Insert verified director name]
- **Designation:** [Insert verified designation]
- **Introduction:** [Insert an owner-approved professional biography and verified qualifications/experience. Do not publish this placeholder as a fact.]
- **Portrait:** [Replaceable director portrait placeholder]

**Team hierarchy below director portrait — required visual:**

```text
                    DIRECTOR
                       |
                 -------------
                 |           |
            DUMMY IMAGE 1  DUMMY IMAGE 2
             Name / Role   Name / Role
```

Keep the two dummy portraits separate and replaceable; use no fabricated names or job titles.

**Image captions:** “Ambi-Elite Pvt. Ltd.” / “Leadership and team details to be supplied and verified.”

**Close:** A product shaped around the everyday operations of residential communities.

### Page 6 — What makes ShubhNivas different?

**Headline:** Differentiators you can see in a live workflow.

**Tagline:** Specific tools for the practical details of community operations.

**Intro:** A useful platform is defined by how it handles real tasks. ShubhNivas includes focused workflows for security identity, staff scheduling, community participation, resident communication and operational records.

**1. Guard selfie verification at sign-in**

**What it does:** Checks a guard’s sign-in selfie against the saved profile photograph selected through the employee code.

**Why it matters:** It adds an identity check to the guard sign-in workflow and helps the system associate the session with the selected staff profile.

**Customer benefit:** A more attributable sign-in process for the security team. The request selfie is used for verification and is not stored by this verification flow. Face matching is an additional check, not a guarantee of identity or fraud prevention.

**2. Individual employee identification with shared security credentials**

**What it does:** The shared Security Head account can require an individual active guard employee code; the selected staff record supplies the guard’s identity and profile.

**Why it matters:** Shared account access does not have to erase who is using the guard workflow.

**Customer benefit:** Clearer staff attribution in the security sign-in experience.

**3. Multiple shift and roster management**

**What it does:** Provides shift and roster administration modules for staff scheduling.

**Why it matters:** Security deployment changes across days and time periods need an organized place to be recorded.

**Customer benefit:** A more structured view of assigned shifts. Demonstrate the exact roster workflow; do not claim automatic optimization.

**4. Resident-facing advertisement controls**

**What it does:** Administrators can create, schedule, activate, edit and remove advertisements. Resident delivery respects the active date window and saved dismissal state; total views are tracked for the admin table without limiting views per resident.

**Why it matters:** Society communications and offers can be managed with visible controls rather than treated as a one-off image upload.

**Customer benefit:** A configurable way to present relevant banners in the resident app, with total view tracking for administrators.

**5. Kids Activities with age and registration details**

**What it does:** Administrators can create activities with dates, start/end times, age ranges, optional prizes, a registration requirement and deadline; residents can submit participating children when registration is enabled.

**Why it matters:** Event information and participant details can be organized around one activity record.

**Customer benefit:** Easier coordination of family participation and age-appropriate registration.

**6. Readable PDF and Excel reports**

**What it does:** Report modules support PDF and spreadsheet exports; generated PDFs use readable labels and can include a society logo when configured.

**Why it matters:** Committee discussions and operational reviews need information that can be shared and understood.

**Customer benefit:** Practical exports for review and record keeping. Results depend on the selected report, date range and available society data.

**7. Connected operating modules**

**What it does:** Brings resident records, vendors/contracts, procurement, amenities, parking, tickets, communications and reports into role-protected modules.

**Why it matters:** Routine work often crosses multiple teams and records.

**Customer benefit:** A shared platform to demonstrate and evaluate against the society’s own operating requirements.

**Three callouts:** “Identity-aware guard sign-in” / “Community activities with registration” / “Society operations and resident services together.”

**Distinctive combination (avoid claiming exclusivity):** ShubhNivas brings individual guard identification by employee code and profile-photo selfie verification together with role-specific resident/guard experiences inside one mobile app, assigned helpdesk-ticket workflows for guards, and permission-managed administration on the web. The value is this combination of verified workflows; do not say no competitor offers similar functionality.

**Close:** See the workflow in action, then decide how it fits your society.

### Page 7 — Competitor comparison

**Headline:** Compare the workflows that matter to your society.

**Tagline:** A fair comparison starts with evidence—and a product demonstration.

**Intro:** Established platforms such as MyGate and NoBrokerHood publicly describe broad society and visitor-management capabilities. ShubhNivas also covers multiple society operations and includes focused workflows for guard employee identity, Kids Activities and resident-facing advertisements. Public material does not always reveal the exact implementation, plan availability or configuration, so this comparison distinguishes marketed categories from details that are not publicly verified.

**Comparison key:** “Publicly marketed” means an official source describes the broad feature. “Not publicly verified” is not a claim that the competitor lacks it. Confirm exact scope, plan, integrations and workflow in a vendor demonstration.

| Feature | ShubhNivas | MyGate | NoBrokerHood |
|---|---|---|---|
| Resident and society management | Implemented in dashboard/app | Publicly marketed | Publicly marketed |
| Visitor management | Invites, passes, guard registration and gate events implemented | Publicly marketed | Publicly marketed |
| Helpdesk / complaints | Resident complaint and admin tickets/SLA implemented | Publicly marketed | Publicly marketed |
| Amenity booking | Admin slots/bookings and resident app implemented | Publicly marketed | Publicly marketed |
| Face/photo verification | Guard login selfie compared with saved guard profile | Staff photo/profile checks described in SmartEye material; different workflow | Face-scan staff entry described in a historical TouchlessEntry post; different workflow |
| Guard employee code paired with shared Security Head account | Implemented; individual staff selected by code | Not publicly verified in sources checked | Not publicly verified in sources checked |
| Multiple security shifts/rosters | Shift and roster modules implemented; demonstrate exact rules | Exact multiple-guard shift workflow not publicly verified | Exact multiple-guard shift workflow not publicly verified |
| Admin ad campaigns with resident dismissal and view tracking | Implemented | Equivalent workflow not publicly verified | Equivalent workflow not publicly verified |
| Kids activity age range/deadline/child registration | Implemented | Equivalent workflow not publicly verified | Equivalent workflow not publicly verified |
| Vendor records/contracts | Implemented | Vendor management publicly referenced | Vendor management publicly referenced |
| Procurement requests/quotations/orders | Implemented | Equivalent procurement detail not confirmed in sources checked | Purchase requests/orders referenced; exact RFQ/quotation scope not fully verified |
| Finance and maintenance | Finance, bills and payment paths implemented | Accounting and maintenance billing publicly marketed | Utility/finance-related services referenced; exact parity depends on configuration |
| PDF/Excel reports | PDF/XLSX exports implemented, society-logo support in PDF generation | Reports publicly marketed; exact export presentation may vary | Reports publicly marketed; exact export presentation may vary |
| Role-based administration | Permission-protected modules implemented | Role-specific administration publicly described | Multiple admin types and responsibilities publicly described |

**Why consider ShubhNivas when other established platforms are available?**

Choose by workflow fit, not by the length of a feature list. ShubhNivas offers an integrated set of admin, resident and guard experiences, with specific implemented flows for employee-code-based guard identity, guard selfie verification at sign-in, configurable resident advertisements, Kids Activities registration, and operational reports. A society can use a demonstration to assess these workflows against its own committee, finance, gate, vendor and resident-service needs. Competitor products also cover many core society functions; compare the actual configuration and operating process before making a decision.

**Research notes and sources:**

- MyGate apartment management system: https://mygate.com/apartment-management-system/
- MyGate FAQs: https://mygate.com/faqs/
- MyGate SmartEye staff-photo verification: https://adminfaq.mygate.com/articles/129223-how-does-mygate-ensure-all-society-staff-entries-are-verified-to-avoid-any-proxies
- NoBrokerHood features: https://www.nobrokerhood.com/solutions/nobrokerhood-features
- NoBrokerHood visitor management: https://www.nobrokerhood.com/solutions/visitor-management-system
- NoBrokerHood helpdesk: https://www.nobrokerhood.com/blog/step-by-step-guide-to-helpdesk/
- NoBrokerHood TouchlessEntry (historical): https://www.nobrokerhood.com/blog/its-time-your-building-society-got-a-security-upgrade-nobrokerhoods-new-launch-touchlessentry/

**Image caption:** Evaluate the real workflow, not only the feature label.

**Close:** Ask for a demonstration built around your society’s priorities.

### Page 8 — Why choose ShubhNivas?

**Headline:** A platform that follows the work of your society.

**Tagline:** Bring useful workflows closer to the people who need them.

**Intro:** Society management touches residents, committee members, facility teams, vendors and security staff. ShubhNivas gives these roles dedicated digital workflows and brings core records together for day-to-day use.

**1. Connect more of the operating picture** — Resident management, finance, helpdesk, vendors, procurement, amenities, security and community modules live within one platform. **Benefit:** Evaluate related tasks in a connected setting.

**2. Give administrators a structured workspace** — Role permissions and dedicated module pages help organize access to society records. **Benefit:** Keep administrative tasks easier to navigate and review.

**3. Make resident services easier to reach** — Residents can use app experiences for bills, notices, amenities, visitors, complaints, profiles and community activities. **Benefit:** Put common information and services on a familiar mobile channel.

**4. Support security team workflows** — Guard identity, employee codes, visitor registration, gate logs and roster modules address practical gate responsibilities. **Benefit:** Keep security workflows focused and attributable.

**5. Organize vendors and purchasing** — Vendor information, documents, contracts, requests, quotations, orders and approvals are represented in the dashboard. **Benefit:** Keep provider and purchasing records closer to the operational process.

**6. Encourage community participation** — Announcements, advertisements and Kids Activities provide tools for resident communication and participation. **Benefit:** Share useful updates and organize family activities through the resident experience.

**7. Prepare information to share** — PDF and Excel report options support society reviews and record keeping. **Benefit:** Create outputs that can be discussed and retained, subject to configured data.

**Highlighted statement:** Choose a platform that understands the everyday needs of your society.

**Visual caption:** One community, supported by connected workflows.

**Close:** ShubhNivas helps make everyday society operations more organized and accessible.

### Page 9 — Customer journey and company commitment

**Headline:** From first conversation to a working society workflow.

**Tagline:** Start with your community’s needs and evaluate the right fit together.

**Intro:** Every society has its own structure, rules and priorities. A thoughtful evaluation begins by understanding those needs, then demonstrating the relevant ShubhNivas workflows before deciding how to proceed.

**1. Initial discussion** — Share the society’s current processes, priorities and questions.

**2. Understand requirements** — Identify the roles, records and operational workflows that matter most to the committee.

**3. Product demonstration** — Review relevant admin, resident and security flows using a configured demonstration environment.

**4. Configuration and onboarding** — Confirm the data, roles, permissions and modules required for the society’s setup. Agree scope and responsibilities before configuration begins.

**5. Introduce the platform to users** — Plan how administrators, residents and security teams will learn the workflows relevant to them. Confirm training and communication arrangements with Ambi-Elite.

**6. Deployment and improvement** — Review the configured workflows with society users and collect feedback for the next steps.

**Company approach:** Ambi-Elite can discuss the society’s requirements and demonstrate relevant ShubhNivas capabilities. The implementation plan, support arrangements, timelines, pricing and service commitments should be confirmed directly with the company for each engagement.

**Highlighted statement:** A useful demonstration starts with your society’s real questions.

**Image caption:** Discover → Evaluate → Configure → Introduce → Review.

**Close:** Bring your committee’s priorities to the conversation.

### Page 10 — Final sales page

**Headline:** Your Society Deserves Smarter Management.

**Supporting statement:** Bring administration, residents and security teams into a more connected digital experience with ShubhNivas.

**Sales copy:** Explore how ShubhNivas can support your society’s everyday operations—from residents, visitors and amenities to vendors, helpdesk, finance, reports and community activities. Arrange a demonstration and see the workflows that matter to your committee.

**Call to action:** Book a ShubhNivas Demo

**Contact block — replace every placeholder with verified company details before publication:**

- Phone: [Company-approved phone number]
- Email: [Company-approved email address]
- Website: [Company-approved website]
- QR code: [Generate only after a verified demo/contact URL is supplied]

**Brand:** ShubhNivas | Ambi-Elite Pvt. Ltd.

**Image caption:** Let’s explore a better-connected way to manage your society.

**Close:** Book a demo. Bring your society’s questions. See ShubhNivas in action.

## C. Claude master prompt — copy from here

```text
You are a senior commercial brochure designer and PDF production specialist. Create the actual, polished 10-page sales PDF described below for ShubhNivas, a housing society management platform by Ambi-Elite Pvt. Ltd. Your task is visual arrangement and PDF production only. Do not inspect a repository, research features, invent product claims, invent company facts, or write substitute content. Use the findings and approved copy supplied here.

BUSINESS CONTEXT
ShubhNivas serves Indian housing societies and residential communities. The audience is society chairpersons, secretaries, committee members, treasurers, society/facility managers and residential developers. This is a premium commercial sales brochure intended to earn a product demonstration. It must not look like a technical report, developer portfolio, internship presentation or user manual.

PRODUCT AND VERIFIED IMPLEMENTATION
The product has a React/Vite admin dashboard, Node/Express/PostgreSQL backend, and a Flutter mobile app with separate Resident and Security Guard login modes. The admin dashboard is a separate web experience. Verified code modules include resident/unit/user management, verification and move lifecycle; staff/security staff and documents; attendance, tasks, patrols, incidents, emergencies and audits; vendor records/contracts/documents; procurement requests, RFQs/quotations, orders and approvals; parking and vehicles; visitor invites/passes/gate workflows; amenities and bookings; finance and maintenance/billing; tickets/helpdesk/SLA; reports; notices/notifications; resident advertisements; Kids Activities; and role/permission administration.

ROLE-BASED ACCESS AND THE SINGLE MOBILE APP
There is one Flutter mobile app for Resident and Security Guard users, with distinct login choices and different role-specific home screens/features. There are not separate resident and guard mobile apps. The administrator uses the separate web dashboard. The dashboard and backend use role/permission codes to control access to modules and operations. Describe this as role-based access control and role-appropriate workflows; do not imply every role can access all features or claim a certification.
Resident app features evidenced in code: resident dashboard; society/unit and maintenance/bill information; complaints/helpdesk requests and statuses; visitor-related services; amenity browsing/booking; notices and bell notifications; advertisements; Kids Activities and registration when required; profile and password controls.
Security Guard app features evidenced in code: employee-code identity and selfie verification at sign-in; shift assignments; visitor registration and visitor/pass list; gate log; delivery workflows; assigned helpdesk tickets, ticket details and permitted status actions. Do not claim guards can create resident complaints or use resident bills/payments, amenity bookings, advertisement administration, or all resident features.
Unique access value: one mobile app distribution can serve residents and guards while directing each account to workflows that fit its responsibilities; administrators have permission-protected web modules. This is role-based tailoring, not unrestricted shared access.

Specific verified claims permitted:
- Guard login may require a staff employee code that identifies the individual active guard under shared security credentials. The selected staff identity/profile is returned for that session.
- Guard sign-in selfie can be compared with the saved guard profile photo. The verification flow clears request selfie bytes and descriptors; it does not save the selfie. Do not say matching is perfect or guarantees prevention of fraud.
- Shift and roster modules exist. Do not claim automatic coverage optimization.
- Advertisement management supports admin create/edit/delete/activate, active date range, total view tracking, resident dismissal persistence, and resident app presentation. There is no per-resident display limit.
- Kids Activities support activity date, start/end time, age range, optional prize, registration requirement/deadline, resident child participation form, and admin review of registrations.
- Reports include PDF and Excel/XLSX support; PDF code uses readable labels, excludes UUID-like identifiers, and can include an uploaded society logo when available.
- The project demonstrates protected admin routes/permissions and role-specific resident/security views inside one Flutter mobile app.

Do not claim every deployment is configured, populated, fully operational, or integrated with external systems. Do not invent pricing, performance metrics, customer counts, testimonials, certifications, market rank, service hours, guaranteed response times or delivery timelines. Use “designed to”, “supports”, and “can help” where appropriate.

COMPANY FACTS AND PLACEHOLDERS
Only the company name Ambi-Elite Pvt. Ltd. is verified from supplied project context. No verified director name/photo/bio, corporate logo, company history, official vision/mission, contact details, website, customer references, certifications or support guarantees were found. Treat the vision and mission wording below as proposed marketing statements requiring company approval. Keep all director/contact placeholders editable; never fabricate facts. A dedicated Ambi-Elite logo is not supplied: set the company name in text or use a clearly replaceable placeholder. The supplied ShubhNivas PNG is a mark without a clear wordmark, so pair it with typeset “ShubhNivas”.

ASSET INVENTORY — USE ONLY THESE EXACT FILES AS REAL ASSETS
1. ShubhNivas mark: C:\Users\SURESH\OneDrive\Desktop\ambi-eli\Housing_Society-integrated\societyapp\assets\images\logo1.png
2. Premium residential community photo: C:\Users\SURESH\OneDrive\Desktop\ambi-eli\Housing_Society-integrated\societyapp\assets\images\shubhnivas_residence.jpg
3. Optional blue building background graphic: C:\Users\SURESH\OneDrive\Desktop\ambi-eli\Housing_Society-integrated\frontend\src\assets\ambi-elite-login-background.png. This is a login background, not the company logo.
No saved standalone admin, resident, guard, visitor, amenity, Kids Activities, advertisement or report screenshots were found. No director/team portrait or Ambi-Elite logo was found. For missing screenshots, use clearly labeled replaceable UI mockup frames or request approved screenshots; never present invented screenshots as actual screens. For director/team photos, use placeholders only. Use two distinct dummy portrait placeholders below the director photograph, with editable “Name / Role” labels. Phone/email/site/QR are placeholders; do not create a QR pointing to an assumed destination.

COMPETITOR RESEARCH — CODEX HAS ALREADY DONE IT; DO NOT RESEARCH OR EXPAND CLAIMS
Use cautious, evidence-based wording. Public feature pages were checked on 26 November 2026.
Sources:
MyGate apartment management: https://mygate.com/apartment-management-system/
MyGate FAQs: https://mygate.com/faqs/
MyGate SmartEye staff-photo verification: https://adminfaq.mygate.com/articles/129223-how-does-mygate-ensure-all-society-staff-entries-are-verified-to-avoid-any-proxies
NoBrokerHood features: https://www.nobrokerhood.com/solutions/nobrokerhood-features
NoBrokerHood visitor management: https://www.nobrokerhood.com/solutions/visitor-management-system
NoBrokerHood helpdesk: https://www.nobrokerhood.com/blog/step-by-step-guide-to-helpdesk/
NoBrokerHood TouchlessEntry historical article: https://www.nobrokerhood.com/blog/its-time-your-building-society-got-a-security-upgrade-nobrokerhoods-new-launch-touchlessentry/

Comparison findings: All three publicly describe broad society/resident and visitor management. MyGate publicly describes amenities, helpdesk/complaints, accounting/maintenance billing, vendor management and reports; its SmartEye material discusses photographing staff entry/exit and comparing against profile photos, which is a different flow from ShubhNivas guard sign-in. NoBrokerHood publicly describes visitor management, helpdesk, amenities, multiple admin types and staff/vendor/community operations; a historical official post describes face scanning for service-staff entry, a different flow. Exact equivalence of guard employee codes/shared Security Head sign-in, multiple guard shift scheduling, resident-dismissable ad campaign controls, and age-ranged Kids Activities registration was not publicly verified in the sources checked. Do not state that either competitor lacks those features. Procurement details and export styling differ and should be shown as “not publicly verified” unless the referenced official page supports a broad category. Every comparison must distinguish “publicly marketed” from “not publicly verified”; do not use a bare green-check/red-cross matrix.

DESIGN SYSTEM
Create an A4 landscape PDF, exactly 10 pages. Premium corporate style for Indian residential communities. Palette: charcoal #2C2C2C, warm gold #C9A227, white #FFFFFF, light grey #F3F5F7, optional slate blue #3A4A5A. Keep polished typography, strong grid, restrained gold accents, clear hierarchy, generous whitespace, consistent footer/page numbers, real photo cropping and accessible contrast. Use elegant modern sans-serif typography. No cartoons, religious symbols, fake statistics, fake testimonials, technical diagrams, dense paragraphs, excessive decoration, or unapproved logos. Prefer short readable text blocks and visual cards while preserving the supplied meaning. Do not omit a page or create blank pages. Use product UI mockups only as visibly replaceable mockups unless approved screenshots are later supplied.

PAGE 1 — COVER
Title: “Smarter Society Management. Better Community Living.”
Supporting line: “One connected platform for the people and operations that keep a residential community moving.”
Intro: “ShubhNivas brings society administrators, residents and security teams into a shared digital experience for everyday community operations. From resident records and visitor workflows to amenities, helpdesk, finance, reports and community activities, it helps make important information easier to organize and access.”
Brand: “ShubhNivas | Housing Society Management Platform”
Company: “Ambi-Elite Pvt. Ltd.”
Caption: “A connected community begins with clearer everyday operations.”
Close: “Your society. Better connected.”
Visual: large crop of shubhnivas_residence.jpg; logo1.png; typeset product wordmark; company as text. Keep cover uncluttered.

PAGE 2 — THE PROBLEM AND OUR SOLUTION
Title: “Society operations deserve more than scattered records.”
Tagline: “Replace avoidable coordination friction with a more organized digital experience.”
Intro: “A residential community runs on many small decisions and handoffs. When visitor logs, resident details, maintenance updates, complaints, staff information and committee records live in separate places, it takes extra effort to find the latest information and keep everyone aligned.”
Section “When processes are disconnected” with these concise points: “Manual records — Registers and spreadsheets can be hard to keep consistent and quick to search.” “Scattered communication — Residents may miss an update when announcements rely on disconnected channels.” “Gate coordination — Visitor information and resident decisions need to move between the gate and the home.” “Maintenance follow-up — Requests can require repeated calls when ownership and status are not easy to see.” “People and provider records — Staff, vendors, documents and contracts can be difficult to track across folders.” “Reports under time pressure — Preparing a clear view of operations can take manual consolidation.”
Section “A more connected way with ShubhNivas”: “ShubhNivas gives authorized teams dedicated modules for residents, units, staff, vendors, procurement, visitors, amenities, helpdesk, finance, communications and reports. Residents use the app to access society services and updates; security teams use guard workflows for visitor activity; administrators manage records through permission-aware dashboard pages.”
Before/after table: “Information spread across registers and files | Society records organized in dedicated modules”; “Repeated status follow-ups | Ticket and workflow status views”; “Visitor coordination by phone and paper | Digital invite, pass and gate-event workflows”; “Separate channels for resident updates | Notices and app notifications in a resident experience”; “Manual report assembly | Filtered reports with PDF/Excel export options”.
Highlight: “Digital society management is not just about moving forms online. It is about making everyday information easier to find, share and act on.”
Image captions: “From fragmented handoffs” / “To organized workflows and shared visibility.”
Close: “Start with the operations that matter most to your community.”

PAGE 3 — INTRODUCING SHUBHNIVAS
Title: “One platform. Three connected experiences.”
Tagline: “Built around the day-to-day work of a residential society.”
Intro: “ShubhNivas is a housing society management platform from Ambi-Elite Pvt. Ltd. Its web dashboard and single mobile app—with distinct Resident and Security Guard login modes—address different responsibilities while connecting core society records and operational workflows.”
“What it is: A modular digital workspace for housing societies and residential communities to manage administrative records, resident-facing services, gate operations and recurring community tasks.”
“Why it exists: Society teams coordinate people, property, services and communication every day. ShubhNivas brings these activities into structured modules so authorized users can work with clearer records and residents can reach relevant services through an app.”
Three cards: “Administrators and committee members — Manage society records, people, workflows, permissions and reports from the dashboard.” “Residents — View society information, maintenance, notices, amenities, helpdesk services and community updates in the app.” “Security teams — Use dedicated guard flows for identity-based sign-in, visitor registration and gate-related tasks.”
Add a prominent but compact access model callout: “One mobile app. Different role logins.” Body: “Residents and Security Guards choose their login mode in the same Flutter app and are routed to separate, role-appropriate screens. Administrators use the separate web dashboard, where permissions control module access.” Do not depict separate resident and guard apps.
Highlight: “ShubhNivas is designed to bring everyday society operations into one connected experience.”
Caption: “Three role-based experiences, connected around one residential community.”
Close: “A clearer view for administrators. Convenient access for residents. Focused workflows for security teams.”
Visual: three clearly labeled, replaceable mockup frames (Admin / Resident / Security) if approved screenshots are not available.

PAGE 4 — THREE CONNECTED EXPERIENCES
Title: “The right tools for each role in the community.”
Tagline: “Purposeful views for administration, resident services and gate operations.”
Intro: “ShubhNivas organizes common society responsibilities into dedicated modules. Access is permission-aware, and each user experience is shaped around the work that role needs to perform.”
Start with a banner: “One mobile app, separate Resident and Security Guard logins, and different permitted workflows. Administrators use the separate web dashboard with role-based module permissions.”
"A. Admin Dashboard — Organize society operations": “Manage residents, users, units and verification; keep staff profiles and documents organized; maintain vendor records, contacts, contracts and documents; run purchase requests, quotations, orders and approvals; manage parking, vehicles, visitor records, amenities and bookings; track helpdesk tickets and SLA timers; work with finance and maintenance records; publish notices, advertisements and Kids Activities; review reports and export PDF or Excel files. Dashboard access is controlled by assigned role permissions.” Benefit: “Give authorized administrators a structured place to review records, follow operational work and prepare information for committee decisions.”
"B. Resident experience in the mobile app": “Residents can access the home dashboard, society and unit information, maintenance and bill details, announcements and notifications, amenity browsing and booking, visitor-related services, their complaints/helpdesk requests and statuses, profile and password controls, advertisements, and Kids Activities registration where the activity requires it.” Benefit: “Make common society information and requests easier to access without relying on a resident to find the right office contact first.”
"C. Security Guard experience in the same mobile app": “Security staff use a distinct login mode and see guard workflows: employee-code identity and selfie verification, shift assignments, visitor registration and visitor/pass list, gate logs, delivery workflows, and helpdesk tickets assigned to the guard with allowed ticket status actions.” Benefit: “Give security teams a focused workflow and help administrators associate activity with the selected staff identity. Guard accounts do not automatically receive every resident feature or the full admin dashboard.”
Show Resident and Security as two different role cards inside one phone/app frame; show Admin separately as a web dashboard. Do not draw or label them as three separate apps.
Captions: “Admin dashboard: manage the operational record.” / “Resident login: services and updates in the mobile app.” / “Security Guard login: visitor, gate and assigned-ticket workflows in the same mobile app.”
Close: “Different responsibilities. A more connected community workflow.”
Visual: three-column editorial layout with replaceable frames; do not fake actual product UI.

PAGE 5 — ABOUT AMBI-ELITE PVT. LTD.
Title: “Built by Ambi-Elite Pvt. Ltd.”
Tagline: “Practical digital experiences for the everyday needs of residential communities.”
Intro: “Ambi-Elite Pvt. Ltd. is the company behind ShubhNivas. The platform brings together administrative, resident and security workflows for housing societies in India. Its product purpose is to help communities organize routine operations through connected digital tools.”
“Purpose: Help society teams and residents work with clearer information and more organized everyday processes.”
“Vision (proposed marketing copy; obtain company approval): A future where every residential community can manage its everyday needs through accessible, connected digital experiences.”
“Mission (proposed marketing copy; obtain company approval): Build practical software that helps housing societies coordinate administration, resident services and security workflows with greater clarity.”
“Why ShubhNivas: The product brings multiple society functions together in one platform and provides role-specific experiences for administrators, residents and security teams.”
Leadership editable block: “Director: [Insert verified director name]”; “Designation: [Insert verified designation]”; “Introduction: [Insert owner-approved professional biography and verified qualifications/experience. Do not publish this placeholder as a fact.]”; “Portrait: [Replaceable director portrait placeholder]”.
Required org chart below director portrait, exact hierarchy: DIRECTOR → two separate branches → DUMMY IMAGE 1 — Name / Role and DUMMY IMAGE 2 — Name / Role. Use separate replaceable portrait placeholders. Do not invent identities.
Caption: “Leadership and team details to be supplied and verified.”
Close: “A product shaped around the everyday operations of residential communities.”
Visual: real logo only if later supplied; otherwise text company mark. Page is deliberately in the middle of the brochure.

PAGE 6 — WHAT MAKES SHUBHNIVAS DIFFERENT?
Title: “Differentiators you can see in a live workflow.”
Tagline: “Specific tools for the practical details of community operations.”
Intro: “A useful platform is defined by how it handles real tasks. ShubhNivas includes focused workflows for security identity, staff scheduling, community participation, resident communication and operational records.”
Feature cards (each with What it does / Why it matters / Customer benefit):
1. “Guard selfie verification at sign-in.” What: checks a guard sign-in selfie against the saved profile photograph selected through employee code. Why: adds an identity check and associates the session with the selected staff profile. Benefit: more attributable sign-in. Request selfie is used for verification and is not stored in this flow. Face matching is not a guarantee of identity or fraud prevention.
2. “Individual employee identification with shared security credentials.” What: shared Security Head account can require individual active guard employee code; selected staff record supplies identity/profile. Why: shared account access need not erase who is using the workflow. Benefit: clearer staff attribution.
3. “Multiple shift and roster management.” What: shift/roster modules for staff scheduling. Why: security assignments across times/days need an organized record. Benefit: structured view of assigned shifts. Do not claim automatic optimization.
4. “Resident-facing advertisement controls.” What: admins create, schedule, activate, edit/remove advertisements; resident delivery respects dates and persisted dismissal while total views are tracked for admins. Why: configurable campaign controls. Benefit: present relevant banners in the resident app and review total views. There is no per-resident display limit.
5. “Kids Activities with age and registration details.” What: activities with dates, start/end times, age ranges, optional prizes, registration requirement/deadline; residents submit participating children when registration is enabled. Why: activity and participants organized together. Benefit: coordinate family participation and age-appropriate registration.
6. “Readable PDF and Excel reports.” What: report modules support PDF/spreadsheet exports, readable labels, optional society logo. Why: committee reviews need shareable information. Benefit: practical exports; data depends on selected report/range and available data.
7. “Connected operating modules.” What: resident records, vendors/contracts, procurement, amenities, parking, tickets, communications and reports in permission-protected modules. Why: work crosses teams and records. Benefit: shared platform to assess against requirements.
8. “One app with role-appropriate access.” What: a single mobile app offers Resident and Security Guard sign-in modes and routes each account to distinct permitted screens. Residents can use their complaint/helpdesk and amenity services; guards can use shifts, visitor/gate/delivery workflows and assigned helpdesk tickets with allowed status actions. Administrators use the separate permission-protected web dashboard. Why: match access to responsibility while using one mobile app. Benefit: role-specific workflows without claiming that every user sees every feature. Do not say guards can access all resident features or file resident complaints.
Three visual callouts: “Identity-aware guard sign-in” / “Community activities with registration” / “Society operations and resident services together.”
Caption: “Evaluate the actual workflow in a demonstration.”
Close: “See the workflow in action, then decide how it fits your society.”

PAGE 7 — COMPETITOR COMPARISON
Title: “Compare the workflows that matter to your society.”
Tagline: “A fair comparison starts with evidence—and a product demonstration.”
Intro: “Established platforms such as MyGate and NoBrokerHood publicly describe broad society and visitor-management capabilities. ShubhNivas also covers multiple society operations and includes focused workflows for guard employee identity, Kids Activities and resident-facing advertisements. Public material does not always reveal exact implementation, plan availability or configuration, so this comparison distinguishes marketed categories from details that are not publicly verified.”
Legend: “Publicly marketed” means an official source describes the broad feature. “Not publicly verified” is not a claim that a competitor lacks it. Confirm scope, plan, integrations and workflow in a vendor demonstration.
Use a readable, not overcrowded comparison table with columns Feature / ShubhNivas / MyGate / NoBrokerHood and these rows exactly:
Resident and society management | Implemented in dashboard/app | Publicly marketed | Publicly marketed
Visitor management | Invites, passes, guard registration and gate events implemented | Publicly marketed | Publicly marketed
Helpdesk / complaints | Resident complaint and admin tickets/SLA implemented | Publicly marketed | Publicly marketed
Amenity booking | Admin slots/bookings and resident app implemented | Publicly marketed | Publicly marketed
Face/photo verification | Guard login selfie compared with saved guard profile | Staff photo/profile checks described in SmartEye material; different workflow | Face-scan staff entry described in historical TouchlessEntry post; different workflow
Guard employee code paired with shared Security Head account | Implemented; individual staff selected by code | Not publicly verified in sources checked | Not publicly verified in sources checked
Multiple security shifts/rosters | Shift and roster modules implemented; demonstrate exact rules | Exact multiple-guard shift workflow not publicly verified | Exact multiple-guard shift workflow not publicly verified
Admin ad campaigns with resident dismissal and view tracking | Implemented | Equivalent workflow not publicly verified | Equivalent workflow not publicly verified
Kids activity age range/deadline/child registration | Implemented | Equivalent workflow not publicly verified | Equivalent workflow not publicly verified
Vendor records/contracts | Implemented | Vendor management publicly referenced | Vendor management publicly referenced
Procurement requests/quotations/orders | Implemented | Equivalent procurement detail not confirmed in sources checked | Purchase requests/orders referenced; exact RFQ/quotation scope not fully verified
Finance and maintenance | Finance, bills and payment paths implemented | Accounting and maintenance billing publicly marketed | Utility/finance-related services referenced; exact parity depends on configuration
PDF/Excel reports | PDF/XLSX exports implemented, society-logo support in PDF generation | Reports publicly marketed; exact export presentation may vary | Reports publicly marketed; exact export presentation may vary
Role-based administration | Permission-protected modules implemented | Role-specific administration publicly described | Multiple admin types and responsibilities publicly described
Conclusion heading: “Why consider ShubhNivas when other established platforms are available?” Paragraph: “Choose by workflow fit, not by the length of a feature list. ShubhNivas offers an integrated set of admin, resident and guard experiences, with specific implemented flows for employee-code-based guard identity, guard selfie verification at sign-in, configurable resident advertisements, Kids Activities registration, and operational reports. A society can use a demonstration to assess these workflows against its own committee, finance, gate, vendor and resident-service needs. Competitor products also cover many core society functions; compare the actual configuration and operating process before making a decision.”
Place compact source links/citations in footer or source strip, with readable labels and clickable links:
MyGate apartment management https://mygate.com/apartment-management-system/
MyGate FAQs https://mygate.com/faqs/
MyGate SmartEye https://adminfaq.mygate.com/articles/129223-how-does-mygate-ensure-all-society-staff-entries-are-verified-to-avoid-any-proxies
NoBrokerHood features https://www.nobrokerhood.com/solutions/nobrokerhood-features
NoBrokerHood visitor management https://www.nobrokerhood.com/solutions/visitor-management-system
NoBrokerHood helpdesk https://www.nobrokerhood.com/blog/step-by-step-guide-to-helpdesk/
NoBrokerHood TouchlessEntry (historical) https://www.nobrokerhood.com/blog/its-time-your-building-society-got-a-security-upgrade-nobrokerhoods-new-launch-touchlessentry/
Caption: “Evaluate the real workflow, not only the feature label.”
Close: “Ask for a demonstration built around your society’s priorities.”

PAGE 8 — WHY CHOOSE SHUBHNIVAS?
Title: “A platform that follows the work of your society.”
Tagline: “Bring useful workflows closer to the people who need them.”
Intro: “Society management touches residents, committee members, facility teams, vendors and security staff. ShubhNivas gives these roles dedicated digital workflows and brings core records together for day-to-day use.”
Reasons:
1. “Connect more of the operating picture” — Resident management, finance, helpdesk, vendors, procurement, amenities, security and community modules live within one platform. Benefit: evaluate related tasks in a connected setting.
2. “Give administrators a structured workspace” — Role permissions and dedicated module pages help organize access to society records. Benefit: keep administrative tasks easier to navigate and review.
3. “Make resident services easier to reach” — App experiences for bills, notices, amenities, visitors, complaints, profiles and activities. Benefit: put common information/services on mobile.
4. “Support security team workflows” — Guard identity, employee codes, visitor registration, gate logs and roster modules. Benefit: focused and attributable workflows.
5. “Organize vendors and purchasing” — Vendor information, documents, contracts, requests, quotations, orders and approvals. Benefit: provider and purchasing records near the process.
6. “Encourage community participation” — Announcements, advertisements and Kids Activities. Benefit: share updates and organize family activities through the resident experience.
7. “Prepare information to share” — PDF and Excel reports. Benefit: create outputs for review and records, subject to configured data.
8. “Give each role the right mobile workflow” — One Flutter app has separate Resident and Security Guard login modes and distinct screens. Residents can use their complaint/helpdesk and amenity services; guards can manage shifts, visitors, gate logs, deliveries and assigned helpdesk tickets. Administrators use the web dashboard with role permissions. Benefit: users see workflows designed for their responsibilities, with access aligned to their role.
Highlight: “Choose a platform that understands the everyday needs of your society.”
Caption: “One community, supported by connected workflows.”
Close: “ShubhNivas helps make everyday society operations more organized and accessible.”

PAGE 9 — CUSTOMER JOURNEY AND COMPANY COMMITMENT
Title: “From first conversation to a working society workflow.”
Tagline: “Start with your community’s needs and evaluate the right fit together.”
Intro: “Every society has its own structure, rules and priorities. A thoughtful evaluation begins by understanding those needs, then demonstrating the relevant ShubhNivas workflows before deciding how to proceed.”
Stages:
1. “Initial discussion” — Share current processes, priorities and questions.
2. “Understand requirements” — Identify roles, records and operational workflows important to the committee.
3. “Product demonstration” — Review relevant admin, resident and security flows using a configured demo environment.
4. “Configuration and onboarding” — Confirm data, roles, permissions and modules required. Agree scope and responsibilities before configuration.
5. “Introduce the platform to users” — Plan how administrators, residents and security teams will learn relevant workflows. Confirm training and communication arrangements with Ambi-Elite.
6. “Deployment and improvement” — Review configured workflows and collect feedback for next steps.
Company approach: “Ambi-Elite can discuss the society’s requirements and demonstrate relevant ShubhNivas capabilities. The implementation plan, support arrangements, timelines, pricing and service commitments should be confirmed directly with the company for each engagement.”
Highlight: “A useful demonstration starts with your society’s real questions.”
Caption/process visual: “Discover → Evaluate → Configure → Introduce → Review.”
Close: “Bring your committee’s priorities to the conversation.”

PAGE 10 — FINAL SALES PAGE
Title: “Your Society Deserves Smarter Management.”
Supporting: “Bring administration, residents and security teams into a more connected digital experience with ShubhNivas.”
Sales copy: “Explore how ShubhNivas can support your society’s everyday operations—from residents, visitors and amenities to vendors, helpdesk, finance, reports and community activities. Arrange a demonstration and see the workflows that matter to your committee.”
CTA: “Book a ShubhNivas Demo”
Contact block, all editable and visibly marked as replace-before-publication: “Phone: [Company-approved phone number]”; “Email: [Company-approved email address]”; “Website: [Company-approved website]”; “QR code: [Generate only after a verified demo/contact URL is supplied]”.
Brand: “ShubhNivas | Ambi-Elite Pvt. Ltd.”
Caption: “Let’s explore a better-connected way to manage your society.”
Close: “Book a demo. Bring your society’s questions. See ShubhNivas in action.”
Visual: residence photo, both brand treatments; company logo placeholder only if needed. Keep QR a replaceable placeholder, not a fabricated code.

FINAL PDF PRODUCTION REQUIREMENTS
- Exactly 10 pages, A4 landscape.
- High-resolution imagery, embedded fonts, correct logo proportions, clickable valid official-source links.
- Premium consistent commercial brochure layout and clear page hierarchy.
- Ensure all comparison-table text is legible; split or redesign within Page 7 without adding pages.
- Keep the Page 5 org chart and two replaceable dummy portraits as specified.
- Keep all missing company identity/contact details visibly editable; do not leave misleading placeholders that look real.
- Check every page for text overflow, overlaps, clipped content, missing images, low contrast, bad crops, spelling errors, broken links and blank pages.
- Do not add unsupported claims, fabricated company credentials, competitor negatives, statistics, testimonials, pricing, integrations or service guarantees.
- Deliver the finished PDF and, if possible, the editable source document used to create it.
```

## D. Pre-publication checklist

- Supply the verified Ambi-Elite logo, director identity/photo/biography, and approved vision/mission wording.
- Replace phone/email/website/QR placeholders with confirmed contact details and test the QR destination.
- Export current product screenshots from a configured demo; label them by Admin, Resident login and Security Guard login. Avoid using resident personal information.
- Run a live demonstration of the security login/selfie flow, multiple shifts, Kids Activities, advertisement dismissal/caps, finance and reports before asserting more than the code evidence above.
- Confirm each competitor plan/workflow directly during procurement evaluation; public page descriptions are not an exhaustive feature inventory.
- Review all claims and page text with Ambi-Elite before sending the PDF to prospective customers.
