# AGENTS.md

# AI Development Rules

This project is developed using OpenCode with a local LLM.

## Primary Objective

Your objective is to complete real software projects with production-quality code.

Do not optimize for short examples.

Optimize for finished implementations.

---

# Development Workflow

Always follow this order:

1. Understand the existing project.
2. Read related files before making changes.
3. Analyze dependencies.
4. Create a short implementation plan.
5. Implement the solution.
6. Review your own changes.
7. Verify correctness.
8. Explain important decisions.

---

# Project Awareness

Always preserve:

- Existing architecture
- Existing coding style
- Folder structure
- Naming conventions

Do not rewrite unrelated code.

Modify only what is necessary.

---

# Coding Standards

Always write:

- Production-ready code
- Clean code
- Readable code
- Maintainable code

Always include:

- Error handling
- Input validation
- Edge case handling
- Proper logging when appropriate

Avoid unnecessary abstractions.

Avoid duplicate code.

Prefer simple solutions.

---

# Debugging

When fixing bugs:

1. Find the root cause.
2. Explain it briefly.
3. Apply the smallest reliable fix.
4. Verify that no regression is introduced.

---

# Refactoring

Improve code only when it provides clear value.

Never perform large refactoring unless requested.

Always preserve behavior.

---

# Performance

Consider:

- Algorithm complexity
- Memory usage
- Database efficiency
- Network efficiency

Optimize only when beneficial.

---

# Security

Always consider:

- SQL Injection
- XSS
- CSRF
- Authentication
- Authorization
- Sensitive data exposure
- Input validation

---

# Framework Rules

Automatically follow best practices for:

- PHP
- Laravel
- Nuxt
- Vue
- React
- Flutter
- Unity
- Node.js
- Python
- Docker
- Linux

Adapt to the framework already used by the project.

---

# Git

Never rewrite git history.

Never force push.

Never remove files unless requested.

Generate meaningful commit messages when requested.

---

# Large Tasks

For large features:

Break the work into logical phases.

Finish one phase completely before moving to the next.

Do not stop after planning.

Continue implementation whenever possible.

---

# Code Review

Always verify:

- Correctness
- Security
- Performance
- Readability
- Maintainability
- Scalability

Review your own output before responding.

---

# Communication

Always respond in Korean.

Keep source code, API names, commands, file paths, libraries, class names, and technical keywords in English.

Keep explanations concise.

Prefer working code over long explanations.

If multiple solutions exist:

Recommend one solution first.

Then explain the trade-offs.

---

# AI Behavior

Think before coding.

Never invent APIs.

Never invent library features.

Never guess project structure.

Read existing files before modifying them.

Ask for clarification only when absolutely necessary.

Complete implementations whenever possible.

Avoid placeholder code unless explicitly requested.

Always produce code that could realistically be committed to the project.

If the requested feature is reasonably implementable:

Do not stop after giving an explanation.

Continue until the feature is implemented.

Only stop when:

- required information is missing
- external resources are unavailable
- the user requests to stop