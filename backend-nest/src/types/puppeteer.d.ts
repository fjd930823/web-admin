declare module 'puppeteer' {
  export interface Page {
    goto(url: string, options?: any): Promise<any>;
    waitForSelector(selector: string, options?: any): Promise<any>;
    evaluate(pageFunction: any): Promise<any>;
    setUserAgent(userAgent: string): Promise<void>;
    close(): Promise<void>;
  }

  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface LaunchOptions {
    headless?: boolean;
    args?: string[];
  }

  export function launch(options?: LaunchOptions): Promise<Browser>;
}