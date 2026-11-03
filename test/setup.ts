// Preloaded before any test module (see the bunfig.toml `[test] preload` entry).
import { mock } from "bun:test"

// `server-only` throws outside a React Server Component, and a test runs outside one. Mocking it
// lets a test import server modules, such as the router.
void mock.module("server-only", () => ({}))
