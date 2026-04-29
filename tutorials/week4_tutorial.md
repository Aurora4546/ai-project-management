# Week 4 In-Depth Tutorial: Advanced UI Logic & Data Modeling (Step-by-Step)

This document provides a highly detailed, chronological walkthrough of the code we wrote in Week 4. We transitioned from basic user login to managing shared resources. This tutorial covers how we safely split UI views based on user roles, and how we architected a Jira-style database model for tracking work issues.

---

## 1. Splitting the UI by User Roles

When many users look at the same "Dashboard," they shouldn't all see the same thing. A Project Creator has a different relationship to a project than an invited Project Member. We handled this purely in React using clean array manipulation before the rendering phase.

### Step 1: Sorting and Filtering Before Rendering
Instead of doing complex logic *inside* our HTML (`JSX`), we process the data right before the `return()` statement in `Dashboard.tsx`.

We separated the `projects` array coming from the API into two groups: `PROJECT_MANAGER` strings and `PROJECT_MEMBER` strings.

```tsx
// Inside Dashboard.tsx
<div className="mb-14">
    <h2 className="text-lg font-bold text-on-surface">Managed Projects</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {[...projects] // We clone the array so we can safely sort it
            .filter((p: any) => p.currentUserRole === 'PROJECT_MANAGER') // Filter out Joined projects
            .sort((a: any, b: any) => {
                // Sorting logic: The logged-in user's physically created projects must always appear FIRST.
                const aIsOwner = a.creatorEmail === user?.email;
                const bIsOwner = b.creatorEmail === user?.email;
                if (aIsOwner && !bIsOwner) return -1;
                if (!aIsOwner && bIsOwner) return 1;
                return 0;
            })
            .map((project: any) => renderProjectCard(project, true, project.creatorEmail === user?.email))}
        
        {/* The purely frontend "Create New Project" Placeholder Card goes here */}
    </div>
</div>
```

### Step 2: Hiding Destructive Actions
If a user is just a Member, they shouldn't even *see* the "Edit" or "Delete" three-dot menu. We hide this in the `renderProjectCard` function. 

Additionally, we pass a special boolean `isCreator` into the card so that the person who literally forged the project sees their project in a glowing, elevated frame to stand out.

```tsx
// The helper function accepts boolean flags identifying the user context
const renderProjectCard = (project: any, isManager: boolean, isCreator = false) => (
    <div className={`... ${
        // If they created it, give it a prominent white background, thick primary border, and shadow.
        isCreator
            ? 'bg-white border-2 border-primary/40 shadow-md'
            : 'bg-surface-container-lowest border border-outline-variant hover:shadow-lg'
    }`}>
        
        ...
        
        {/* Only render the three-dot action menu if they are a manager */}
        {isManager && (
            <div className="relative">
                <button onClick={() => setActiveDropdown(project.id)}>
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>
        )}
```

---

## 2. The Jira-Style Issue Hierarchy Database Model

The core of any project management app is tracking tasks. However, generating sequential visual IDs like `PROJ-1`, `PROJ-2`, `PROJ-3` safely across thousands of concurrent users requires extremely precise data modeling. 

Furthermore, Epics and Tasks are fundamentally the exact same thing (Title, Description, Status, Assignee, Project Key)—the only difference is an Epic acts as a "parent".

### Step 1: The Unified Single-Table Architecture
Instead of creating an `Epic.java` entity and a `Task.java` entity, we create a single, massive `Issue.java` entity. This accurately reflects how big enterprise tools like Jira work. 

```java
// Inside /model/Issue.java

@Entity
@Table(name = "issues")
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    // This is the formatted, absolute key. e.g., "PROJ-4"
    @Column(nullable = false, unique = true)
    private String issueKey; 

    // Is it an Epic, a Task, or a Bug?
    @Enumerated(EnumType.STRING)
    private IssueType type;

    // The SELF-REFERENCING magic. A Task is simply an Issue that points to an Epic (which is also an Issue!)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "epic_id")
    private Issue epic; 

    // ... standard title, description, status, priority fields ...
}
```

