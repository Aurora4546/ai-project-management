# Weeks 5 & 6 In-Depth Tutorial: Agile Mechanics & Advanced Communication

Due to a shift in project planning, we are presenting Weeks 5 and 6 together. These two weeks represent the most complex UI logic in the entire application—transitioning from a static project list to a dynamic, interactive Agile environment with drag-and-drop boards, hierarchical backlogs, and an enterprise-grade tagging system.

---

## 1. The Backlog Tier: Hierarchical Data Management

In Week 5, we built the **Backlog**, which is more than just a list; it is a live representation of the Project's healthy hierarchy. We strictly enforced the logic that Tasks belong to Epics and can have sub-tasks of their own.

### Key File: `frontend/src/pages/Backlog.tsx`

### Advanced Logic: The "Recursive Hierarchy Builder"
To render a tree structure in a flat HTML grid, we implemented a `buildHierarchy` function. This avoids "infinite loops" and ensures that if you expand an Epic, only its direct children appear.

```tsx
// Inside Backlog.tsx
const buildHierarchy = (issueList: IIssue[]) => {
    const result: { issue: IIssue, depth: number, hasChildren: boolean }[] = [];
    
    const addWithChildren = (issue: IIssue, depth: number) => {
        const kids = issues.filter(i => i.parentId === issue.id || i.epicId === issue.id);
        const hasKids = kids.length > 0;
        
        result.push({ issue, depth, hasChildren: hasKids });
        
        // Only recurse if the user has clicked "Expand" on this specific ID
        if (hasKids && expandedTrees.has(issue.id.toString())) {
            kids.forEach(child => addWithChildren(child, depth + 1));
        }
    };
    
    // We start only with "Root" issues (no parent) and Epics
    roots.forEach(root => addWithChildren(root, 0));
    return result;
}
```

### Purpose of the Flow:
1. **The User** clicks a status dropdown on a row.
2. **The `handleFieldEdit`** function triggers an `api.updateIssue` call.
3. **The Data Layer** returns the new object, and we refresh the local `issues` state, causing the entire tree to re-align instantly without a page reload.

---

## 2. The Agile Center: Kanban Logic & "Lexorank" Positioning

In Week 6, we introduced the **Agile Board**. Moving a card between "TO DO" and "DONE" looks simple to a user, but mathematically, we have to ensure the order is saved permanently so it doesn't shuffle on refresh.

### Key File: `frontend/src/pages/AgileBoard.tsx`

### Technical Highlight: Lexorank Positioning
Instead of using simple integers (1, 2, 3), we use decimal positioning. If you drop a card between position `100` and `200`, the new card is assigned `150`. This allows for infinite reordering without ever needing to update every other card in the database (a huge performance win).

```tsx
// Inside onDragEnd in AgileBoard.tsx
let newPosition: number;
if (destination.index === 0) {
    // Top of the column: half of the first item's position
    newPosition = destIssues[0].position / 2.0;
} else if (destination.index >= destIssues.length) {
    // Bottom: last position + 1000
    newPosition = destIssues[destIssues.length - 1].position + 1000.0;
} else {
    // MIDDLE: find the previous and next card and split the difference!
    const prev = destIssues[destination.index - 1].position;
    const next = destIssues[destination.index].position;
    newPosition = (prev + next) / 2.0;
}
```

### Visual State Management:
We use `@hello-pangea/dnd` for the drag animations. The "Why" behind this choice is that it handles **Snapshot styling**—allowing us to turn the card blue and rotate it slightly *while* it's being dragged to give the user tactile feedback.

---

## 3. The Communication Tier: Mentions & Tagging

One of our most significant upgrades was removing the bulky `CKEditor` (Rich Text) and replacing it with a lightning-fast **Mentions System**. This allows users to tag colleagues (`@`) and link other issues (`#`) directly in comments.

### Key Files: 
- `UpdateIssueModal.tsx` (Commenting logic)
- `CreateIssueModal.tsx` (Description logic)

### Why we moved to Plain Text:
Rich text editors store data as HTML string blobs (`<p><strong>...</strong></p>`). This is:
1. **Insecure**: Risk of XSS (Cross-Site Scripting).
2. **Inconsistent**: Different browsers render HTML differently.
3. **Slow**: Hard to parse on the mobile or backend.

**Our NEW Solution**: We store mentions as simple, searchable strings: `@[John Doe](user-id-123)`.

### The Rendering Flow:
We created a utility called `renderCommentContent`. It uses Regex (Regular Expressions) to find these patterns and turn them into beautiful, styled UI tags:

```tsx
const renderCommentContent = (content: string) => {
    // Find all occurrences of @[Name](Id) or #[Key](Id)
    const mentionRegex = /(@|#)\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Split and map the string into an array of React elements
    return parts.map(part => {
        if (part is a Match) {
            return <span className="bg-blue-100 text-blue-700 px-1 rounded">@{part.name}</span>
        }
        return part; // Just normal text
    });
}
```

---

## 4. Modernizing the Tech Stack: React 19 Stability

The hardest challenge of Week 6 was a technical "clash." We upgraded the project to **React 19**, but our drag-and-drop library didn't officially support it yet. 

### Implementation: The `package.json` Overrides
Instead of giving up on the new React version, we used a senior engineering technique called **Overrides**. We forced the project to treat React 19 as a valid version for all sub-dependencies.

```json
// Inside package.json
"overrides": {
  "react": "^19.2.4",
  "react-dom": "^19.2.4"
}
```

### Summary of the Layered Architecture:

| Feature | Primary File | Layer | Purpose |
| :--- | :--- | :--- | :--- |
| **Backlog** | `Backlog.tsx` | Page | Grouping, Filtering, Hierarchy tree. |
| **Board** | `AgileBoard.tsx` | Page | Drag & Drop, Lexorank reordering. |
| **Mentions** | `UpdateIssueModal.tsx` | Component | Tagging logic & Communication. |
| **API Sync** | `api.ts` | Service | Communication between React and Java. |

By combining these weeks, we have successfully moved from a basic CRUD application to a fully dynamic, collaborative tool capable of handling the complex workflows of a real engineering team.
