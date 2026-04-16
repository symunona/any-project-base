# i18n Strategy

- Use **typed message descriptors + thin `t()` wrapper**
- Keep structure compatible with future migration (e.g. Lingui interface)
- simple template implementation, useT() - save translation props in user table, expose that in session
- by default decide based on user browser prefs

**Message Definition**

```ts
export const msg = {
  Auth: {
    userNotFound: {
      id: "User not found",
      message: "User not found",
    },
    invalidPassword: {
      id: "Invalid password",
      message: "Invalid password for {email}",
    },
  },
} as const

export type Messages = typeof en // default lang
```

```ts
export const de: Messages = {
  auth: {
    invalidPassword: { ... },
    userNotFound: { ... },
  },
}
```

---

**Usage**

```ts
t(msg.Auth.invalidPassword, { email })
```

```ts
type Descriptor = {  
	id: string  
	message: string  
}  
  
function t(d: Descriptor, params?: Record<string, string | number>): string
```
---

- Use `message` as default (dev/runtime)
- Replace `{param}` placeholders
- Optional: warn on missing params! (create translation checkers!)

**Typing**
- `msg` is `as const` → full autocomplete + static safety
- No raw string keys used at call sites
- Renames via IDE (safe)

