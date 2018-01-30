

export abstract class Parser {
  abstract loadFromFile(fileName: string): Promise<void>;
  abstract parse(): Promise<void>;
}