### Step 2: Preventing Race Conditions with Optimistic Locking
How do we know the next issue should be `PROJ-5`? We store that state (`nextIssueNumber`) physically inside the parent `Project` entity. 

However, if User A and User B both create a task at the exact same millisecond, they might both read `nextIssueNumber = 5`, and a collision occurs! We solve this by adding a `@Version` annotation.

```java
// Inside /model/Project.java

@Entity
public class Project {

    // ... standard fields ...

    @Column(nullable = false)
    private Integer nextIssueNumber = 1;

    // OPTIMISTIC LOCKING
    // Spring Boot automatically increments this 'version' variable on every database update.
    // If User A and User B both try to save the Project at 'version 3' at the exact same time,
    // User A will succeed (bumping project to version 4). 
    // User B's save will immediately crash and rollback because the DB version is now different from the memory version. 
    // This perfectly prevents duplicate ID numbers.
    @Version
    private Long version; 
}
```

By safely tracking sequence states with `@Version` and utilizing a self-referencing `Issue` entity for hierarchical data, we have laid a hyper-scalable, bulletproof foundation for the Agile Boards in Week 5 & 6!

---

## 3. The Application Architecture: Where do these files come from?

Before looking at the exact code flow, it's incredibly important to understand *why* we have so many different files. We are strictly following the industry-standard **MVC / 3-Tier Layered Architecture** for Spring Boot. We don't just dump all our code into one file because it would become mathematically impossible to test or safely upgrade. 

Here is exactly what every folder does and where the files "live":

### A. The React Frontend (`frontend/src/...`)
*   **`components/`**: Reusable lego blocks of UI (like `CreateProjectModal.tsx` or `Button.tsx`).
*   **`pages/`**: Full screens that combine multiple components (like `Dashboard.tsx`). 
*   **Flow**: The user clicks a button here, which fires an Axios HTTP request over the internet to our Backend.

### B. The Spring Boot Backend (`pmanage/src/main/java/.../`)
When the request hits our Java backend on Port 8080, it tunnels through 4 specific layers in order:

1.  **`controller/` (The API Doors):** Files like `ProjectController.java`. These act as the application's bouncers. They sit at the very front, check your JWT ID badge (Security), read your JSON payload, and pass it to the brains. **Controllers contain ZERO business logic.**
2.  **`service/` (The Brain):** Files like `ProjectService.java`. This is where the actual programming happens. It decides who gets to be a Manager, checks if names are too long, and enforces our app's rules. 
3.  **`repository/` (The Database Translators):** Files like `ProjectRepository.java`. Services don't know how to speak SQL. Instead, the Service asks the Repository to "save this object," and the Repository writes the exact SQL `INSERT INTO...` queries for us using Spring Data JPA.
4.  **`model/` (The Blueprints/Entities):** Files like `Project.java` or `Issue.java`. These represent the actual Tables in our PostgreSQL database. Every variable inside a model corresponds directly to a database column.

---

## 4. The End-to-End Project Creation Flow

Understanding exactly how data travels from a React button click, through the network, into the Java logic, and finally into the Postgres database is crucial. Here is the exact file order and execution flow when a user creates a new project.

### Phase 1: The React Frontend (`CreateProjectModal.tsx`)
When the user fills out the Project Name, Description, and adds Team Members, they click "Create Project". We intercept this and send an HTTP POST request to our Spring Boot API.

```tsx
// Inside frontend/src/components/CreateProjectModal.tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        // We must attach our JWT token to prove who we are
        const token = localStorage.getItem('token');
        
        // We package the form state into a JSON object and send it to the backend
        const response = await axios.post(
            'http://localhost:8080/api/v1/projects',
            {
                name: projectName,
                description: projectDescription,
                key: projectKey,
                leads: selectedLeads,
                members: selectedMembers,
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        // Tell the parent Dashboard to refresh its list!
        onCreate(); 
    } catch (error) {
        console.error("Failed to create project");
    }
};
```

