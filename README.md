# 🚀 Vibe Coding Starter

A beginner-friendly React + TypeScript template designed for **Vibe Coding** - the AI-assisted programming style where you describe what you want and let AI help you build it.

## ✨ What is Vibe Coding?

Vibe Coding is a development approach where you focus on describing the "vibe" or feeling of what you want to build, and use AI to help implement it. This starter template provides a solid foundation that's both beginner-friendly and AI-friendly.

## 🏗️ Architecture: Feature-first Lite

This project uses a simplified "Feature-first" architecture that's perfect for learning:

```
src/
  app/           # 📄 Pages and routing
  features/      # 🎯 Features (the main workspace)
    todo/        # Example: Todo feature
      components/    # UI components for this feature
      api.ts        # Database calls (Supabase)
      hooks.ts      # React Query hooks
      schema.ts     # Validation (zod)
      types.ts      # TypeScript types
  shared/        # 🔧 Shared utilities
    ui/          # Reusable UI components
    lib/         # Configuration and utilities
    config.ts    # Global constants
```

### 🎯 Simple Rules

1. **Pages go in `app/`** - routing and layout
2. **Features go in `features/*`** - all business logic
3. **Shared stuff goes in `shared/`** - reusable components and utilities
4. **No hardcoding** - use `shared/lib/env.ts` for environment variables, `shared/config.ts` for constants

## 🛠️ Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** - Fast development server
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend as a Service (database, auth, real-time)
- **React Query** - Data fetching and caching
- **React Hook Form** + **Zod** - Form handling and validation
- **React Router** - Client-side routing
- **ESLint** + **Prettier** - Code quality and formatting

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set Up Environment

Copy the example environment file:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Development

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your app!

## 📊 Database Setup (Supabase)

### Create the todos table

```sql
-- Create todos table
create table public.todos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.todos enable row level security;

-- Create policies
create policy "Users can read their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on public.todos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on public.todos for delete
  using (auth.uid() = user_id);
```

### Generate TypeScript types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/shared/types/supabase.ts
```

## 🎨 For Vibe Coding Beginners

### Where to Start Coding

1. **Add new pages**: Create files in `src/app/`
2. **Add new features**: Create folders in `src/features/`
3. **Modify the todo example**: Look in `src/features/todo/`

### AI Prompting Tips

When working with AI, be specific about the structure:

✅ **Good prompts:**

- "Add a new component in `src/features/todo/components/` that shows todo statistics"
- "Create a new feature in `src/features/auth/` for user login with Supabase"
- "Add a filter dropdown to the TodoList component"

❌ **Avoid vague prompts:**

- "Make the app better"
- "Add some features"
- "Fix everything"

### File Organization Rules

- **One feature = one folder** in `src/features/`
- **Database calls** go in `api.ts`
- **React Query hooks** go in `hooks.ts`
- **Validation schemas** go in `schema.ts`
- **UI components** go in `components/`

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors
npm run typecheck    # Check TypeScript types
npm run format       # Format code with Prettier
```

## 🛡️ Code Quality & Safety

This template includes several safety nets:

- **TypeScript strict mode** - Catches type errors
- **ESLint with `no-explicit-any`** - Prevents loose typing
- **Zod validation** - Runtime type checking
- **Prettier** - Consistent code formatting
- **Import organization** - Clean, sorted imports

## 📚 Learning Path

### Level 1: Basic Usage (Start Here!)

- [ ] Run the app and explore the todo feature
- [ ] Add a new todo and see it in the database
- [ ] Modify the TodoForm component
- [ ] Change some Tailwind styles

### Level 2: Adding Features

- [ ] Create a new feature (e.g., notes, habits)
- [ ] Add user authentication
- [ ] Create custom UI components in `shared/ui/`
- [ ] Add form validation with zod

### Level 3: Advanced Patterns

- [ ] Add real-time updates with Supabase
- [ ] Implement optimistic updates
- [ ] Add error boundaries
- [ ] Set up testing with Vitest

## 🔧 Customization

### Adding a New Feature

1. Create a new folder in `src/features/`
2. Add the standard files: `api.ts`, `hooks.ts`, `schema.ts`, `types.ts`, `components/`
3. Export everything from an `index.ts` file
4. Create a page in `src/app/` that uses your feature

### Modifying Styles

- Edit `src/styles/globals.css` for global styles
- Modify Tailwind classes directly in components
- Add new UI components to `src/shared/ui/`

### Environment Configuration

- Add new environment variables to `src/shared/lib/env.ts`
- Add new constants to `src/shared/config.ts`

## 🆘 Troubleshooting

### Common Issues

**TypeScript errors about missing types:**

- Make sure you've generated Supabase types: `npx supabase gen types...`
- Check that all imports use the correct paths

**Supabase connection issues:**

- Verify your `.env.local` file has the correct credentials
- Check that your Supabase project is running
- Ensure RLS policies are set up correctly

**Build errors:**

- Run `npm run typecheck` to find type issues
- Run `npm run lint` to find code style issues

## 📖 Further Reading

- [Vibe Coding concept by Andrej Karpathy](https://twitter.com/karpathy)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and coding standards.

---

**Happy Vibe Coding! 🎉**

Start by describing what you want to build, then let AI help you implement it step by step.
