# UI/UX DESIGN SPECIFICATION: DIGITAL FOOTPRINT GUARDIAN
## Conceptual Aesthetic: Editorial Data Visualization

---

### 1. Design Philosophy & Mood
The interface moves away from standard dashboard templates and adopts a strict, high-end editorial aesthetic. The focus is on **clarity, structure, and presence**. Cybersecurity data can be overwhelming; this design language strips away noise, utilizing a minimalist and controlled visual language. Content leads the experience, making the user's risk profile feel sharp, refined, and easy to understand.

### 2. The Color System
The palette abandons standard dark-mode gradients for a stark, high-contrast monochrome foundation, punctuated by a highly specific, singular accent color to draw the eye to critical actions.

* **Background (Canvas):** `#050a0e` (Deep, almost-black surface)
* **Surface (Cards/Containers):** `#0d1a22` (Slightly elevated dark tone for depth)
* **Primary Accent:** `#1e40af` (A deep, sharp blue used strictly for primary calls-to-action, active tab states, and the core brand identity)
* **Typography (Primary):** `#ffffff` (Stark white for maximum contrast on oversized headings)
* **Typography (Secondary):** `#8892b0` (Muted slate for secondary data and metadata)

**Semantic Status Colors (Muted for Editorial Consistency):**
Instead of blinding neon colors for risk scoring, we use slightly desaturated, elegant variants:
* **Critical/Dangerous:** `#cc3333` (Brick red)
* **Suspicious/Warning:** `#cca833` (Ochre yellow)
* **Safe/Clear:** `#33cc66` (Muted emerald)

### 3. Typography & Hierarchy
Large typography dictates the tone and visual hierarchy right from the landing view. The interplay between a stylized display font and a technical monospace font creates the "Editorial Cyber" aesthetic.

* **Display / Headings:** `Syne` (Weights: 600, 800)
    * *Usage:* Massive hero section text (e.g., the overall risk score), tab titles, and primary section headers. Letter spacing should be slightly tight (`tracking-tight`) to give an authoritative feel.
* **Body / Data Points:** `DM Mono` (Weights: 400, 500)
    * *Usage:* Breach data classes, entropy bits, crack times, and heuristic signals. The monospace font brings in the technical, code-like reality of the data while remaining perfectly aligned in grid layouts.

### 4. Grid System & Layout
A strict geometric grid controls all elements. Nothing floats arbitrarily. 
* **Container:** Max-width of `1200px` centered on the screen, creating generous negative space (margins) on larger displays.
* **Column Structure:** 12-column CSS Grid.
* **Spacing:** Use mathematically rigid spacing scales (e.g., `gap-8`, `gap-16` in Tailwind). 
* **Borders:** Utilize `1px` solid borders (`border-[#1a2e3a]`) to separate content zones instead of relying heavily on drop shadows. This creates the "print/editorial" layout feel.

### 5. Component Styling Guidelines

#### **Inputs & Forms**
* **Aesthetic:** Brutalist but polished. 
* **Shape:** Square corners (`rounded-none` or `rounded-sm`). 
* **Focus State:** A sharp `2px` solid border in the `#1e40af` accent color. No blurry focus rings.
* **Padding:** Oversized padding (e.g., `py-4 px-6`) to make inputting an email feel like a significant action.

#### **Data Cards (Breach Results & Phishing Signals)**
* **Structure:** Flat design. No background blur, no glassmorphism.
* **Layout:** Information is presented in horizontal rows with clear dividing lines between data points (e.g., `border-b border-[#1a2e3a]`), mimicking an editorial index or table of contents.
* **Hover States:** Minimalist interactions. A slight background shift or a harsh color transition on the left border to indicate interactivity.

#### **Buttons**
* **Primary Action:** Solid `#1e40af` background, white text, sharp corners.
* **Secondary Action:** Transparent background, `1px` border of `#1e40af`, text in `#1e40af`. 
* **Animation:** Instant or highly rigid transitions (`duration-100 ease-linear`). Avoid bouncy or playful animations.

### 6. Interactive Elements & Motion
Motion should be controlled and purposeful. 
* **Loading States:** Instead of standard spinning circles, use a monospaced text ticker cycling through statuses: `[ AUTHENTICATING ]` → `[ FETCHING_INTELLIGENCE ]` → `[ CALCULATING_ENTROPY ]`.
* **Score Reveal:** The risk score (0-100) should count up rapidly from 0, halting abruptly on the final number to create impact.
* **Transitions:** Fade-ins should be fast and sharp. Elements should snap into their grid positions.