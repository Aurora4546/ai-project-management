# Week 2 In-Depth Tutorial: Security, Databases & React Frontend (Step-by-Step for Teachers)

This document provides a highly detailed, chronological walkthrough of the code we wrote in Week 2. We will look at exactly how data moves from the database, gets encrypted, turned into a token, and sent to a React frontend.

---

## 0. Prerequisite (Week 1 Recap): How Was React Configured?

Before diving into the Week 2 Security and Integration steps, we need to understand the Frontend foundation we built. 

### Which Version of React Did We Use?
We are using **React Version 19.2** (specifically `^19.2.0` in our `package.json`), running alongside **TypeScript**. 

### How Did We Set It Up?
Instead of the older `Create React App (CRA)` command, we used a modern build tool called **Vite**. 
We initialized the project inside the `/frontend` directory by running a terminal command provided by Vite (something like `npm create vite@latest frontend -- --template react-ts`). This instantly downloaded all necessary React libraries and scaffolded the project structure for us.

### Why Did We Choose Vite?
If your teacher asks why we used Vite instead of standard tools like Webpack or Create React App, explain these massive advantages:

1.  **Instant Server Start:** Older build tools trace through your entire application to bundle every single file before the local server can even turn on. Vite uses "Native ES Modules" provided by modern browsers to serve source code over native ESM. This means the server turns on in less than a second regardless of app size.
2.  **Lightning Fast Hot Module Replacement (HMR):** When you change a line of code in a component, you don't want to wait 5 seconds for the browser to refresh. Vite instantly replaces just that single module in the browser without losing application state.
3.  **Built-in TypeScript Support:** Vite compiles TypeScript natively out of the box incredibly fast using `esbuild`. 
4.  **Modern Defaults:** Since Create React App is officially deprecated by the React team, Vite is the industry standard for new Single Page Applications (SPAs).

---

## 1. The Database ORM Layer (Where User Data Lives)

Before anyone can log in, we need a way to store users in PostgreSQL without writing raw SQL queries. We use **Object-Relational Mapping (ORM)** via Hibernate/Spring Data JPA.

### Step 1: Mapping the User Entity (`User.java`)
We created a normal Java class and used `@Entity` to tell Spring, "This Java class directly represents a table in our database."

```java
// From pmanage/src/main/java/.../model/User.java

@Entity
@Table(name = "users") // Tells Postgres to name the table 'users'
public class User implements UserDetails {

    @Id // This is the Primary Key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-increments (1, 2, 3...)
    private Long id;

    private String firstName;
    private String lastName;

    @Column(unique = true, nullable = false) // Database rule: emails must be unique and not null
    private String email;

    @Column(nullable = false)
    private String password;
    
    // ... UserDetails override methods (like getAuthorities) ...
}
```

### Step 2: Accessing the Database (`UserRepository.java`)
To actually save or find these users, we create an interface extending `JpaRepository`. We don't have to write any code here! Spring Boot automatically writes the SQL statements for us just by reading our method names.

```java
// From pmanage/src/main/java/.../repository/UserRepository.java
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring translates this to: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);
    
    // Spring translates this to: SELECT COUNT(*) > 0 FROM users WHERE email = ?
    boolean existsByEmail(String email);
}
```

---

## 2. Password Encryption Details

We **never** save passwords as plain text in the database. If the database leaks, the hackers would have everyone's passwords. Instead, we use a one-way mathematical function called **BCrypt**.

### Step 1: Configuring the BCrypt Bean (`ApplicationConfig.java`)
We tell Spring Boot to use the `BCryptPasswordEncoder` globally for our application.

```java
// From pmanage/src/main/java/.../config/ApplicationConfig.java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### Step 2: Hashing during Registration (`AuthenticationService.java`)
When a user submits the Registration form on the frontend, the data hits our `register()` method. Notice how we intercept the password and hash it *before* passing the `User` object to the `UserRepository` to save it to the DB.

```java
// From pmanage/src/main/java/.../service/AuthenticationService.java
public AuthenticationResponse register(RegisterRequest request) {
    // ...
    var user = User.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            
            // This turns "password123" into something like: 
            // "$2a$10$wODZ8x..." before it goes to Postgres!
            .password(passwordEncoder.encode(request.getPassword())) 
            
            .build();

    repository.save(user); // Saved to PostgreSQL safely!
    // ...
}
```

---

## 3. The Login Cycle & JWT Generation

Imagine you are standing in front of the browser and you just typed in your email and password, then clicked "Log In". Here is how the system handles it.

### Step 1: React Catches the Click (`Login.tsx`)
Our frontend uses a library called **Formik** to grab the email and password, validates it with **Yup**, and uses **Axios** to send a POST request.

```typescript
// From frontend/src/pages/Login.tsx
// We use Axios to send a "POST" request over the internet to our Spring API
const response = await axios.post('http://localhost:8080/api/v1/auth/login', {
    email: values.email,
    password: values.password
});