### Phase 2: The Spring Boot Controller (`ProjectController.java`)
The request arrives at port 8080. Spring Boot automatically intercepts the JWT token, verifies the user is logged in, and passes the JSON payload to our Controller.

```java
// Inside pmanage/src/main/java/.../controller/ProjectController.java

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        // 1. Who is making this request? We extract their email directly from the verified JWT Security Context!
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentPrincipalName = authentication.getName(); 

        // 2. We pass the raw JSON data AND the verified email to the Service layer for processing
        ProjectResponse response = projectService.createProject(request, currentPrincipalName);
        
        // 3. Return a 201 Created HTTP status
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
```

### Phase 3: The Business Logic & Database Mapping (`ProjectService.java`)
This is where the actual architecture happens. We must transform the raw request into proper database rows (`Entities`), ensuring the creator is automatically assigned as a Project Manager.

```java
// Inside pmanage/src/main/java/.../service/ProjectService.java

@Transactional
public ProjectResponse createProject(CreateProjectRequest request, String creatorEmail) {
    
    // 1. Create the main Project row
    Project project = new Project();
    project.setName(request.getName());
    project.setDescription(request.getDescription());
    project.setProjectKey(request.getKey().toUpperCase());
    project.setCreatorEmail(creatorEmail);
    // nextIssueNumber defaults to 1 automatically in the entity

    // 2. Process all requested "Leads" into ProjectMember rows with PROJECT_MANAGER privileges
    boolean creatorIsInLeads = false;
    for (String email : request.getLeads()) {
        User leadUser = userRepository.findByEmail(email).orElseThrow();
        
        ProjectMember pm = new ProjectMember();
        pm.setProject(project);
        pm.setUser(leadUser);
        pm.setRole(ProjectRole.PROJECT_MANAGER); // <-- High privilege
        project.getMembers().add(pm);
        
        if (email.equals(creatorEmail)) creatorIsInLeads = true;
    }

    // 3. SECURE THE APP: Ensure the person who created the project is ALWAYS a Project Manager,
    // even if they forgot to add themselves to the Leads list on the frontend!
    if (!creatorIsInLeads) {
        User creatorUser = userRepository.findByEmail(creatorEmail).orElseThrow();
        ProjectMember pm = new ProjectMember();
        pm.setProject(project);
        pm.setUser(creatorUser);
        pm.setRole(ProjectRole.PROJECT_MANAGER);
        project.getMembers().add(pm);
    }

    // 4. Process all standard Members into ProjectMember rows with PROJECT_MEMBER privileges
    if (request.getMembers() != null) {
        for (String email : request.getMembers()) {
            // Guard: Don't downgrade someone to a Member if we already made them a Manager above
            boolean isAlreadyLead = project.getMembers().stream()
                    .anyMatch(m -> m.getUser().getEmail().equals(email) && m.getRole() == ProjectRole.PROJECT_MANAGER);

            if (!isAlreadyLead) {
                User memberUser = userRepository.findByEmail(email).orElseThrow();
                ProjectMember pm = new ProjectMember();
                pm.setProject(project);
                pm.setUser(memberUser);
                pm.setRole(ProjectRole.PROJECT_MEMBER); // <-- Lower privilege
                project.getMembers().add(pm);
            }
        }
    }

    // 5. Save everything to Postgres. Hibernate handles inserting the Project AND all the associated ProjectMembers!
    Project savedProject = projectRepository.save(project);
    
    // 6. Return a clean DTO back to the Controller
    return mapToResponse(savedProject, creatorEmail);
}
```

By strictly separating the **Frontend (React state & API requests)**, **Controller (Security & Routing)**, and **Service (Business rules & Database mapping)**, the code remains highly testable, secure, and professional.

***
