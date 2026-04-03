import { Tool } from './tool';

export interface ToolRegistry {
    version: string;
    tools: Tool[];
}