// If the backend replies with a token, we save it in the browser
if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    setSuccessMsg('Login successful!');
}
```

### Step 2: Verifying the Credentials (`AuthenticationService.java`)
The request travels through the `AuthenticationController` and lands in the `AuthenticationService`. 

We tell Spring's built-in `AuthenticationManager` to check if the provided password matches the hashed BCrypt password saved in our PostgreSQL database (which we set up in section 1 and 2). 

```java
// From pmanage/src/main/java/.../service/AuthenticationService.java
public AuthenticationResponse authenticate(AuthenticationRequest request) {
    // 1. This checks if the BCrypt hash matches the plain text attempt
    authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
            )
    );
    
    // 2. If it matched, go fetch the actual User object from the database
    var user = repository.findByEmail(request.getEmail()).orElseThrow();
            
    // 3. Generate a new JWT token for this user
    var jwtToken = jwtService.generateToken(user);
    
    // 4. Send the token back to the React frontend
    return AuthenticationResponse.builder()
            .token(jwtToken)
            .build();
}
```

### Step 3: Generating the JSON Web Token (`JwtService.java`)
In the previous step, we called `jwtService.generateToken(user)`. Here is exactly how that magic happens.

A JSON Web Token (JWT) is essentially a digital ID card. It has three parts: a Header, a Payload (the data), and a Signature.

```java
// From pmanage/src/main/java/.../security/JwtService.java

// We store a very long secret key string here
@Value("${application.security.jwt.secret-key}")
private String secretKey;

public String generateToken(UserDetails userDetails) {
    return Jwts
            .builder()
             // PAYLOAD: We put the user's email into the "Subject" claim of the token
            .setSubject(userDetails.getUsername()) 
            
            // PAYLOAD: Set when it was created and when it expires (24 hours)
            .setIssuedAt(new Date(System.currentTimeMillis())) 
            .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 24)) 
            
            // SIGNATURE: We cryptographically sign the whole token using our Secret Key
            // using the HMAC SHA-256 algorithm.
            .signWith(getSignInKey(), SignatureAlgorithm.HS256) 
            
            .compact(); // Squashes it into a single string like "eyJhbGc..."
}
```
**Why do we do this?** Because tokens sit in the user's browser, users can *see* the token data. But because we `signWith(secretKey)`, if a user tries to alter the token (e.g., to change their email to an admin's email), the cryptographic signature breaks. When Spring Boot receives the tampered token later, it will immediately reject it.

### Step 4: Returning to React (The Loop Completes)
The backend bundles this newly generated JWT token into a JSON response and sends it over the internet (HTTP 200 OK) back to React.

We are now back in `Login.tsx` (from Step 1).
React sees `response.data.token`, and executes: `localStorage.setItem('token', response.data.token);`

Our React application has securely saved the token inside the user's browser memory. The backend is completely stateless—it doesn't keep a list of who is logged in. Instead, for every future request the user makes, React will attach this token, and Spring Boot will just verify the math on the signature. 

**The cycle is complete.**

**Why do we do this?**
1.  **Stateless Backend (REST API):** Our Spring Boot backend does not remember who is logged in via temporary server "sessions". By using JWT, the backend is completely stateless. Every request must carry its own proof of authentication (the token). This makes our server fast, scalable, and easy to deploy.
2.  **Separation of Concerns (MVC Pattern in Java):** We strictly separated our Java code into layers. 
    *   **Controllers:** Only handle HTTP traffic.
    *   **Services:** Only handle business logic and decision-making.
    *   **Repositories:** Only handle database saving/loading.
3.  **Strict Global UI Guidelines (React):** By configuring Tailwind's `index.css` with exact Hex variables (`#1E293B` for primary, `#F8F9FA` for canvas) and removing all external shadows and dark-modes, we forced the application into a highly professional, strict minimalist design system right from the foundation. No developer can accidentally break the styling rules because they are baked deeply into the Tailwind configuration.

---

## 4. Cross-Origin Resource Sharing (CORS) & Trust

Why can React access the backend API, but if you type `http://localhost:8080/api/v1/auth/login` directly into your browser URL bar, you get an error (or a blank page)?

### Step 1: The Browser's Security Policy
By default, web browsers have a strict security rule called the **Same-Origin Policy**. This rule says: "If a user is visiting a website running on `http://localhost:5173` (our React app), that website is NOT allowed to secretly make HTTP requests to a different server like `http://localhost:8080` (our Spring Boot app)." 

This prevents malicious websites from secretly sending requests to your bank's API while you are browsing the web.

### Step 2: Configuring CORS in Spring Boot (`SecurityConfiguration.java`)
To tell the browser, "Hey, it is safe to let `http://localhost:5173` talk to my API!", we use **CORS** (Cross-Origin Resource Sharing).

In our `SecurityConfiguration.java`, we wrote explicitly who is allowed to talk to our backend:

```java
// From pmanage/src/main/java/.../security/SecurityConfiguration.java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // 1. EXACTLY who is allowed to talk to us? (Our React App!)
    configuration.setAllowedOrigins(List.of("http://localhost:5173"));
    
    // 2. What kind of HTTP methods are they allowed to use?
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    
    // 3. What Headers are they allowed to send? (They need to send "Authorization" for tokens!)
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    
    // Apply this rule to every single URL in our API ("/**")
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

### Step 3: The Preflight Request (OPTIONS)
When React uses Axios to say `axios.post('http://localhost:8080/api/v1/auth/login')`, the browser actually pauses the request.

Before sending your POST request, the browser automatically sends an invisible HTTP request called an **OPTIONS** (or "Preflight") request.
It asks Spring Boot: *"Hey, React is trying to POST some JSON to you from localhost:5173. Do you trust them?"*

Because of our `corsConfigurationSource()` Bean from Step 2, Spring Boot replies: *"Yes, I explicitly allowed `http://localhost:5173`, and I allow POST requests!"*

Only after receiving that permission does the browser actually send your email and password.

If you try to access the Spring Boot API directly by typing the URL into your browser, there is no React app making the call to a different server. It's just a raw HTTP GET request to a POST endpoint via the URL bar, so Spring Boot and the browser block it because you have no POST payload, have no token, and aren't originating from the React domain via AJAX.
