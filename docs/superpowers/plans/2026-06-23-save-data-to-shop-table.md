# Save Data to Shop Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate shop creation logic directly into `CreateShop.tsx`, save shop details via `/api/auth/create-shop`, fetch the new `shopId` using `/api/shop`, set the state in the store with onboarding marked as incomplete, and navigate back to `/get-started`.

**Architecture:** Move form logic from a separate custom hook into local React component states in `CreateShop.tsx`. Query `/api/shop` to fetch the newly created shop ID, update Zustand auth store state directly, and navigate back to `/get-started`. Modify `useAuthStore` to set `isOnboardingComplete: false` globally for onboarding steps.

**Tech Stack:** React, TypeScript, Zustand, Cloudflare Workers D1 database backend.

## Global Constraints
- Target mobile screen layout design (max-width: 400px).
- Keep pull requests small and focused.
- Follow Conventional Commits standard.
- Do not use placeholders (like TODO/TBD/implement later).

---

### Task 1: Update Auth Store Onboarding State

**Files:**
- Modify: `src/store/useAuthStore.ts`

**Interfaces:**
- Consumes: None
- Produces: `useAuthStore` state structure with `isOnboardingComplete: false`

- [ ] **Step 1: Modify useAuthStore.ts**
  Modify [useAuthStore.ts](file:///home/tie/Projects/knpos/src/store/useAuthStore.ts) to hardcode `isOnboardingComplete` to `false` in `verifyUser` and `loginWithGoogleToken`.

```typescript
// Replace lines 54 and 92:
isOnboardingComplete: false,
```

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add src/store/useAuthStore.ts
  git commit -m "feat: keep isOnboardingComplete as false for onboarding flow"
  ```

---

### Task 2: Refactor `/api/shop` API Endpoint

**Files:**
- Modify: `functions/api/shop.ts`

**Interfaces:**
- Consumes: None
- Produces: JSON response for GET `/api/shop?fields=id&limit=1` returning a clean `shopId` number instead of a database row object.

- [ ] **Step 1: Modify functions/api/shop.ts**
  Modify [shop.ts](file:///home/tie/Projects/knpos/functions/api/shop.ts) to parse the database row result for `shop_id` and return a clean number.

Replace lines 65 to 85 with:
```typescript
      const row = await context.env.DB.prepare(
        `SELECT shop_id
        FROM shop_member
        WHERE user_id = ?`
      )
        .bind(userId)
        .first<{ shop_id: number } | null>();

      const shopId = row ? row.shop_id : null;

      if (shopId === null) {
        return new Response(
          JSON.stringify({
            success: true,
            exists: false,
            shopId: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
```

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add functions/api/shop.ts
  git commit -m "refactor: ensure /api/shop returns a clean shopId number"
  ```

---

### Task 3: Implement Inline Shop Creation and Delete Custom Hook

**Files:**
- Modify: `src/pages/CreateShop.tsx`
- Delete: `src/hooks/useCreateShopForm.ts`

**Interfaces:**
- Consumes: `/api/auth/create-shop` POST, `/api/shop` GET
- Produces: Form input binding and submit function directly inside the component.

- [ ] **Step 1: Modify CreateShop.tsx**
  Update [CreateShop.tsx](file:///home/tie/Projects/knpos/src/pages/CreateShop.tsx) to manage local states (`shopName`, `description`, `isLoading`), implement inline submission, update auth store, and navigate back to `/get-started`.

Replace the content of `CreateShop.tsx` with:
```typescript
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { CREATE_SHOP_DATA } from '../data/mockData';
import FormInput from '../components/FormInput';

export default function CreateShop() {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateShopSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/create-shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopName: shopName.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create shop');
      }

      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('User not logged in');
      }

      const shopResponse = await fetch(`/api/shop?user_id=${user.id}&fields=id&limit=1`);
      const shopData = await shopResponse.json();

      if (!shopResponse.ok || !shopData.success || !shopData.exists) {
        throw new Error(shopData.error || 'Failed to query shop details');
      }

      useAuthStore.setState({
        user: {
          ...user,
          shopId: shopData.shopId,
          shopName: shopName.trim(),
          isOnboardingComplete: false,
        },
      });

      navigate('/get-started');
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* TopAppBar */}
        <header className="bg-[#fff8f8] flex items-center px-5 h-16 w-full sticky top-0 z-50 border-b border-outline-warm/20 shrink-0">
          <button
            onClick={() => navigate('/get-started')}
            className="mr-4 hover:opacity-80 transition-opacity duration-200 bg-transparent border-none cursor-pointer p-1 -ml-1 text-[#805062]"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">
            Create Your Shop
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 pt-6 space-y-6 no-scrollbar">
          {/* Charni the Mascot */}
          <section className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <div className="absolute -top-3 -right-8 bg-white p-3 rounded-2xl rounded-bl-none border-2 border-outline-warm shadow-sm max-w-[160px] z-10">
                <p className="font-bold text-text-brown text-[13px] leading-snug">
                  {CREATE_SHOP_DATA.mascotSpeech}
                </p>
              </div>
              <img
                alt={CREATE_SHOP_DATA.mascotAlt}
                className="w-full h-full object-cover rounded-full border-4 border-pink-container shadow-sm"
                src={CREATE_SHOP_DATA.mascotUrl}
              />
            </div>
          </section>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleCreateShopSubmit}>
            <FormInput
              id="shopName"
              label={CREATE_SHOP_DATA.shopNameLabel}
              placeholder={CREATE_SHOP_DATA.shopNamePlaceholder}
              required
              value={shopName}
              onChange={setShopName}
            />

            <div className="space-y-2">
              <label
                className="text-[14px] leading-[20px] font-bold text-text-brown pl-4"
                htmlFor="description"
              >
                {CREATE_SHOP_DATA.descriptionLabel}
              </label>
              <textarea
                id="description"
                className="w-full p-5 bg-white border-2 border-outline-warm rounded-[20px] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown custom-shadow resize-none"
                placeholder={CREATE_SHOP_DATA.descriptionPlaceholder}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-brand-pink hover:bg-brand-pink-hover active:scale-[0.97] transition-all rounded-full flex items-center justify-center gap-2 text-text-brown font-bold text-[16px] uppercase tracking-wide shadow-md disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-text-brown" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>{CREATE_SHOP_DATA.createButtonText}</span>
                    <Sparkles className="w-5 h-5 text-text-brown" />
                  </>
                )}
              </button>
              <p className="text-center mt-4 text-[12px] leading-normal text-surface-variant-custom opacity-70 font-medium px-4">
                {CREATE_SHOP_DATA.termsText}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete useCreateShopForm.ts**
  Delete [useCreateShopForm.ts](file:///home/tie/Projects/knpos/src/hooks/useCreateShopForm.ts) from the repository.

```bash
git rm src/hooks/useCreateShopForm.ts
```

- [ ] **Step 3: Commit changes**
  Run command:
  ```bash
  git add src/pages/CreateShop.tsx
  git commit -m "feat: inline form logic in CreateShop and remove separate hook file"
  ```
