import { NextRequest, NextResponse } from "next/server";
import { getTodos, addTodo, completeTodo, deleteTodo } from "@/app/actions/todos";

// Helper function to create MCP responses
function toolResponse(content: string | Array<{type: string; text: string}>, isError = false) {
  return {
    content: Array.isArray(content) ? content : [{ type: "text", text: content }],
    ...(isError && { isError: true }),
  };
}

// Define tools
const tools: Record<string, any> = {
  ping: {
    name: "ping",
    description: "Health check for MCP endpoint - returns a confirmation message",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  getTasks: {
    name: "getTasks",
    description: "Retrieve all todo items from the database",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  addTask: {
    name: "addTask",
    description: "Create a new todo item",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The title/description of the todo task" },
      },
      required: ["title"],
    },
  },
  completeTask: {
    name: "completeTask",
    description: "Mark a todo item as completed",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", description: "The ID of the todo task to complete" },
      },
      required: ["id"],
    },
  },
  deleteTask: {
    name: "deleteTask",
    description: "Remove a todo item from the database",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", description: "The ID of the todo task to delete" },
      },
      required: ["id"],
    },
  },
};

// Handle tool calls
async function callTool(name: string, args: Record<string, any>) {
  switch (name) {
    case "ping":
      return toolResponse("✅ Pong from Next.js 15 To-Do MCP Server!");

    case "getTasks": {
      const todos = await getTodos();
      return toolResponse(
        JSON.stringify({
          success: true,
          count: todos.length,
          todos: todos.map(t => ({
            id: t.id,
            title: t.title,
            completed: Boolean(t.completed),
            createdAt: t.createdAt
          }))
        }, null, 2)
      );
    }

    case "addTask": {
      if (!args.title || args.title.trim().length === 0) {
        return toolResponse(
          JSON.stringify({ success: false, error: "Title cannot be empty" }, null, 2),
          true
        );
      }
      const result = await addTodo(args.title);
      if (result.success) {
        return toolResponse(
          JSON.stringify({
            success: true,
            message: `Task "${args.title}" added successfully`,
          }, null, 2)
        );
      } else {
        return toolResponse(
          JSON.stringify({
            success: false,
            error: result.error || "Failed to add task",
          }, null, 2),
          true
        );
      }
    }

    case "completeTask": {
      const result = await completeTodo(args.id);
      if (result.success) {
        return toolResponse(
          JSON.stringify({
            success: true,
            message: `Task #${args.id} marked as completed`,
          }, null, 2)
        );
      } else {
        return toolResponse(
          JSON.stringify({
            success: false,
            error: result.error || "Failed to complete task",
          }, null, 2),
          true
        );
      }
    }

    case "deleteTask": {
      const result = await deleteTodo(args.id);
      if (result.success) {
        return toolResponse(
          JSON.stringify({
            success: true,
            message: `Task #${args.id} deleted successfully`,
          }, null, 2)
        );
      } else {
        return toolResponse(
          JSON.stringify({
            success: false,
            error: result.error || "Failed to delete task",
          }, null, 2),
          true
        );
      }
    }

    default:
      return null;
  }
}

// MCP request handler
async function handleMcpRequest(req: NextRequest) {
  try {
    const body = await req.json() as any;
    const { jsonrpc = "2.0", method, params = {}, id } = body;

    // Handle tools/list
    if (method === "tools/list") {
      return {
        jsonrpc,
        id,
        result: {
          tools: Object.values(tools),
        },
      };
    }

    // Handle tools/call
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      
      if (!name || !tools[name]) {
        return {
          jsonrpc,
          id,
          error: {
            code: -32601,
            message: `Method not found: ${name}`,
          },
        };
      }

      const tool = tools[name];
      const result = await callTool(name, args || {});

      if (!result) {
        return {
          jsonrpc,
          id,
          error: {
            code: -32603,
            message: "Internal error",
          },
        };
      }

      return {
        jsonrpc,
        id,
        result,
      };
    }

    return {
      jsonrpc,
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    };
  } catch (error) {
    console.error("MCP Error:", error);
    return {
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: "Parse error",
      },
    };
  }
}

export async function POST(req: NextRequest) {
  const response = await handleMcpRequest(req);
  return NextResponse.json(response);
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    jsonrpc: "2.0",
    error: {
      code: -32600,
      message: "Invalid Request - Use POST method",
    },
  });
}


