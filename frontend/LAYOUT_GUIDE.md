# Frontend Layout Pattern

## How to Add New Protected Pages with Sidebar

All protected pages that need the sidebar should have their own `layout.tsx` file that uses the `AuthenticatedLayout` component.

### Example: Creating a new "Patients" page

**1. Create the page folder and files:**
```
app/patients/
├── layout.tsx    # Uses AuthenticatedLayout
└── page.tsx      # Your page content
```

**2. Create `layout.tsx`:**
```tsx
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default function PatientsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
```

**3. Create `page.tsx`:**
```tsx
export default function PatientsPage() {
  return (
    <div className="p-8">
      <h1>Patients</h1>
      {/* Your content */}
    </div>
  );
}
```

**4. Add to sidebar menu** in `components/layout/sidebar.tsx`:
```tsx
const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/notes', label: 'Clinical Notes', icon: FileText },
];
```

## Benefits

- ✅ Pages stay in their own folders (not nested under `/dashboard`)
- ✅ Consistent sidebar across all protected pages
- ✅ Automatic authentication protection
- ✅ Easy to reuse and maintain

## Current Structure

```
app/
├── page.tsx           # Landing page (public)
├── signin/            # Public
├── signup/            # Public
├── dashboard/         # Protected with sidebar
│   ├── layout.tsx     # Uses AuthenticatedLayout
│   └── page.tsx
└── settings/          # Protected with sidebar
    ├── layout.tsx     # Uses AuthenticatedLayout
    └── page.tsx
```
