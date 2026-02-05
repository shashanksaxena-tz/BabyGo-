# Copilot Repository Instructions

This repository uses DevMind AI Skills for enhanced code assistance across all tech stacks.

## Available Skills

Use `@workspace` with these commands:

| Skill | Usage Example |
|-------|---------------|
| Code Review | `@workspace Review src/api/ for bugs and security issues` |
| Security Scan | `@workspace Security scan src/ for OWASP Top 10 vulnerabilities` |
| Test Generator | `@workspace Generate comprehensive tests for UserService` |
| Documentation | `@workspace Document this project with CLAUDE.md and README` |
| PR Review | `@workspace Review the current changes` |
| Folder Docs | `@workspace Create AI-CONTEXT.md for src/services/` |

## Universal Code Conventions

### Type Safety (All Languages)
- **Statically Typed Languages** (Java, C#, Go, TypeScript, Rust): Use explicit types, avoid `any`/`object`/`interface{}`
- **Dynamically Typed Languages** (Python, JavaScript, Ruby): Use type hints/annotations where available
- **Examples:**
  ```java
  // Java - Always specify generics
  List<User> users = new ArrayList<>();
  ```
  ```csharp
  // C# - Use nullable reference types
  public User? GetUser(int id) { }
  ```
  ```python
  # Python - Use type hints
  def get_user(user_id: int) -> Optional[User]:
  ```
  ```typescript
  // TypeScript - Avoid any
  function getUser(id: number): User | null { }
  ```

### Error Handling (All Languages)
- Always handle errors explicitly
- Log errors with context before propagating
- Return errors, don't swallow them
- Use language-appropriate patterns:
  - **Java/C#**: Try-catch with specific exceptions
  - **Go**: Check `error` return values
  - **Rust**: Use `Result<T, E>`
  - **JavaScript/TypeScript**: Try-catch for async, Error objects
  - **Python**: Try-except with specific exception types

### Security (Universal Principles)
- **Never hardcode secrets** - Use environment variables or secret managers
- **Validate all user input** - Sanitize before use
- **Use parameterized queries** - Never string concatenation for SQL
- **Implement proper authorization** - Check permissions on every protected endpoint
- **Use secure defaults** - Fail closed, not open

### Naming Conventions (Language-Specific)
- **Java/C#**: PascalCase for classes, camelCase for methods/variables
- **Python/Ruby**: snake_case for everything except classes (PascalCase)
- **Go**: PascalCase for exported, camelCase for unexported
- **JavaScript/TypeScript**: camelCase for variables/functions, PascalCase for classes/components
- **Rust**: snake_case with exceptions for type names (PascalCase)

### Documentation Standards
- **Public APIs**: Always document (Javadoc, XML comments, docstrings, JSDoc)
- **Complex Logic**: Add inline comments explaining *why*, not *what*
- **Examples**: Provide usage examples for non-trivial functions
- **README**: Keep updated with setup instructions and architecture overview

## Testing Standards (Framework-Agnostic)

### Test Categories
1. **Happy Path** - Normal success cases
2. **Edge Cases** - Empty inputs, null values, boundary conditions
3. **Error Cases** - Invalid input, system failures, timeouts

### Framework Examples
```python
# Python (pytest)
def test_user_creation_success():
    user = create_user({"name": "John"})
    assert user.name == "John"
```

```javascript
// JavaScript (Jest/Vitest)
test('creates user successfully', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
});
```

```java
// Java (JUnit)
@Test
public void testUserCreationSuccess() {
    User user = createUser(new UserRequest("John"));
    assertEquals("John", user.getName());
}
```

```csharp
// C# (xUnit/NUnit)
[Fact]
public void TestUserCreationSuccess()
{
    var user = CreateUser(new UserRequest("John"));
    Assert.Equal("John", user.Name);
}
```

```go
// Go (testing)
func TestUserCreationSuccess(t *testing.T) {
    user := CreateUser(UserRequest{Name: "John"})
    if user.Name != "John" {
        t.Errorf("Expected John, got %s", user.Name)
    }
}
```

## Project Context

Refer to `AGENTS.md` in the project root for detailed AI agent instructions.
