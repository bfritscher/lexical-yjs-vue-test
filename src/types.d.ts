/// <reference types="node" />

declare module "@teamwork/websocket-json-stream" {
  import { Duplex } from "stream";
  import { WebSocket } from "ws";
  interface WebSocketJSONStreamOptions {
    objectMode: boolean;
    allowHalfOpen: boolean;
    emitClose: boolean;
  }

  export default class WebSocketJSONStream extends Duplex {
    constructor(ws: WebSocket);

    // Public methods
    _read(size?: number): void;
    _write(
      object: any,
      encoding: string,
      callback: (error?: Error | null) => void
    ): void;
    _send(json: string, callback: (error?: Error | null) => void): void;
    _final(callback: (error?: Error | null) => void): void;
    _destroy(
      error: Error | null,
      callback: (error?: Error | null) => void
    ): void;
    _closeWebSocket(
      code?: number,
      reason?: string,
      callback?: (error?: Error | null) => void
    ): void;

    // Properties
    private _emittedClose: boolean;
    private ws: WebSocket;
  }
}

declare module "rich-text" {
  import Delta from "quill-delta";
  import Op from "quill-delta/dist/Op";

  type DeltaOps =
    | Op[]
    | {
        ops: Op[];
      };
  type DeltaType = typeof Delta;

  export interface RichTextType {
    name: string;
    uri: string;

    create(initial: DeltaOps): DeltaType;
    apply(snapshot: DeltaOps, delta: DeltaOps): DeltaType;
    compose(delta1: DeltaOps, delta2: DeltaOps): DeltaType;
    diff(delta1: DeltaOps, delta2: DeltaOps): DeltaType;
    transform(
      delta1: DeltaOps,
      delta2: DeltaOps,
      side: "left" | "right"
    ): DeltaType;
    transformCursor(cursor: number, delta: DeltaOps, isOwnOp: boolean): number;
    normalize(delta: DeltaOps): DeltaType;
    serialize(delta: DeltaType): Op[];
    deserialize(ops: DeltaOps): DeltaType;
    transformPresence(
      range: Range,
      op: DeltaOps,
      isOwnOp: boolean
    ): Range | null;
  }

  export interface Range {
    index: number;
    length: number;
  }

  export const type: RichTextType;
}

declare module "y-websocket/bin/utils" {
  export function setPersistence(
    persistence_: {
      bindState: (arg0: string, arg1: WSSharedDoc) => void;
      writeState: (arg0: string, arg1: WSSharedDoc) => Promise<any>;
      provider: any;
    } | null
  ): void;
  export function getPersistence(): null | {
    bindState: (arg0: string, arg1: WSSharedDoc) => void;
    writeState: (arg0: string, arg1: WSSharedDoc) => Promise<any>;
  } | null;
  export function setContentInitializor(
    f: (ydoc: Y.Doc) => Promise<void>
  ): void;
  export function setupWSConnection(
    conn: import("ws").WebSocket,
    req: import("http").IncomingMessage,
    { docName, gc }?: any
  ): void;
  export class WSSharedDoc extends Y.Doc {
    /**
     * @param {string} name
     */
    constructor(name: string);
    name: string;
    /**
     * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
     * @type {Map<Object, Set<number>>}
     */
    conns: Map<any, Set<number>>;
    /**
     * @type {awarenessProtocol.Awareness}
     */
    awareness: awarenessProtocol.Awareness;
    whenInitialized: Promise<void>;
  }
  /**
   * @type {Map<string,WSSharedDoc>}
   */
  export const docs: Map<string, WSSharedDoc>;
  import Y = require("yjs");
  /**
   * Gets a Y.Doc by name, whether in memory or on disk
   *
   * @param {string} docname - the name of the Y.Doc to find or create
   * @param {boolean} gc - whether to allow gc on the doc (applies only when created)
   * @return {WSSharedDoc}
   */
  export function getYDoc(docname: string, gc?: boolean): WSSharedDoc;
  import awarenessProtocol = require("y-protocols/awareness");
}
