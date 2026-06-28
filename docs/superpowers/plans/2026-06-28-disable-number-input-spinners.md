# Disable Number Input Spinners and Scroll-to-Change Value Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide input spin buttons and disable mouse wheel/touchpad scrolling value changes on numeric input fields.

**Architecture:** We will use global CSS base styles to hide the spinners on `input[type="number"]` inputs. We will add `onWheel` handlers calling `e.currentTarget.blur()` to the wrapper inputs (FormInput, TextInput) and raw price inputs, which prevents scroll events from updating the input values.

**Tech Stack:** React, TypeScript, CSS, Tailwind CSS

## Global Constraints
- Do not introduce a testing framework since the codebase has no unit tests.
- Keep commits small, descriptive, and follow Conventional Commits.

---

### Task 1: Update Global CSS

**Files:**
- Modify: `src/index.css:48-51`

**Interfaces:**
- Consumes: None
- Produces: CSS rules hiding `input[type="number"]` spin buttons.

- [ ] **Step 1: Add CSS rules to src/index.css**
  Modify [index.css](file:///home/tie/Projects/knpos/src/index.css) to add the input number spinners style inside `@layer base` or as global styles:
  ```css
  /* Hide number input spinners globally */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
  ```
- [ ] **Step 2: Commit**
  ```bash
  git add src/index.css
  git commit -m "style: hide number input spinner buttons globally"
  ```

---

### Task 2: Update Input Components

**Files:**
- Modify: `src/components/FormInput.tsx:41-52`
- Modify: `src/components/TextInput.tsx:36-47`

**Interfaces:**
- Consumes: None
- Produces: FormInput and TextInput components that blur numeric inputs on wheel scroll.

- [ ] **Step 1: Update FormInput.tsx**
  Add `onWheel={(e) => type === 'number' && e.currentTarget.blur()}` to the `<input>` element in [FormInput.tsx](file:///home/tie/Projects/knpos/src/components/FormInput.tsx):
  ```tsx
          <input
            className={`w-full h-14 pr-4 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown ${
              Icon ? 'pl-12' : 'px-6'
            }`}
            id={id}
            placeholder={placeholder}
            required={required}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onWheel={(e) => type === 'number' && e.currentTarget.blur()}
          />
  ```

- [ ] **Step 2: Update TextInput.tsx**
  Add `onWheel={(e) => type === 'number' && e.currentTarget.blur()}` to the `<input>` element in [TextInput.tsx](file:///home/tie/Projects/knpos/src/components/TextInput.tsx):
  ```tsx
          <input
            className={`w-full h-14 pr-4 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-6 placeholder:text-outline-variant-warm font-medium text-text-brown ${
              Icon ? 'pl-12' : 'px-6'
            }`}
            id={id}
            placeholder={placeholder}
            required={required}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onWheel={(e) => type === 'number' && e.currentTarget.blur()}
          />
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/FormInput.tsx src/components/TextInput.tsx
  git commit -m "feat: prevent scroll value changes on FormInput and TextInput"
  ```

---

### Task 3: Update Price Inputs on Pages

**Files:**
- Modify: `src/pages/AddProduct.tsx:360-370`
- Modify: `src/pages/AddFirstProduct.tsx:230-240`

**Interfaces:**
- Consumes: None
- Produces: AddProduct and AddFirstProduct pages with multi-currency price inputs that blur on wheel scroll.

- [ ] **Step 1: Update AddProduct.tsx**
  Add `onWheel={(e) => e.currentTarget.blur()}` to the price `<input>` element in [AddProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddProduct.tsx):
  ```tsx
                        <input
                          type="number"
                          step="any"
                          id={`price_${currency.code}`}
                          placeholder="0.00"
                          required={currency.code === 'THB'}
                          value={prices[currency.code] || ''}
                          onChange={(e) => handlePriceChange(currency.code, e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full h-14 pl-12 pr-6 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown shadow-sm"
                        />
  ```

- [ ] **Step 2: Update AddFirstProduct.tsx**
  Add `onWheel={(e) => e.currentTarget.blur()}` to the price `<input>` element in [AddFirstProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddFirstProduct.tsx):
  ```tsx
                        <input
                          type="number"
                          step="any"
                          id={`price_${currency.code}`}
                          placeholder="0.00"
                          required={currency.code === 'THB'}
                          value={prices[currency.code] || ''}
                          onChange={(e) => handlePriceChange(currency.code, e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full h-14 pl-12 pr-6 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-6 placeholder:text-outline-variant-warm font-medium text-text-brown shadow-sm"
                        />
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add src/pages/AddProduct.tsx src/pages/AddFirstProduct.tsx
  git commit -m "feat: prevent scroll value changes on price inputs"
  ```

---

### Task 4: Build Check and Verification

**Files:**
- None

- [ ] **Step 1: Run build check**
  Run build command to ensure TypeScript/React code builds properly:
  Run: `pnpm build`
  Expected output: Successful Vite build without errors.
