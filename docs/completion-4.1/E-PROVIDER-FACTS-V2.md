# E — Provider facts v2 (long output: non-streaming vs streaming vs batch)

Researched 2026-11-17 from official public documentation only. No API call was made, and no key, account or credential was used.

**Grades.** A = read verbatim on the official page (quoted). B = inference from what the page says. **not found** = not documented on the pages read.

**Pages read**
- Anthropic: [errors](https://platform.claude.com/docs/en/api/errors) · [streaming](https://platform.claude.com/docs/en/build-with-claude/streaming) · [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) · [batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing) · [effort](https://platform.claude.com/docs/en/build-with-claude/effort) · [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- OpenAI (the pages at platform.openai.com redirect with a 301 to developers.openai.com): [model gpt-6.1-sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) · [streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses) · [streaming events reference](https://developers.openai.com/api/reference/resources/responses/streaming-events) · [background mode](https://developers.openai.com/api/docs/guides/background) · [batch](https://developers.openai.com/api/docs/guides/batch) · [reasoning](https://developers.openai.com/api/docs/guides/reasoning) · [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) · [error codes](https://developers.openai.com/api/docs/guides/error-codes)

---

## Q1. Long non-streaming requests: server time limit, guidance on large max output, idle-connection drops

| Provider | Fact | Grade | Source |
|---|---|---|---|
| Anthropic | "Consider using the streaming Messages API or Message Batches API for long-running requests, especially those over 10 minutes." | A | [errors#long-requests](https://platform.claude.com/docs/en/api/errors#long-requests) |
| Anthropic | "Avoid setting a large `max_tokens` value without using the streaming Messages API or Message Batches API" | A | same |
| Anthropic | "Some networks might drop idle connections after a variable period of time, which can cause the request to fail or time out without receiving a response from Anthropic." | A | same |
| Anthropic | "If you are building a direct API integration, setting a TCP socket keep-alive can reduce the impact of idle connection timeouts on some networks." | A | same |
| Anthropic | "The Anthropic SDK validates that your non-streaming Messages API requests are not expected to exceed a 10-minute timeout." | A | same |
| Anthropic | Server time limit exists: "The API also returns `timeout_error` with other status codes, such as a 500 when a request reaches the server's time limit before the response starts. For long-running Messages API requests, use the streaming Messages API." | A | [errors#http-errors](https://platform.claude.com/docs/en/api/errors#http-errors) |
| Anthropic | The value of that server-side time limit (in seconds or minutes) | not found | — |
| Anthropic | "This is especially useful for requests with large `max_tokens` values, where the SDK requires streaming to avoid HTTP timeouts." | A | [streaming](https://platform.claude.com/docs/en/build-with-claude/streaming) |
| Anthropic | Sonnet 5.5: "For agentic coding, set `max_tokens` to 128,000, the model's maximum, and stream the response" | A | [effort](https://platform.claude.com/docs/en/build-with-claude/effort) |
| Anthropic | With a raw (non-SDK) HTTP client, a 48,000-token non-streaming request is not blocked by the client, but it is exposed to the server time limit and to idle drops on the network path. | B | inferred from the rows above |
| OpenAI | "By default, when you make a request to the OpenAI API, we generate the model's entire output before sending it back in a single HTTP response. When generating long outputs, waiting for a response can take time." | A | [streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses) |
| OpenAI | "A `APITimeoutError` error indicates that your request took too long to complete and our server closed the connection. This could be due to a network issue, a heavy load on our services, or a complex request that requires more processing time." | A | [error-codes](https://developers.openai.com/api/docs/guides/error-codes) |
| OpenAI | "Background mode enables you to execute long-running tasks on models like GPT-5.2 and GPT-5.2 Pro reliably, without having to worry about timeouts or other connectivity issues." | A | [background](https://developers.openai.com/api/docs/guides/background) |
| OpenAI | A numeric server-side time limit for a non-streaming `/v1/responses` request | not found | — |
| OpenAI | Explicit guidance against a large `max_output_tokens` without streaming | not found | — |
| OpenAI | Idle-connection drop guidance (keep-alive) | not found | — |

## Q2. Billing when the client disconnects or times out mid-request

| Provider | Fact | Grade | Source |
|---|---|---|---|
| Anthropic | Whether a synchronous or streaming request is billed (fully or partly) after the client disconnects or times out | **not found** | Searched the errors, streaming and batch pages. An official-domain search found no page on it. |
| Anthropic | Batch only: `errored` — "You aren't billed for these requests."; `canceled` — "User canceled the batch before this request could be sent to the model. You aren't billed for these requests."; `expired` — "Batch reached its 24-hour expiration before this request could be sent to the model. You aren't billed for these requests." | A | [batch-processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing) |
| OpenAI | Whether a synchronous or streaming request is billed after the client disconnects | **not found** | Searched the streaming, background, reasoning and error pages. |
| OpenAI | Hitting the output cap is still billed: "This might occur before any visible output tokens are produced, meaning you could incur costs for input and reasoning tokens without receiving a visible response." | A | [reasoning](https://developers.openai.com/api/docs/guides/reasoning) |
| OpenAI | Batch expiry: "unfinished requests within that batch are cancelled, and any responses to completed requests are made available via the batch's output file. You will be charged for tokens consumed from any completed requests." | A | [batch](https://developers.openai.com/api/docs/guides/batch) |
| Both | Treat a disconnected request as possibly fully billed until the providers confirm otherwise. | B | conservative assumption; not documented |

## Q3. Streaming (SSE) on the endpoint under evaluation

| Provider | Fact | Grade | Source |
|---|---|---|---|
| Anthropic | Event flow: "1. `message_start`: contains a `Message` object with empty `content`. … 2. A series of content blocks, each of which has a `content_block_start`, any number of `content_block_delta` events, and a `content_block_stop` event. … 3. One or more `message_delta` events, indicating top-level changes to the final `Message` object. 4. A final `message_stop` event." | A | [streaming#event-types](https://platform.claude.com/docs/en/build-with-claude/streaming) |
| Anthropic | "Event streams might also include any number of `ping` events." | A | same |
| Anthropic | Usage and stop reason: `message_start` carries `usage.input_tokens`; the final `message_delta` carries `delta.stop_reason` and `usage.output_tokens`. "The token counts shown in the `usage` field of the `message_delta` event are *cumulative*." | A (event payloads below) | same |
| Anthropic | Thinking arrives as `thinking_delta` events in a `thinking` block. "a special `signature_delta` event is sent just before the `content_block_stop` event." | A | same |
| Anthropic | A separate thinking-token count in the stream's `usage` | not found (examples show only `output_tokens`) | same |
| Anthropic | Structured-output JSON: "Structured outputs also work with streaming. As responses arrive in stream events, you need to accumulate the full response before deserializing the JSON." (Java tab) | A | [structured-outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) |
| Anthropic | The JSON arrives as `text_delta` fragments of the `text` block, which the client must join before parsing. | B | inferred from the two rows above |
| Anthropic | Mid-stream errors: "an error can occur after the API returns a 200 response. In that case, error handling doesn't follow these standard mechanisms." Example: `event: error` / `data: {"type": "error", "error": {"type": "overloaded_error", "message": "Overloaded"}}` | A | [errors](https://platform.claude.com/docs/en/api/errors), [streaming#error-events](https://platform.claude.com/docs/en/build-with-claude/streaming) |
| OpenAI | Common events: "`response.created`, `response.output_text.delta`, `response.completed`, `error`". The reference also lists `response.in_progress`, `response.failed`, `response.incomplete`, `response.output_item.added/done`, `response.content_part.added/done`, `response.output_text.done`, `response.refusal.delta/done`. | A | [streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses), [events reference](https://developers.openai.com/api/reference/resources/responses/streaming-events) |
| OpenAI | Order: created → in_progress → output_item.added → content_part.added → output_text.delta… → output_text.done → content_part.done → output_item.done → completed / incomplete / failed. Every event carries a `sequence_number`. | B (order inferred from the reference layout and lifecycle names; no explicit ordering statement found) | events reference |
| OpenAI | Usage and status: the `response.completed` event carries the full `response`, with `status`, `incomplete_details` and `usage` {`input_tokens`, `output_tokens`, `output_tokens_details.reasoning_tokens`, `total_tokens`} (example below). `response.incomplete`: "An event that is emitted when a response finishes as incomplete." | A | events reference |
| OpenAI | Structured-output streaming: "You can use streaming to process model responses or function call arguments as they are being generated, and parse them as structured data." "We recommend relying on the SDKs to handle streaming with Structured Outputs." The example listens on `response.output_text.delta`, `response.refusal.delta` and `response.output_text.done`. | A | [structured-outputs#streaming](https://developers.openai.com/api/docs/guides/structured-outputs) |
| OpenAI | Mid-stream error event: `{"type": "error", "code": "ERR_SOMETHING", "message": "Something went wrong", "param": null, "sequence_number": 1}` | A | events reference (`error`) |
| OpenAI | Resumable streams: "create a Response with both `background` and `stream` set to `true`. You will want to keep track of a "cursor" corresponding to the `sequence_number` you receive in each streaming event." | A | [background](https://developers.openai.com/api/docs/guides/background) |

**Example payloads, copied verbatim**

Anthropic ([streaming](https://platform.claude.com/docs/en/build-with-claude/streaming)):
```
event: message_start
data: {"type": "message_start", "message": {"id": "msg_1nZdL29xx5MUA1yADyHTEsnR8uuvGzszyY", "type": "message", "role": "assistant", "content": [], "model": "claude-opus-5-5", "stop_reason": null, "stop_sequence": null, "usage": {"input_tokens": 25, "output_tokens": 1}}}

data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}

event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence":null}, "usage": {"output_tokens": 15}}

event: message_stop
data: {"type": "message_stop"}
```

OpenAI ([events reference](https://developers.openai.com/api/reference/resources/responses/streaming-events)):
```json
{"type": "response.output_text.delta", "item_id": "msg_123", "output_index": 0, "content_index": 0, "delta": "In", "sequence_number": 1, "logprobs": []}
```
`response.completed`, abridged to the relevant fields (the full example is on the page):
```json
{"type": "response.completed", "response": {"id": "resp_123", "status": "completed", "error": null, "incomplete_details": null, "max_output_tokens": null,
 "usage": {"input_tokens": 0, "output_tokens": 0, "output_tokens_details": {"reasoning_tokens": 0}, "total_tokens": 0,
           "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 0}}}, "sequence_number": 1}
```

## Q4. Batch API

| Provider | Fact | Grade | Source |
|---|---|---|---|
| Anthropic | Exists (Message Batches API). "All usage is charged at 50 percent of the standard API prices." | A | [batch-processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing) |
| Anthropic | Completion window: "most batches completing within 1 hour. … Batches expire if processing does not complete within 24 hours." Results: "available for 29 days after creation." | A | same |
| Anthropic | Models: "All active models support the Message Batches API." `claude-sonnet-5-5` is in the page's supportedModels list. | A | same |
| Anthropic | Features: "Almost any request you can make to the Messages API can be included in a batch." Not supported: "`stream`, `speed`, `fallbacks`, and `max_tokens: 0`". | A | same (FAQ) |
| Anthropic | Structured output (`output_config.format`) in a batch: not named explicitly, and not in the unsupported list. | B (likely supported) | same |
| Anthropic | Output headroom: "On the Message Batches API, … Claude Sonnet 5.5 … support up to 300k output tokens with the output-300k-2026-03-24 beta header." | A | [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Anthropic | Batch is not ZDR-eligible: "29-day retention; async storage required." | A | batch page metadata |
| OpenAI | Exists; endpoint `/v1/responses` is supported: `endpoint: "/v1/responses", completion_window: "24h"`. "50% cost discount compared to synchronous APIs" | A | [batch](https://developers.openai.com/api/docs/guides/batch) |
| OpenAI | "For now, the completion window can only be set to `24h`." "Each batch completes within 24 hours (and often more quickly)." | A | same |
| OpenAI | Model: gpt-6.1-sol page: "Batch \| `v1/batch` \| Supported"; "Batch and Flex prices are 50% lower than Standard." | A | [gpt-6.1-sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) |
| OpenAI | Structured outputs inside a batch | not found on the batch page (the model lists `structured_outputs` as supported) | — |

## Q5. Maximum output tokens

| Provider / model | Fact | Grade | Source |
|---|---|---|---|
| claude-sonnet-5-5 | "Max output: 128K tokens". Footnote: "Synchronous Messages API limit." Context window 1M tokens. | A | [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| claude-sonnet-5-5 | "Thinking counts toward `max_tokens` even when the thinking content isn't returned." | A | [effort](https://platform.claude.com/docs/en/build-with-claude/effort) |
| gpt-6.1-sol | "128,000 max output tokens"; "1,050,000 context window"; "Maximum input tokens: 922,000" | A | [gpt-6.1-sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) |
| gpt-6.1-sol | "`max_output_tokens`" cap: when hit, "a `status` of `incomplete` and `incomplete_details` with `reason` set to `max_output_tokens`"; "OpenAI recommends reserving at least 25,000 tokens for reasoning and outputs when you start experimenting with these models." | A | [reasoning](https://developers.openai.com/api/docs/guides/reasoning) |
| Both | A ceiling of 48,000 is within both models' limits. | B | from the rows above |

## Q6. Reasoning-effort controls and defaults

| Provider / model | Fact | Grade | Source |
|---|---|---|---|
| Anthropic | "Set `output_config.effort` on the request. With no value, the model's default level applies." Levels: `max`, `xhigh`, `high`, `medium`, `low`. | A | [effort](https://platform.claude.com/docs/en/build-with-claude/effort) |
| claude-sonnet-5-5 | "Claude Sonnet 5.5 supports all five effort levels, and `high` is the default on the Claude API." (The models overview also lists Default effort `high`.) | A | same; [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| claude-sonnet-5-5 | Thinking: "Adaptive". It can't be `disabled`; "Use `thinking: {"type": "between_tools"}` for the lowest thinking setting". `between_tools` at `xhigh` or `max` returns a 400 error. | A | [errors](https://platform.claude.com/docs/en/api/errors), [effort](https://platform.claude.com/docs/en/build-with-claude/effort) |
| claude-sonnet-5-5 | "Effort is a behavioral signal, not a strict token budget." | A | [effort](https://platform.claude.com/docs/en/build-with-claude/effort) |
| OpenAI | `reasoning.effort`: "Supported values are model-dependent and can include `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, and `max`." | A | [reasoning](https://developers.openai.com/api/docs/guides/reasoning) |
| gpt-6.1-sol | "`reasoning.effort` supports `low`, `medium` (default), `high`, `xhigh`, and `max`." "GPT-6.1 Sol … does not support `none` or `minimal` and defaults to `medium`." | A | [gpt-6.1-sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [reasoning](https://developers.openai.com/api/docs/guides/reasoning) |
| gpt-6.1-sol | Reasoning tokens "are billed as output tokens"; the count is in `usage.output_tokens_details`. | A | [reasoning](https://developers.openai.com/api/docs/guides/reasoning) |
| Both | The defaults differ (Sonnet 5.5 `high`, gpt-6.1-sol `medium`). Set effort explicitly on both so the comparison is like-for-like. | B | — |

## Q7. Anthropic sub-processor list

| Fact | Grade | Source |
|---|---|---|
| **Not retrieved.** https://trust.anthropic.com/subprocessors returns a shell page ("Anthropic Trust Center") whose content is rendered by scripts from `assets.vanta.com`. This session's network policy blocks that host (proxy `CONNECT` returned 403), so a headless browser rendered an empty body. No names, purposes or locations are listed here, and none were filled in from memory. | not found (blocked) | https://trust.anthropic.com/subprocessors |
| To finish this item: open the page in a normal browser and copy the Subprocessors tab, or rerun this research in an environment that allows `assets.vanta.com`. | — | — |

---

## Bearing on the decision (B, for the reviewer)
- Non-streaming at about 48K output tokens is the option Anthropic's docs advise against ("Avoid setting a large `max_tokens` value without using the streaming Messages API or Message Batches API"). The official SDK enforces this through its 10-minute check.
- Streaming gives final usage and stop reason in a defined place on both providers: Anthropic in the last `message_delta`, OpenAI in `response.completed` or `response.incomplete`. The structured JSON has to be joined from text deltas before parsing.
- Batch is 50% cheaper on both, with a 24-hour window, and both support the models under evaluation. It suits an offline evaluation if same-hour results aren't needed. Neither provider documents billing after a client disconnect on synchronous calls, so that question stays open.
