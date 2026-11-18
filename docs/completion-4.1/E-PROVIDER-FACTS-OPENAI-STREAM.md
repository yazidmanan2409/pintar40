# E — OpenAI Responses API streaming facts (for the streaming adapter)

**Read date:** 2026-11-17 (UTC), from the official pages below (Markdown versions, fetched by appending `.md` to each page URL). This is documentation only: no API call was made, and no key or credential was used.

**Grades.** A = quoted verbatim from an official page. B = inference. **not documented** = not found on the pages read.

**Pages read**
- REF-EVENTS: https://developers.openai.com/api/reference/resources/responses/streaming-events
- REF-CREATE: https://developers.openai.com/api/reference/resources/responses/methods/create
- REF-OVERVIEW: https://developers.openai.com/api/reference/overview
- G-STREAM: https://developers.openai.com/api/docs/guides/streaming-responses
- G-SO: https://developers.openai.com/api/docs/guides/structured-outputs
- G-REASON: https://developers.openai.com/api/docs/guides/reasoning
- G-RATE: https://developers.openai.com/api/docs/guides/rate-limits
- G-ERR: https://developers.openai.com/api/docs/guides/error-codes
- G-BG: https://developers.openai.com/api/docs/guides/background
- MODEL: https://developers.openai.com/api/docs/models/gpt-6.1-sol

(platform.openai.com/docs/... returns a 301 redirect to developers.openai.com.)

## 1. Request flag and SSE framing

