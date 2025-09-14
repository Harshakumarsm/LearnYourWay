import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  User, 
  Calendar,
  Target 
} from "lucide-react";
import { socketService, type Todo } from "@/services/socket";
import { toast } from "sonner";

interface TodoListProps {
  todos: Todo[];
  currentUser: string;
}

export const TodoList = ({ todos, currentUser }: TodoListProps) => {
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    
    socketService.addTodo(newTodo.trim());
    setNewTodo("");
    toast.success("Todo added!");
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = () => {
    if (!editText.trim() || !editingId) return;
    
    socketService.updateTodo(editingId, { text: editText.trim() });
    setEditingId(null);
    setEditText("");
    toast.success("Todo updated!");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleToggleComplete = (todoId: string) => {
    socketService.toggleTodoComplete(todoId);
  };

  const handleDeleteTodo = (todoId: string) => {
    socketService.deleteTodo(todoId);
    toast.success("Todo deleted!");
  };

  const handleProgressUpdate = (todoId: string, progress: number) => {
    socketService.updateTodo(todoId, { progress });
  };

  const completedTodos = todos.filter(t => t.completed);
  const incompleteTodos = todos.filter(t => !t.completed);
  const overallProgress = todos.length > 0 ? (completedTodos.length / todos.length) * 100 : 0;

  const cardVariants = {
    initial: { x: -20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const todoVariants = {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: -20, 
      scale: 0.95,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-2 border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-emerald-600" />
              Shared Todos
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              {completedTodos.length}/{todos.length} completed
            </div>
          </CardTitle>
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <Progress 
              value={overallProgress} 
              className="h-2 [&>div]:bg-emerald-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add New Todo */}
          <div className="flex gap-2">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddTodo}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Todo List */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {/* Incomplete Todos */}
              {incompleteTodos.map((todo) => (
                <motion.div
                  key={todo.id}
                  variants={todoVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  className="group bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      {editingId === todo.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button 
                            size="sm" 
                            onClick={handleSaveEdit}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{todo.text}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTodo(todo)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Progress Bar for incomplete todos */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span>{todo.progress}%</span>
                            </div>
                            <Progress 
                              value={todo.progress} 
                              className="h-1 [&>div]:bg-emerald-500"
                            />
                            <div className="flex gap-1">
                              {[25, 50, 75, 100].map((value) => (
                                <Button
                                  key={value}
                                  size="sm"
                                  variant={todo.progress >= value ? "default" : "outline"}
                                  onClick={() => handleProgressUpdate(todo.id, value)}
                                  className="h-6 text-xs px-2"
                                >
                                  {value}%
                                </Button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Todo Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{todo.createdBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(todo.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Completed Todos */}
              {completedTodos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <Target className="w-4 h-4" />
                    Completed ({completedTodos.length})
                  </h4>
                  
                  {completedTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      variants={todoVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      className="group bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-2"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleToggleComplete(todo.id)}
                        />
                        <div className="flex-1">
                          <span className="text-sm line-through text-muted-foreground">
                            {todo.text}
                          </span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{todo.createdBy}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(todo.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {todos.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 text-muted-foreground"
              >
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No todos yet. Add your first task to get started!</p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
