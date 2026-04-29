# Week 3 In-Depth Tutorial: Full-Stack Form Validation & UX (Step-by-Step for Teachers)

This document provides a highly detailed, chronological walkthrough of the code we wrote in Week 3. We will look at exactly how we secure our database against bad data using a two-layered defense: Spring Boot API constraints and React client-side validation.

---

## 1. The First Layer of Defense: React Client-Side Validation (Yup)

Before a user even clicks the "Register" button, we want to instantly validate their input. We do this in the user's browser (client-side) to provide immediate feedback and prevent unnecessary server traffic. We use a library called **Yup** to define exactly what a valid name, email, or password looks like.

### Step 1: Defining strict schemas (Yup)
In our React code, we define a mathematical schema that perfectly outlines the rules of our database.

```typescript
// From frontend/src/pages/Register.tsx
const validationSchema = Yup.object().shape({
    first_name: Yup.string()
        .min(2, 'First name must be at least 2 characters')
        .max(32, 'First name must be 32 characters or less')
        // Regex: Reject any string containing numeric digits [0-9]
        .matches(/^[^0-9]*$/, 'First name cannot contain numbers')
        // Regex: Reject any string containing blank spaces [\s]
        .matches(/^[^\s]*$/, 'First name cannot contain spaces')
        .required('First name is required'),
        
    // ... similar rules for last_name, email, password ...
});
```

### Step 2: Instant UI Feedback (Overriding Formik)
By default, standard web form libraries only validate data *after* you have finished typing and click away from the input box. We wrote a custom function to intercept this and calculate errors dynamically on every single keystroke.

```typescript
// From frontend/src/pages/Register.tsx

// Custom hook: Instantly check if an error exists the moment a user types a single character
const hasError = (fieldName: keyof typeof formik.values) => {
    return Boolean(formik.errors[fieldName] && 
        (formik.touched[fieldName] || (formik.values[fieldName] && formik.values[fieldName].length > 0)));
};

// ... inside the HTML rendering:
<input
    id="first_name"
    maxLength={32} // Hardware limit: physically prevents the user from typing more than 32 characters
    onChange={formik.handleChange}
    className={getInputClass('first_name')} // Turns the border red if hasError is true
/>

// Div dynamically appears showing exactly why they failed validation
{hasError('first_name') ? (
    <div className="text-red-500 text-xs">{formik.errors.first_name}</div>
) : null}
```

---

## 2. The Second Layer of Defense: Spring Boot API Validation

What happens if a hacker uses a tool like Postman to bypass our React website completely and tries to send an HTTP POST request directly to our Spring Boot backend with a 500-character name containing numbers and spaces? 

We must protect the API itself. We use **Jakarta Validation** (`@Valid`).

### Step 1: Enforcing Data Transfer Object (DTO) Constraints
We apply annotations directly onto the variables inside our Java classes describing the exact same rules React enforces.

```java
// From pmanage/src/main/java/.../dto/RegisterRequest.java
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 32, message = "First name must be between 2 and 32 characters")
    @Pattern(regexp = "^[^0-9]*$", message = "First name cannot contain numbers")
    @Pattern(regexp = "^[^\\s]*$", message = "First name cannot contain spaces")
    private String firstName;
    
    // ... similar for lastName, password ...
}
```

### Step 2: Activating the Rules in the Controller
Simply adding the annotations above doesn't turn them on. We must explicitly instruct Spring to validate incoming JSON payloads by placing the `@Valid` tag next to `@RequestBody`.

```java
// From pmanage/src/main/java/.../controller/AuthenticationController.java
@PostMapping("/register")
public ResponseEntity<AuthenticationResponse> register(
        // @Valid triggers the rules we wrote in RegisterRequest.java BEFORE executing any code
        @Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.ok(service.register(request));
}
```

---

## 3. Global Exception Handling (Connecting Backend Errors to Frontend UI)

When `@Valid` blocks a hacker's request (e.g., they sent empty data), Spring Boot crashes and throws a `MethodArgumentNotValidException`, returning a generic, ugly HTTP 500 Server Error to the frontend.

We want to cleanly catch that crash, intercept the specific error messages we wrote in Java (like *"First name cannot contain numbers"*), and send them back to React as a clean JSON object. 

### Step 1: The ControllerAdvice Interceptor
We use `@ControllerAdvice`. Think of this as a global safety net that wraps around our entire API. If any controller anywhere in the application crashes with a validation error, this class catches it.

```java
// From pmanage/src/main/java/.../exception/GlobalExceptionHandler.java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) // Forces the HTTP Response code to 400 instead of 500
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        
        // Create an empty Map (acts like a JSON Object)
        Map<String, String> errors = new HashMap<>();
        
        // Loop through everything that failed validation
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField(); // e.g., "firstName"
            String errorMessage = error.getDefaultMessage();    // e.g., "First name cannot contain numbers"
            
            // Put it in the map!
            errors.put(fieldName, errorMessage);
        });
        
        // Sends back clean JSON to React: { "firstName": "First name cannot contain numbers" }
        return ResponseEntity.badRequest().body(errors); 
    }
}
```

### Step 2: Injecting API Errors Back into Formik
Finally, when Axios in React receives that structured HTTP 400 Bad Request error from Spring Boot, we grab that clean JSON Object and shove it directly into our Formik state. Formik doesn't know the difference between a client-side error and a server-side error—it just turns the input field red!

```typescript
// From frontend/src/pages/Register.tsx (Inside our form submission function)
try {
    const response = await axios.post('http://localhost:8080/api/v1/auth/register', { ... });
    // Success logic...
} catch (error: any) {
    // If Spring Boot returns our structured HTTP 400 Validation Error Map
    if (error.response?.status === 400 && typeof error.response.data === 'object') {
        
        // Grab the map our Java Exception Handler made!
        const springBootErrors = error.response.data; 
        
        // Translate Spring Boot variable names (firstName) to React variable names (first_name)
        const formikErrors: Record<string, string> = {};
        if (springBootErrors.firstName) formikErrors.first_name = springBootErrors.firstName;
        if (springBootErrors.lastName) formikErrors.last_name = springBootErrors.lastName;
        
        // Tell Formik to instantly display the Java error messages directly on the input boxes!
        if (Object.keys(formikErrors).length > 0) {
            formik.setErrors(formikErrors); 
        }
    }
}
```

**The Loop is Complete!**
We now have an impenetrable, mathematically verified validation flow that is safely enforced on the Java API but seamlessly communicated to the user through the React frontend.


***

