import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getTodos, addTodo, completeTodo, deleteTodo } from "@/app/actions/todos";

const handler = createMcpHandler(async (server) => {
  // Health check tool
  server.tool(
    "ping",
    "Health check for MCP endpoint - returns a confirmation message",
    {},
    async () => ({
      content: [{ type: "text", text: "✅ Pong from Next.js 15 To-Do MCP Server!" }],
    })
  );

  // Get all tasks
  server.tool(
    "getTasks",
    "Retrieve all todo items from the database",
    {},
    async () => {
      const todos = await getTodos();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              count: todos.length,
              todos: todos.map(t => ({
                id: t.id,
                title: t.title,
                completed: Boolean(t.completed),
                createdAt: t.createdAt
              }))
            }, null, 2)
          }
        ],
      };
    }
  );

  // Add a new task
  server.tool(
    "addTask",
    "Create a new todo item",
    {
      title: z.string().min(1).describe("The title/description of the todo task"),
    },
    async ({ title }) => {
      const result = await addTodo(title);
      
      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Task "${title}" added successfully`,
              }, null, 2)
            }
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: result.error || "Failed to add task",
              }, null, 2)
            }
          ],
          isError: true,
        };
      }
    }
  );

  // Complete a task
  server.tool(
    "completeTask",
    "Mark a todo item as completed",
    {
      id: z.number().int().positive().describe("The ID of the todo task to complete"),
    },
    async ({ id }) => {
      const result = await completeTodo(id);
      
      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Task #${id} marked as completed`,
              }, null, 2)
            }
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: result.error || "Failed to complete task",
              }, null, 2)
            }
          ],
          isError: true,
        };
      }
    }
  );

  // Delete a task
  server.tool(
    "deleteTask",
    "Remove a todo item from the database",
    {
      id: z.number().int().positive().describe("The ID of the todo task to delete"),
    },
    async ({ id }) => {
      const result = await deleteTodo(id);
      
      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Task #${id} deleted successfully`,
              }, null, 2)
            }
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: result.error || "Failed to delete task",
              }, null, 2)
            }
          ],
          isError: true,
        };
      }
    }
  );
});

export const GET = handler;
export const POST = handler;


