import type { IncomingMessage, ServerResponse } from 'node:http';

type JsonBody = unknown;

export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
  cookies: Record<string, string>;
  body?: unknown;
}

export interface VercelResponse extends ServerResponse {
  status(statusCode: number): VercelResponse;
  json(body: JsonBody): VercelResponse;
  send(body: unknown): VercelResponse;
}
