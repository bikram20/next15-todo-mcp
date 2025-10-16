import { getTodos, addTodo, completeTodo, deleteTodo } from './actions/todos';

async function TodoForm() {
  async function handleSubmit(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    await addTodo(title);
  }

  return (
    <form action={handleSubmit} className="mb-8">
      <div className="flex gap-2">
        <input
          type="text"
          name="title"
          placeholder="Enter a new task..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
        >
          Add Task
        </button>
      </div>
    </form>
  );
}

async function TodoItem({ todo }: { todo: { id: number; title: string; completed: number } }) {
  async function handleComplete() {
    'use server';
    await completeTodo(todo.id);
  }

  async function handleDelete() {
    'use server';
    await deleteTodo(todo.id);
  }

  return (
    <li className={`flex items-center justify-between p-4 bg-white rounded-lg border ${
      todo.completed ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
    } shadow-sm hover:shadow-md transition-shadow`}>
      <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
        {todo.title}
      </span>
      <div className="flex gap-2">
        {!todo.completed && (
          <form action={handleComplete}>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm font-medium"
            >
              Complete
            </button>
          </form>
        )}
        <form action={handleDelete}>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm font-medium"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}

export default async function Home() {
  const todos = await getTodos();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Todo App
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your tasks with ease
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <TodoForm />

          {todos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No tasks yet. Add one to get started!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </ul>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Total: {todos.length} tasks • Completed: {todos.filter(t => t.completed).length}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Built with Next.js 15, Server Actions, and SQLite
          </p>
        </div>
      </div>
    </div>
  );
}
