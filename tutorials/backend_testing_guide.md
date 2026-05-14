# Guide: Understanding and Running Backend Tests

This guide explains how to execute the backend test suite, interpret the results, and understand the architecture behind our testing strategy.

## 1. How to Run the Tests

You can run the entire test suite using the Maven Wrapper included in the project. Open your terminal in the `pmanage` directory and run:

```powershell
# In the pmanage folder
.\mvnw.cmd test
```

### What to Look For:
- **During Execution**: You will see Spring Boot logs and Hibernate SQL queries (in white/gray text) as tests interact with the in-memory database.
- **Success**: Look for a green summary at the end:
  `BUILD SUCCESS`
  `Tests run: 23, Failures: 0, Errors: 0, Skipped: 0`
- **Failure**: If a test fails, Maven will show `BUILD FAILURE` and list the specific class and method that failed, along with the "Assertion Error" (e.g., *Expected 201 but got 403*).

---

## 2. Where to Find the Results

### Console Output
The most immediate place is your terminal. Maven prints a summary for each test class as it finishes.

### Report Files
For detailed logs of every test run, Maven generates reports in the `target` folder:
- **Path**: `pmanage/target/surefire-reports/`
- **Files**: `.txt` and `.xml` files containing the full stack trace of any errors.

---

## 3. How the Tests Work (The 3 Layers)

We use **Slice Testing**, which means we only load the parts of the application needed for each specific test. This makes them fast and reliable.

### Layer 1: Repository Tests (Database Logic)
- **Example**: `ProjectRepositoryTest.java`
- **Annotation**: `@DataJpaTest`
- **What it does**: It starts a "mini" database (H2) in memory. It saves a real entity (like a Project) and then tries to find it using our repository methods.
- **Goal**: Verifies that our SQL queries and database relationships (JPA) are correct.

### Layer 2: Service Tests (Business Logic)
- **Example**: `IssueServiceTest.java`
- **Annotation**: `@ExtendWith(MockitoExtension.class)`
- **What it does**: These are **Unit Tests**. We don't use a database here. Instead, we "mock" (fake) the Repository. We tell the mock: *"When the service asks for Project X, return this fake object."*
- **Goal**: Verifies that our calculations, validations, and logic flows work correctly without worrying about the database.

### Layer 3: Controller Tests (API & Security)
- **Example**: `IssueControllerTest.java`
- **Annotation**: `@WebMvcTest`
- **What it does**: It starts the Web layer but NOT the services. We use `MockMvc` to send "fake" HTTP requests (GET, POST) to our endpoints. We even simulate security by injecting a mock JWT token.
- **Goal**: Verifies that our API returns the right JSON, handles errors (404, 403) correctly, and that our security filters are protecting the routes.

### The "Pulse" Test: Context Load
- **File**: `PmanageApplicationTests.java`
- **Annotation**: `@SpringBootTest`
- **Goal**: This is the most important test. It tries to start the **entire** application context. If this passes, it means all your beans, configurations, and dependencies are wired correctly.

---

## 4. Key Configurations for Success

- **PostgreSQL Mode**: We told the test database (H2) to "pretend" it is PostgreSQL. This ensures that features like `UUID` and complex column types work exactly like they do in production.
- **Test Profile**: We use `@ActiveProfiles("test")`. This tells Spring to ignore production-only tasks (like real AI calls or background database migrations) that would fail without a real server.

---

### Pro-Tip: Running a Single Test
If you are working on one file and don't want to wait for all 23 tests, you can run just that class:
```powershell
.\mvnw.cmd test -Dtest=ProjectControllerTest
```
