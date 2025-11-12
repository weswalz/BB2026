# Admin UI Components

This directory contains admin-specific UI components built with Radix UI primitives and styled with Tailwind CSS.

## Components

### Form Components
- **Input** - Text input field with focus states
- **Label** - Form labels with proper accessibility
- **Select** - Dropdown select with search and keyboard navigation
- **Textarea** - Multi-line text input

### Layout & Navigation
- **Dialog** - Modal dialogs for forms and confirmations
- **DropdownMenu** - Context menus and action menus
- **Separator** - Visual dividers between content

### Feedback
- **Toast** - Notification system for success/error messages
- **Toaster** - Toast container component
- **useToast** - Hook for programmatic toast notifications

## Usage

Import components from this directory:

\`\`\`tsx
import { Input, Label, Dialog, useToast } from '@/components/admin/ui'
\`\`\`

Or use the index file:

\`\`\`tsx
import { Input, Label, Button } from '@/components/admin/ui'
\`\`\`

## Example

\`\`\`tsx
import { Input, Label } from '@/components/admin/ui'

export function MyForm() {
  return (
    <div>
      <Label htmlFor="name">Name</Label>
      <Input id="name" placeholder="Enter name..." />
    </div>
  )
}
\`\`\`

## Toast Usage

\`\`\`tsx
import { useToast } from '@/components/admin/ui'

function MyComponent() {
  const { toast } = useToast()

  return (
    <button onClick={() => {
      toast({
        title: "Success!",
        description: "Your changes have been saved.",
      })
    }}>
      Save
    </button>
  )
}
\`\`\`

## Dependencies

These components require:
- @radix-ui/* primitives
- lucide-react (icons)
- tailwind-merge & clsx (utilities)
- class-variance-authority (variants)

All dependencies are already installed in the project.
