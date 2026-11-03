![Dirstarter](https://dirstarter.com/opengraph.png)

# DirStarter - Next.js Directory Boilerplate

DirStarter is a complete Next.js boilerplate for building profitable directory websites. Make money from day one with our battle-tested stack and built-in monetization features.

## Author

This project is created by [Piotr Kulpinski](https://kulpinski.dev), the founder of [OpenAlternative](https://openalternative.co), [DevSuite](https://devsuite.co) and other directory websites. This boilerplate is the fruit of years of trial and error, and I'm sharing it with you to save you the time and effort it took me to build it.

If you are interested in building profitable directory websites, please follow me on X: [@piotrkulpinski](https://x.com/piotrkulpinski) or BlueSky: [@kulpinski.dev](https://bsky.app/profile/kulpinski.dev).

## Documentation

The documentation is available on the [website](https://dirstarter.com/docs). It includes guides, tutorials, and detailed explanations of the code. I designed it to be as beginner-friendly as possible, so you can start making money from day one.

If you found anything that could be improved, please let me know or contribute to the documentation yourself.

## MCP Servers

The site runs two MCP servers, so AI agents can work with the directory.

### Public server

`https://your-site.com/mcp` needs no sign-in. Assistants such as Claude, ChatGPT and Grok use it to recommend tools from the directory: `search_tools`, `get_tool` and `list_categories`. Results are ordered by relevance alone, because assistant directories ban paid placement. Each website link goes through `/go/<slug>`, which records the click. Set `affiliateLinks` in `config/mcp.ts` to send those visits through tools' affiliate links, each with a "Paid link" disclosure. It is off by default, since the assistant directories don't address affiliate links. The server takes up to 1,000 requests per address and 20,000 in total per hour, set in `config/mcp.ts`. With Highseat's `HIGHSEAT_SECRET` set, every tool call on either server is recorded as an `mcp_tool_call` event: the tool, the client, the status, the number of results and the duration, never the arguments.

### Admin server

Admins can manage the directory's content from an AI agent through `/api/mcp`. Turn it on by setting `MCP_SECRET` (generate it with `openssl rand -hex 32`). The agent acts as the site's first admin account. Then add it to Claude Code:

```bash
claude mcp add --transport http dirstarter https://your-site.com/api/mcp --header "Authorization: Bearer <MCP_SECRET>"
```

Any client that can send a header connects the same way. To revoke access, change `MCP_SECRET` and redeploy.

The admin tools cover tools, categories, tags, blog posts and reports. None of them deletes anything.

### Adding a tool

Add `meta.mcp` to a procedure: a `name`, a `description` and `annotations`, plus optional `defaults` (input the tool fills in for agents) and `omit` (fields left out of the result). A procedure whose permission a guest holds goes on the public server, and any other on the admin server. `bun test` keeps each server within 25 tools and 25 KB.

## Third-Party Services

Dirstarter uses the following third-party services:

- Database: [Postgres](https://postgres.org)
- Analytics: [Highseat](https://highseat.com)
- Marketing & Transactional Email: [Resend](https://resend.com)
- Scraping: [Jina](https://jina.ai)
- File Storage: [AWS S3](https://aws.amazon.com/s3)
- Payments: [Stripe](https://stripe.com)
- Screenshots: [ScreenshotOne](https://kulp.in/screenshotone)

Make sure to set up accounts with these services and have the credentials ready.

## License

For any details on the license, please refer to the [License Policy](https://dirstarter.com/license-policy) page.
