export interface Policy {
  emails: boolean;
  phones: boolean;
  cards: boolean;
  faces?: boolean;
  plates?: boolean;
  ids?: boolean;
}

export interface RedactTextResponse {
  masked: string;
  spans: Array<{ start: number; end: number; label: string }>;
}

