import * as fs from 'fs';
import * as path from 'path';
import { APIRequestContext } from '@playwright/test';

const TEST_DATA_DIR = path.join(__dirname, '../../go/data-test');

interface TestDataConfig {
  baseUrl: string;
  testPrefix: string;
}

class TestDataManagement {
  private config: TestDataConfig;
  private createdNotes: string[] = [];
  private createdFolders: string[] = [];

  constructor(config: TestDataConfig) {
    this.config = config;
  }

  async setup(): Promise<void> {
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
  }

  async cleanup(): Promise<void> {
    for (const notePath of this.createdNotes) {
      try {
        const fullPath = path.join(TEST_DATA_DIR, notePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error(`Failed to delete note ${notePath}:`, error);
      }
    }

    const reversedFolders = [...this.createdFolders].reverse();
    for (const folderPath of reversedFolders) {
      try {
        const fullPath = path.join(TEST_DATA_DIR, folderPath);
        if (fs.existsSync(fullPath)) {
          fs.rmdirSync(fullPath, { recursive: true });
        }
      } catch (error) {
        console.error(`Failed to delete folder ${folderPath}:`, error);
      }
    }

    this.createdNotes = [];
    this.createdFolders = [];
  }

  async createTestNote(request: APIRequestContext, name: string, content: string = ''): Promise<string> {
    const notePath = `${name}.md`;
    
    const response = await request.post('/api/note', {
      data: {
        path: notePath,
        content: content || `# ${name}\n\nTest content created at ${new Date().toISOString()}`
      }
    });

    if (response.ok()) {
      this.createdNotes.push(notePath);
      return notePath;
    } else {
      throw new Error(`Failed to create note: ${await response.text()}`);
    }
  }

  async createTestFolder(request: APIRequestContext, folderPath: string): Promise<string> {
    const response = await request.post('/api/folder', {
      data: { path: folderPath }
    });

    if (response.ok()) {
      this.createdFolders.push(folderPath);
      return folderPath;
    } else {
      throw new Error(`Failed to create folder: ${await response.text()}`);
    }
  }

  async deleteTestNote(request: APIRequestContext, notePath: string): Promise<void> {
    const encodedPath = encodeURIComponent(notePath);
    const response = await request.delete(`/api/note/${encodedPath}`);
    
    if (!response.ok()) {
      throw new Error(`Failed to delete note: ${await response.text()}`);
    }
    
    const index = this.createdNotes.indexOf(notePath);
    if (index > -1) {
      this.createdNotes.splice(index, 1);
    }
  }

  async deleteTestFolder(request: APIRequestContext, folderPath: string): Promise<void> {
    const encodedPath = encodeURIComponent(folderPath);
    const response = await request.delete(`/api/folder/${encodedPath}`);
    
    if (!response.ok()) {
      throw new Error(`Failed to delete folder: ${await response.text()}`);
    }
    
    const index = this.createdFolders.indexOf(folderPath);
    if (index > -1) {
      this.createdFolders.splice(index, 1);
    }
  }

  getTestDataDir(): string {
    return TEST_DATA_DIR;
  }

  getCreatedNotes(): string[] {
    return [...this.createdNotes];
  }

  getCreatedFolders(): string[] {
    return [...this.createdFolders];
  }
}

function createTestDataManagement(config: TestDataConfig): TestDataManagement {
  return new TestDataManagement(config);
}

export { TestDataManagement, createTestDataManagement, TEST_DATA_DIR };