| Fact | Grade | Source |
|---|---|---|
| "`stream: optional boolean or null (default: false)` — If set to true, the model response data will be streamed to the client as it is generated using server-sent events." | A | REF-CREATE |
| "To start streaming responses, set `stream=True` in your request to the Responses endpoint" | A | G-STREAM |
| "When you create a Response with `stream` set to `true`, the server will emit server-sent events to the client as the Response is generated." | A | REF-EVENTS |
| Each event schema states its type, e.g. "`type: "response.created"` — The type of the event. Always `response.created`." | A | REF-EVENTS |
| The wire framing (`event:` and `data:` lines, any terminator such as `[DONE]`) | **not documented** on the pages read (REF-CREATE only links to MDN's SSE event-stream format) | — |
| That the SSE `event:` name always equals `data.type` | **not documented**. Parse `data.type` and don't rely on the `event:` line. | B |

## 2. Event list (from the "Responses streaming events" reference) and payload fields

The full list on REF-EVENTS, as read: response.created, response.in_progress, response.completed, response.failed, response.incomplete, response.output_item.added, response.output_item.done, response.content_part.added, response.content_part.done, response.output_text.delta, response.output_text.done, response.refusal.delta, response.refusal.done, response.function_call_arguments.delta/.done, response.file_search_call.in_progress/.searching/.completed, response.web_search_call.in_progress/.searching/.completed, response.reasoning_summary_part.added/.done, response.reasoning_summary_text.delta/.done, response.reasoning_text.delta/.done, response.image_generation_call.completed/.generating/.in_progress/.partial_image, response.mcp_call_arguments.delta/.done, response.mcp_call.completed/.failed/.in_progress, response.mcp_list_tools.completed/.failed/.in_progress, response.code_interpreter_call.in_progress/.interpreting/.completed, response.code_interpreter_call_code.delta/.done, response.output_text.annotation.added, response.queued, response.custom_tool_call_input.delta/.done, error, response.audio.delta/.done, response.audio.transcript.delta/.done, response.compaction.compacting, response.shell_call_command.added/.delta/.done, response.shell_call_output_content.delta/.done. (Grade A, list as read.)

| Event | Description (verbatim) | Top-level fields (schema) | Grade |
|---|---|---|---|
| response.queued | "Emitted when a response is queued and waiting to be processed." | response, sequence_number, type | A |
| response.created | "An event that is emitted when a response is created." | response, sequence_number, type | A |
| response.in_progress | "Emitted when the response is in progress." | response, sequence_number, type | A |
| response.output_item.added | "Emitted when a new output item is added." | item (plus output_index, sequence_number, type) | A for `item`; B for the rest (the schema is long; not individually re-quoted) |
| response.output_item.done | "Emitted when an output item is marked done." | item (plus output_index, sequence_number, type) | A / B as above |
| response.content_part.added | "Emitted when a new content part is added." | content_index, item_id, output_index, part, sequence_number, type | A |
| response.content_part.done | "Emitted when a content part is done." | content_index, item_id, output_index, part, sequence_number, type | A |
| response.output_text.delta | "Emitted when there is an additional text delta." | content_index, delta, item_id, logprobs, output_index, sequence_number, type | A |
| response.output_text.done | "Emitted when text content is finalized." | content_index, item_id, logprobs, output_index, sequence_number, text, type | A |
| response.refusal.delta | "Emitted when there is a partial refusal text." | content_index, delta, item_id, output_index, sequence_number, type | A |
| response.refusal.done | "Emitted when refusal text is finalized." | content_index, item_id, output_index, refusal, sequence_number, type | A |
| response.reasoning_summary_part.added | "Emitted when a new reasoning summary part is added." | item_id, output_index, part, sequence_number, summary_index, type | A |
| response.reasoning_summary_part.done | "Emitted when a reasoning summary part is completed." | item_id, output_index, part, sequence_number, summary_index, type, status | A |
| response.reasoning_summary_text.delta | "Emitted when a delta is added to a reasoning summary text." | delta, item_id, output_index, sequence_number, summary_index, type | A |
| response.reasoning_summary_text.done | "Emitted when a reasoning summary text is completed." | item_id, output_index, sequence_number, summary_index, text, type | A |
| response.reasoning_text.delta | "Emitted when a delta is added to a reasoning text." | content_index, delta, item_id, output_index, sequence_number, type | A |
| response.reasoning_text.done | "Emitted when a reasoning text is completed." | content_index, item_id, output_index, sequence_number, text, type | A |
| response.completed | "Emitted when the model response is complete." | response, sequence_number, type | A |
| response.incomplete | "An event that is emitted when a response finishes as incomplete." | response, sequence_number, type | A |
| response.failed | "An event that is emitted when a response fails." | response, sequence_number, type | A |
| error | "Emitted when an error occurs." | code, message, param, sequence_number, type | A |

Example (REF-EVENTS, `response.output_text.delta`, verbatim):
```json
{"type": "response.output_text.delta", "item_id": "msg_123", "output_index": 0, "content_index": 0, "delta": "In", "sequence_number": 1, "logprobs": []}
```

**sequence_number**

| Fact | Grade | Source |
|---|---|---|
| Every event schema on REF-EVENTS has `sequence_number: integer` (59 events, 59 occurrences), described as "The sequence number for this event." or "The sequence number of this event." | A | REF-EVENTS |
| "You will want to keep track of a "cursor" corresponding to the `sequence_number` you receive in each streaming event." Resume uses `?stream=true&starting_after=42`. | A | G-BG |
| That `sequence_number` is strictly increasing (or contiguous) | **not documented**. Its use as a `starting_after` cursor implies it is monotonic. | B |

## 3. Final usage

| Fact | Grade | Source |
|---|---|---|
| The Response object has "`usage: optional ResponseUsage or null` — Represents token usage details including input tokens, output tokens, a breakdown of output tokens, and the total tokens used." Fields: "`input_tokens: integer` The number of input tokens." · "`input_tokens_details` … `cached_tokens: integer` The number of tokens that were retrieved from the cache." (also `cache_write_tokens`) · "`output_tokens: integer` The number of output tokens." · "`output_tokens_details` … `reasoning_tokens: integer` The number of reasoning tokens." · "`total_tokens: integer` The total number of tokens used." | A | REF-EVENTS (Response schema) |
| The `response.completed` example carries `response.usage` with `input_tokens`, `output_tokens`, `output_tokens_details.reasoning_tokens`, `total_tokens`, `input_tokens_details.cached_tokens`. | A | REF-EVENTS |
| The `response.incomplete` and `response.failed` examples both print `"usage": null`. The `response.created` and `in_progress` examples also print `"usage": null`. | A (as printed in the examples) | REF-EVENTS |
| Whether real `incomplete` or `failed` events carry filled-in usage | **not documented** (the schema allows `ResponseUsage or null`). | — |
| Does `output_tokens` include `reasoning_tokens`? The reasoning guide's example: `"input_tokens": 75 … "output_tokens": 1186, "output_tokens_details": {"reasoning_tokens": 1024}, "total_tokens": 1261`. Also: reasoning tokens "are billed as output tokens". | A (the quotes) | G-REASON |
| Yes: 75 + 1186 = 1261, so `total_tokens` = input + output, and reasoning (1024) sits inside the 1186 output tokens. No explicit statement found. | B | from the example arithmetic |

## 4. How the response ends

| Fact | Grade | Source |
|---|---|---|
| "`status: optional ResponseStatus` — The status of the response generation. One of `completed`, `failed`, `in_progress`, `cancelled`, `queued`, or `incomplete`." | A | REF-EVENTS (Response schema) |
| "`incomplete_details: object { reason } or null` — Details about why the response is incomplete. `reason: optional "max_output_tokens" or "max_messages" or "content_filter" or "steered"`" ("`steered` means the response stopped at a safe output boundary after a WebSocket `response.steer` event.") | A | REF-EVENTS |
| "If the generated tokens reach the context window limit or the `max_output_tokens` value you've set, you'll receive a response with a `status` of `incomplete` and `incomplete_details` with `reason` set to `max_output_tokens`." | A | G-REASON |
| That a stream always ends with exactly one of `response.completed` / `response.incomplete` / `response.failed` | **not documented**. A stream can also end on an `error` event, or be cut by the network. | B |
| A `cancelled` terminal streaming event | **not documented** (no `response.cancelled` event appears in the list; `cancelled` exists only as a status value) | — |

## 5. Mid-stream errors

| Fact | Grade | Source |
|---|---|---|
| `error` event schema `ResponseErrorEvent`: "`code: string or null` The error code." · "`message: string` The error message." · "`param: string or null` The error parameter." · "`sequence_number: integer`" · "`type: "error"` The type of the event. Always `error`." | A | REF-EVENTS |
| Example: `{"type": "error", "code": "ERR_SOMETHING", "message": "Something went wrong", "param": null, "sequence_number": 1}` | A | REF-EVENTS |
| Codes for the `error` event | **not documented** (the example uses a placeholder) | — |
| `response.failed` carries `response.error` with "`code: "server_error" or "rate_limit_exceeded" or "invalid_prompt" or 18 more`", listed as: server_error, rate_limit_exceeded, invalid_prompt, data_residency_mismatch, bio_policy, misalignment_policy_violation, vector_store_timeout, invalid_image, invalid_image_format, invalid_base64_image, invalid_image_url, image_too_large, image_too_small, image_parse_error, image_content_policy_violation, invalid_image_mode, image_file_too_large, unsupported_image_media_type, empty_image_file, failed_to_download_image, image_file_not_found. | A | REF-EVENTS (ResponseError) |
| Retry guidance for streams: "For streaming requests, these HTTP error responses apply before the stream starts. An error after streaming begins can arrive as a stream event; don't automatically replay a request after consuming output." | A | G-RATE |
| General: `APITimeoutError` / `InternalServerError`: "Retry your request after a brief wait and contact us if the issue persists." `RateLimitError`: "Pace your requests and follow `Retry-After` when it's present, subject to your retry limits." | A | G-ERR |

## 6. New event types and unknown events

| Fact | Grade | Source |
|---|---|---|
| Under "Backwards-compatible API changes": "Adding new event types in streaming APIs" and "Adding new properties to JSON response objects or event data". | A | REF-OVERVIEW |
| How clients should treat unknown events | **not documented**. Since new types are a non-breaking change, a client should ignore unknown event types and unknown fields. | B |

## 7. Structured outputs with streaming

| Fact | Grade | Source |
|---|---|---|
| "You can use streaming to process model responses or function call arguments as they are being generated, and parse them as structured data." "We recommend relying on the SDKs to handle streaming with Structured Outputs." Its example sets `text: { format: zodTextFormat(...) }` with `.stream(...)` and listens on `response.output_text.delta`, `response.refusal.delta`, `response.output_text.done`. | A | G-SO ("Streaming") |
| Enabling: "`text: { format: { type: "json_schema", "strict": true, "schema": ... } }`". The reference: "Configuring `{ "type": "json_schema" }` enables Structured Outputs, which ensures the model will match your supplied JSON schema." | A | G-SO, REF-EVENTS (`text.format`) |
| An explicit compatibility statement that `json_schema` with `strict` is supported with `stream: true` on `/v1/responses` | **not documented** as a single statement. It is supported per the streaming section and example above. | B |
| "Structured Outputs constrains completed, non-refusal model output to your supplied JSON Schema." | A | G-SO |

## 8. gpt-6.1-sol

| Fact | Grade | Source |
|---|---|---|
| "128,000 max output tokens"; "1,050,000 context window"; "Maximum input tokens: 922,000"; "Reasoning token support" | A | MODEL |
| "`reasoning.effort` supports `low`, `medium` (default), `high`, `xhigh`, and `max`." The reasoning guide: GPT-6.1 Sol "does not support `none` or `minimal` and defaults to `medium`." | A | MODEL, G-REASON |
| Supported features include "streaming" and "structured_outputs". Endpoint "Responses \| `v1/responses` \| Supported". | A | MODEL |

## 9. Billing or usage on a stream the client drops or cancels

| Fact | Grade | Source |
|---|---|---|
| Billing when the client drops or cancels a stream mid-way | **not documented** | — |
| Related: a response that stops at `max_output_tokens` still costs money: "you could incur costs for input and reasoning tokens without receiving a visible response." | A | G-REASON |

## 10. Request id and rate-limit headers

| Fact | Grade | Source |
|---|---|---|
| "Common response headers include: … `x-request-id`: Unique identifier for this API request (used in troubleshooting)". Rate-limit headers: `x-ratelimit-limit-requests`, `x-ratelimit-limit-tokens`, `x-ratelimit-remaining-requests`, `x-ratelimit-remaining-tokens`, `x-ratelimit-reset-requests`, `x-ratelimit-reset-tokens`, plus `-project-tokens` variants. | A | REF-OVERVIEW |
| "In cases like timeouts or network issues when you can't get the `X-Request-Id` response header, you can share the `X-Client-Request-Id` value with the support team" | A | REF-OVERVIEW |
| That these headers are present on a streamed (SSE) response specifically | **not documented**. HTTP headers arrive before the stream body, so they are likely present. | B |
